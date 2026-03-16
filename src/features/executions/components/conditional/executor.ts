import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { conditionalChannel } from "@/inngest/channels/conditional";

// Register comparison helpers
const helpers: Record<string, (...args: unknown[]) => string> = {
  eq: (a, b) => String(a) === String(b) ? "true" : "false",
  ne: (a, b) => String(a) !== String(b) ? "true" : "false",
  gt: (a, b) => Number(a) > Number(b) ? "true" : "false",
  lt: (a, b) => Number(a) < Number(b) ? "true" : "false",
  gte: (a, b) => Number(a) >= Number(b) ? "true" : "false",
  lte: (a, b) => Number(a) <= Number(b) ? "true" : "false",
  and: (...args) => {
    const values = args.slice(0, -1); // last arg is Handlebars options
    return values.every((v) => v === "true" || (Boolean(v) && v !== "false" && v !== "0")) ? "true" : "false";
  },
  or: (...args) => {
    const values = args.slice(0, -1);
    return values.some((v) => v === "true" || (Boolean(v) && v !== "false" && v !== "0")) ? "true" : "false";
  },
  not: (a) => (a === "true" || (Boolean(a) && a !== "false" && a !== "0")) ? "false" : "true",
};

for (const [name, fn] of Object.entries(helpers)) {
  if (!Handlebars.helpers[name]) {
    Handlebars.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
}

function evaluateResult(rendered: string): boolean {
  const trimmed = rendered.trim().toLowerCase();
  if (!trimmed || trimmed === "false" || trimmed === "0" || trimmed === "no") {
    return false;
  }
  return true;
}

type ConditionalData = {
  condition?: string;
  variableName?: string;
};

export const conditionalExecutor: NodeExecutor<ConditionalData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    conditionalChannel().status({ nodeId, status: "loading" }),
  );

  if (!data.condition) {
    await publish(conditionalChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Conditional node: Condition expression is required");
  }

  if (!data.variableName) {
    await publish(conditionalChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Conditional node: Variable name is required");
  }

  const result = await step.run(`conditional-evaluate-${nodeId}`, async () => {
    const rawRendered = Handlebars.compile(data.condition!)(context);
    const rendered = decode(rawRendered);
    const branch = evaluateResult(rendered) ? "true" : "false";

    return {
      branch,
      rendered,
    };
  });

  await publish(
    conditionalChannel().status({ nodeId, status: "success", branch: result.branch as "true" | "false" }),
  );

  return {
    ...context,
    [data.variableName!]: {
      branch: result.branch,
      rendered: result.rendered,
    },
    [`__conditional_${nodeId}`]: result.branch,
  };
};
