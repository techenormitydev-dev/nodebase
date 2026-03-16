import { inngest } from "./client";
import prisma from "@/lib/db";
import { NodeType } from "@/generated/prisma";
import { sendWorkflowExecution } from "./utils";
import { CronExpressionParser } from "cron-parser";

/**
 * Checks whether a cron expression should have fired within the last minute.
 * Strategy: find the next occurrence after (now - 60 s). If it is ≤ now,
 * the cron was scheduled to fire in this window.
 */
function shouldRunNow(cronExpression: string, timezone: string): boolean {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60_000);

    const options: Parameters<typeof CronExpressionParser.parse>[1] = {
      currentDate: windowStart,
      tz: timezone !== "UTC" ? timezone : undefined,
    };

    const interval = CronExpressionParser.parse(cronExpression, options);
    const nextOccurrence = interval.next().toDate();
    return nextOccurrence <= now;
  } catch {
    return false; // Invalid expression or no occurrence — skip silently
  }
}

export const cronDispatcher = inngest.createFunction(
  { id: "cron-dispatcher" },
  { cron: "* * * * *" }, // Runs every minute
  async ({ step }) => {
    // Find all workflows that have a CRON_TRIGGER node
    const workflows = await step.run("find-cron-workflows", async () => {
      return prisma.workflow.findMany({
        where: {
          nodes: { some: { type: NodeType.CRON_TRIGGER } },
        },
        include: {
          nodes: {
            where: { type: NodeType.CRON_TRIGGER },
          },
        },
      });
    });

    if (workflows.length === 0) return { dispatched: 0 };

    let dispatched = 0;

    for (const workflow of workflows) {
      const cronNode = workflow.nodes[0];
      if (!cronNode) continue;

      const data = cronNode.data as {
        cronExpression?: string;
        timezone?: string;
      };

      if (!data.cronExpression) continue;

      const timezone = data.timezone ?? "UTC";

      if (!shouldRunNow(data.cronExpression, timezone)) continue;

      await step.run(`dispatch-${workflow.id}`, async () => {
        await sendWorkflowExecution({
          workflowId: workflow.id,
          initialData: {
            triggeredBy: "cron",
            scheduledAt: new Date().toISOString(),
            cronExpression: data.cronExpression,
          },
        });
      });

      dispatched++;
    }

    return { dispatched };
  },
);
