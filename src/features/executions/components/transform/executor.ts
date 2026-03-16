import jsonata from "jsonata";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { transformChannel } from "@/inngest/channels/transform";

type TransformMapping = {
  key: string;
  expression: string;
};

type TransformData = {
  variableName?: string;
  mappings?: TransformMapping[];
};

export const transformExecutor: NodeExecutor<TransformData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(transformChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(transformChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Transform node: Variable name is required");
  }

  if (!data.mappings || data.mappings.length === 0) {
    await publish(transformChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Transform node: At least one mapping is required");
  }

  const result = await step.run(`transform-evaluate-${nodeId}`, async () => {
    const output: Record<string, unknown> = {};

    for (const mapping of data.mappings!) {
      if (!mapping.key || !mapping.expression) continue;

      try {
        const expression = jsonata(mapping.expression);
        const value = await expression.evaluate(context);
        output[mapping.key] = value;
      } catch (err) {
        throw new Error(
          `Transform node: Error evaluating expression for key "${mapping.key}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return output;
  });

  await publish(transformChannel().status({ nodeId, status: "success" }));

  return {
    ...context,
    [data.variableName!]: result,
  };
};
