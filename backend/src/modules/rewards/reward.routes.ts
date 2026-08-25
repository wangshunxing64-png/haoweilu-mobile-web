import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { IdempotencyService } from "../../common/idempotency/idempotency.service.ts";
import type { AppStore } from "../../infrastructure/database/store.ts";
import { RewardService } from "./reward.service.ts";

const claimSchema = z.object({ sessionId: z.string().min(1).max(128) }).strict();

export async function registerRewardRoutes(
  app: FastifyInstance,
  store: AppStore,
  idempotency: IdempotencyService,
): Promise<void> {
  const service = new RewardService(store);

  app.post("/api/rewards/claim", {
    schema: {
      tags: ["Reward"],
      summary: "领取一次性奖励核销码",
      body: {
        type: "object",
        required: ["sessionId"],
        additionalProperties: false,
        properties: { sessionId: { type: "string" } },
      },
    },
  }, async (request) => {
    const { sessionId } = claimSchema.parse(request.body);
    const key = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined;
    return idempotency.run("reward-claim", key, () => service.claim(sessionId));
  });
}
