"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { transformChannel } from "@/inngest/channels/transform";
import { inngest } from "@/inngest/client";

export type TransformToken = Realtime.Token<
  typeof transformChannel,
  ["status"]
>;

export async function fetchTransformRealtimeToken(): Promise<TransformToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: transformChannel(),
    topics: ["status"],
  });

  return token;
}
