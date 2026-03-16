"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { conditionalChannel } from "@/inngest/channels/conditional";
import { inngest } from "@/inngest/client";

export type ConditionalToken = Realtime.Token<
  typeof conditionalChannel,
  ["status"]
>;

export async function fetchConditionalRealtimeToken(): Promise<ConditionalToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: conditionalChannel(),
    topics: ["status"],
  });

  return token;
}
