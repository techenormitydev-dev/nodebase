import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { slackChannel } from "@/inngest/channels/slack";
import ky from "ky";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const safeString = new Handlebars.SafeString(jsonString);

  return safeString;
});

type SlackData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  maxRetries?: number;
};

export const slackExecutor: NodeExecutor<SlackData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    slackChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.content) {
    await publish(
      slackChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw new NonRetriableError("Slack node: Message content is required");
  }

  const rawContent = Handlebars.compile(data.content)(context);
  const content = decode(rawContent);

  if (!data.webhookUrl) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Slack node: Webhook URL is required");
  }

  if (!data.variableName) {
    await publish(slackChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Slack node: Variable name is missing");
  }

  const maxRetries = data.maxRetries ?? 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await step.run(`slack-webhook-attempt-${attempt}`, async () => {
        await ky.post(data.webhookUrl!, { json: { text: content } });
        return {
          ...context,
          [data.variableName!]: {
            messageContent: content.slice(0, 2000),
          },
        };
      });

      await publish(slackChannel().status({ nodeId, status: "success" }));
      return result;
    } catch (error) {
      lastError = error;
    }
  }

  await publish(slackChannel().status({ nodeId, status: "error" }));
  throw lastError;
};
