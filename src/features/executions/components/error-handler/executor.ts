import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { errorHandlerChannel } from "@/inngest/channels/error-handler";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

type ErrorHandlerData = {
  variableName?: string;
  webhookUrl?: string;
  message?: string;
};

export const errorHandlerExecutor: NodeExecutor<ErrorHandlerData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    errorHandlerChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.webhookUrl) {
    await publish(errorHandlerChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Error Handler: Webhook URL is required");
  }

  if (!data.message) {
    await publish(errorHandlerChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Error Handler: Message template is required");
  }

  if (!data.variableName) {
    await publish(errorHandlerChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Error Handler: Variable name is required");
  }

  const rawMessage = Handlebars.compile(data.message)(context);
  const message = decode(rawMessage);

  try {
    const result = await step.run("error-handler-webhook", async () => {
      await ky.post(data.webhookUrl!, {
        json: { text: message },
      });

      return {
        ...context,
        [data.variableName!]: {
          messageContent: message.slice(0, 2000),
        },
      };
    });

    await publish(errorHandlerChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(errorHandlerChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
