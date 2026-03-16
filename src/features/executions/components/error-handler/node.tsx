"use client";

import { useReactFlow, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorHandlerDialog, ErrorHandlerFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchErrorHandlerRealtimeToken } from "./actions";
import { ERROR_HANDLER_CHANNEL_NAME } from "@/inngest/channels/error-handler";
import { WorkflowNode } from "@/components/workflow-node";
import { BaseNode, BaseNodeContent } from "@/components/react-flow/base-node";
import { BaseHandle } from "@/components/react-flow/base-handle";
import { NodeStatusIndicator } from "@/components/react-flow/node-status-indicator";

type ErrorHandlerNodeData = {
  webhookUrl?: string;
  message?: string;
  variableName?: string;
};

type ErrorHandlerNodeType = Node<ErrorHandlerNodeData>;

export const ErrorHandlerNode = memo((props: NodeProps<ErrorHandlerNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: ERROR_HANDLER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchErrorHandlerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: ErrorHandlerFormValues) => {
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
    const { setNodes: deleteNodes, setEdges } = props as any;
    setNodes((currentNodes: any[]) => currentNodes.filter((n: any) => n.id !== props.id));
    setEdges((currentEdges: any[]) =>
      currentEdges.filter((e: any) => e.source !== props.id && e.target !== props.id),
    );
  };

  const nodeData = props.data;
  const description = nodeData?.webhookUrl ? "Sends error to Slack" : "Not configured";

  return (
    <>
      <ErrorHandlerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <WorkflowNode
        name="Error Handler"
        description={description}
        onDelete={handleDelete}
        onSettings={handleOpenSettings}
      >
        <NodeStatusIndicator status={nodeStatus} variant="border">
          <BaseNode
            status={nodeStatus}
            onDoubleClick={handleOpenSettings}
            className="border-red-500/60 bg-red-950/20"
          >
            <BaseNodeContent>
              <AlertTriangle className="size-4 text-red-400" />
              <BaseHandle
                id="target-1"
                type="target"
                position={Position.Left}
              />
            </BaseNodeContent>
          </BaseNode>
        </NodeStatusIndicator>
      </WorkflowNode>
    </>
  );
});

ErrorHandlerNode.displayName = "ErrorHandlerNode";
