"use client";

import { memo, useState } from "react";
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { ClockIcon } from "lucide-react";
import { BaseTriggerNode } from "../base-trigger-node";
import { CronTriggerDialog, CronTriggerFormValues } from "./dialog";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { fetchCronTriggerRealtimeToken } from "./actions";
import { CRON_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/cron-trigger";

type CronTriggerNodeData = {
  cronExpression?: string;
  timezone?: string;
  variableName?: string;
};

export const CronTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: CRON_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchCronTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: CronTriggerFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const data = props.data as CronTriggerNodeData;
  const label = data?.cronExpression ?? "Not configured";

  return (
    <>
      <CronTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={data}
      />
      <BaseTriggerNode
        {...props}
        icon={ClockIcon}
        name="Cron Schedule"
        description={label}
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

CronTriggerNode.displayName = "CronTriggerNode";
