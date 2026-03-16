"use client";

import { useReactFlow, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { GitFork } from "lucide-react";
import { ConditionalDialog, ConditionalFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchConditionalRealtimeToken } from "./actions";
import { CONDITIONAL_CHANNEL_NAME } from "@/inngest/channels/conditional";
import { WorkflowNode } from "@/components/workflow-node";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";

type ConditionalNodeData = {
  condition?: string;
  variableName?: string;
};

type ConditionalNodeType = Node<ConditionalNodeData>;

export const ConditionalNode = memo((props: NodeProps<ConditionalNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes, setEdges } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: CONDITIONAL_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchConditionalRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: ConditionalFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return { ...node, data: { ...node.data, ...values } };
        }
        return node;
      }),
    );
  };

  const handleDelete = () => {
    setNodes((currentNodes) => currentNodes.filter((n) => n.id !== props.id));
    setEdges((currentEdges) =>
      currentEdges.filter((e) => e.source !== props.id && e.target !== props.id),
    );
  };

  const nodeData = props.data;
  const description = nodeData?.condition
    ? nodeData.condition.slice(0, 40)
    : "Not configured";

  return (
    <>
      <ConditionalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <WorkflowNode
        name="Conditional"
        description={description}
        onDelete={handleDelete}
        onSettings={handleOpenSettings}
      >
        <NodeStatusIndicator status={nodeStatus} variant="border">
          <BaseNode
            status={nodeStatus}
            onDoubleClick={handleOpenSettings}
            className="border-yellow-500/60 bg-yellow-950/10"
          >
            <BaseNodeContent>
              <GitFork className="size-4 text-yellow-400" />

              {/* True / False branch labels visible in node body */}
              <div className="flex flex-col gap-3 text-[9px] font-bold leading-none select-none">
                <span className="text-green-500">TRUE</span>
                <span className="text-red-500">FALSE</span>
              </div>

              {/* Input handle on the left */}
              <BaseHandle
                id="target-1"
                type="target"
                position={Position.Left}
              />

              {/* True branch handle - top right */}
              <BaseHandle
                id="true"
                type="source"
                position={Position.Right}
                style={{ top: "30%", bottom: "auto" }}
                className="!bg-green-500 !border-green-400"
              />

              {/* False branch handle - bottom right */}
              <BaseHandle
                id="false"
                type="source"
                position={Position.Right}
                style={{ top: "70%", bottom: "auto" }}
                className="!bg-red-500 !border-red-400"
              />
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkflowNode>
    </>
  );
});

ConditionalNode.displayName = "ConditionalNode";
