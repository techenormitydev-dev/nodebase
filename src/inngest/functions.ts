import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { errorHandlerChannel } from "./channels/error-handler";
import { conditionalChannel } from "./channels/conditional";
import { cronTriggerChannel } from "./channels/cron-trigger";
import { transformChannel } from "./channels/transform";

export const executeWorkflow = inngest.createFunction(
  { 
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event, step }) => {
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  { 
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
      errorHandlerChannel(),
      conditionalChannel(),
      cronTriggerChannel(),
      transformChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    await step.run("create-execution", async () => {
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
        },
      });
    });

    const { sortedNodes, errorHandlerNode, mainConnections } = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      const errorHandler = workflow.nodes.find((n) => n.type === NodeType.ERROR_HANDLER) ?? null;
      const mainNodes = workflow.nodes.filter((n) => n.type !== NodeType.ERROR_HANDLER);
      const connections = workflow.connections.filter(
        (c) => c.toNodeId !== errorHandler?.id && c.fromNodeId !== errorHandler?.id,
      );

      return {
        sortedNodes: topologicalSort(mainNodes, connections),
        errorHandlerNode: errorHandler,
        mainConnections: connections,
      };
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: {
          userId: true,
        },
      });

      return workflow.userId;
    });

    // Initialize context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Build incoming-connection map for branch-aware execution
    const incomingConnectionsMap = new Map<string, Array<{ fromNodeId: string; fromOutput: string }>>();
    for (const conn of mainConnections) {
      if (!incomingConnectionsMap.has(conn.toNodeId)) {
        incomingConnectionsMap.set(conn.toNodeId, []);
      }
      incomingConnectionsMap.get(conn.toNodeId)!.push({
        fromNodeId: conn.fromNodeId,
        fromOutput: conn.fromOutput,
      });
    }

    // Track which nodes have been executed and which branch conditional nodes took.
    // We intentionally don't compare fromOutput handle IDs for regular nodes because
    // they use the React Flow handle id ("source-1") in the DB, not a semantic name.
    // Conditional nodes explicitly set fromOutput to "true" or "false".
    const executedNodes = new Set<string>();
    const conditionalBranches = new Map<string, string>(); // nodeId -> "true" | "false"

    // Execute each node in topological order
    for (const node of sortedNodes) {
      const incomingConns = incomingConnectionsMap.get(node.id) ?? [];

      if (incomingConns.length > 0) {
        const isReachable = incomingConns.some((conn) => {
          if (!executedNodes.has(conn.fromNodeId)) return false;
          // For edges leaving a CONDITIONAL node, only the taken branch is active
          const branch = conditionalBranches.get(conn.fromNodeId);
          if (branch !== undefined) {
            return conn.fromOutput === branch;
          }
          // For all other nodes every outgoing edge is active once the node ran
          return true;
        });

        if (!isReachable) {
          // Node is on a branch that was not taken — skip it
          continue;
        }
      }

      const executor = getExecutor(node.type as NodeType);
      try {
        context = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish,
        });
      } catch (error) {
        if (errorHandlerNode) {
          const errorHandlerExecutor = getExecutor(NodeType.ERROR_HANDLER);
          const errorContext = {
            ...context,
            error: {
              message: error instanceof Error ? error.message : String(error),
              nodeName: node.name,
              nodeId: node.id,
            },
          };
          context = await errorHandlerExecutor({
            data: errorHandlerNode.data as Record<string, unknown>,
            nodeId: errorHandlerNode.id,
            userId,
            context: errorContext,
            step,
            publish,
          });
        } else {
          throw error;
        }
      }

      executedNodes.add(node.id);

      // For conditional nodes record which branch was taken so downstream
      // reachability checks can filter by "true" / "false" fromOutput
      if (node.type === NodeType.CONDITIONAL) {
        const branch = context[`__conditional_${node.id}`] as string | undefined;
        if (branch) {
          conditionalBranches.set(node.id, branch);
        }
      }
    }

    await step.run("update-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        },
      })
    });

    return {
      workflowId,
      result: context,
    };
  },
);
