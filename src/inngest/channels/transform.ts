import { channel, topic } from "@inngest/realtime";

export const TRANSFORM_CHANNEL_NAME = "transform-execution";

export const transformChannel = channel(TRANSFORM_CHANNEL_NAME)
  .addTopic(
    topic("status").type<{
      nodeId: string;
      status: "loading" | "success" | "error";
    }>(),
  );
