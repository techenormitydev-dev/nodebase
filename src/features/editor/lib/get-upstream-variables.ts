import type { Edge, Node } from "@xyflow/react";

export interface UpstreamVariable {
  label: string;
  value: string;
  nodeName: string;
}

function getVariablesForNode(nodeType: string, varName: string): UpstreamVariable[] {
  switch (nodeType) {
    case "HTTP_REQUEST":
      return [
        { label: `${varName}.httpResponse.status`, value: `{{${varName}.httpResponse.status}}`, nodeName: varName },
        { label: `${varName}.httpResponse.data`, value: `{{${varName}.httpResponse.data}}`, nodeName: varName },
        { label: `json ${varName}.httpResponse.data`, value: `{{json ${varName}.httpResponse.data}}`, nodeName: varName },
      ];
    case "ANTHROPIC":
    case "OPENAI":
    case "GEMINI":
      return [
        { label: `${varName}.text`, value: `{{${varName}.text}}`, nodeName: varName },
      ];
    case "CONDITIONAL":
      return [
        { label: `${varName}.branch`, value: `{{${varName}.branch}}`, nodeName: varName },
      ];
    case "SLACK":
    case "DISCORD":
    case "TRANSFORM":
      return [
        { label: varName, value: `{{${varName}}}`, nodeName: varName },
      ];
    case "GOOGLE_FORM_TRIGGER":
      return [
        { label: "trigger.formData", value: "{{trigger.formData}}", nodeName: "trigger" },
      ];
    case "STRIPE_TRIGGER":
      return [
        { label: "trigger.event", value: "{{trigger.event}}", nodeName: "trigger" },
        { label: "trigger.data", value: "{{trigger.data}}", nodeName: "trigger" },
      ];
    default:
      return [];
  }
}

export function getUpstreamVariables(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  visited = new Set<string>(),
): UpstreamVariable[] {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);

  const incomingEdges = edges.filter((e) => e.target === nodeId);
  const variables: UpstreamVariable[] = [];

  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const varName = (sourceNode.data as Record<string, unknown>).variableName as string | undefined;
    if (varName && sourceNode.type) {
      variables.push(...getVariablesForNode(sourceNode.type, varName));
    }

    // Recurse to collect variables from further upstream
    variables.push(...getUpstreamVariables(edge.source, nodes, edges, visited));
  }

  return variables;
}
