import type { NodeExecutor } from "@/features/executions/types";
import { cronTriggerChannel } from "@/inngest/channels/cron-trigger";

type CronTriggerData = {
  cronExpression?: string;
  timezone?: string;
  variableName?: string;
};

export const cronTriggerExecutor: NodeExecutor<CronTriggerData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(cronTriggerChannel().status({ nodeId, status: "loading" }));

  const result = await step.run("cron-trigger", async () => {
    return {
      ...context,
      ...(data.variableName
        ? {
            [data.variableName]: {
              triggeredAt: new Date().toISOString(),
              cronExpression: data.cronExpression,
              timezone: data.timezone ?? "UTC",
            },
          }
        : {}),
    };
  });

  await publish(cronTriggerChannel().status({ nodeId, status: "success" }));

  return result;
};
