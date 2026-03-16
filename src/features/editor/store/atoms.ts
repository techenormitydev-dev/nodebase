import type { ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

// Set to true when a workflow execution starts so nodes can subscribe to realtime
export const isExecutingAtom = atom<boolean>(false);
