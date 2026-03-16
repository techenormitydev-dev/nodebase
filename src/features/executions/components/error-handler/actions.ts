"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { errorHandlerChannel } from "@/inngest/channels/error-handler";
import { inngest } from "@/inngest/client";

export type ErrorHandlerToken = Realtime.Token<
  typeof errorHandlerChannel,
  ["status"]
>;

export async function fetchErrorHandlerRealtimeToken(): Promise<ErrorHandlerToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: errorHandlerChannel(),
    topics: ["status"],
  });

  return token;
}
