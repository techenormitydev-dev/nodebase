import { channel, topic } from "@inngest/realtime";

export const ERROR_HANDLER_CHANNEL_NAME = "error-handler-execution";

export const errorHandlerChannel = channel(ERROR_HANDLER_CHANNEL_NAME)
  .addTopic(
    topic("status").type<{
      nodeId: string;
      status: "loading" | "success" | "error";
    }>(),
  );
