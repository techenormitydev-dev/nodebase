import { channel, topic } from "@inngest/realtime";

export const CONDITIONAL_CHANNEL_NAME = "conditional-execution";

export const conditionalChannel = channel(CONDITIONAL_CHANNEL_NAME)
  .addTopic(
    topic("status").type<{
      nodeId: string;
      status: "loading" | "success" | "error";
      branch?: "true" | "false";
    }>(),
  );
