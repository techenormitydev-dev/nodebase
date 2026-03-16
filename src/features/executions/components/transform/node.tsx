"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { ArrowLeftRightIcon } from "lucide-react";
import { BaseExecutionNode } from "../base-execution-node";
import { TransformDialog, TransformFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { TRANSFORM_CHANNEL_NAME } from "@/inngest/channels/transform";
import { fetchTransformRealtimeToken } from "./actions";

type TransformNodeData = {
  variableName?: string;
  mappings?: { key: string; expression: string }[];
};

type TransformNodeType = Node<TransformNodeData>;

export const TransformNode = memo((props: NodeProps<TransformNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: TRANSFORM_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchTransformRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: TransformFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const nodeData = props.data;
  const mappingCount = nodeData?.mappings?.length ?? 0;
  const description = mappingCount > 0
    ? `${mappingCount} field${mappingCount === 1 ? "" : "s"} mapped`
    : "Not configured";

  return (
    <>
      <TransformDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={ArrowLeftRightIcon}
        name="Transform"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

TransformNode.displayName = "TransformNode";
