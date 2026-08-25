export type RewardRecordStatus = "CLAIMED" | "REDEEMED" | "EXPIRED";

export interface RewardRecord {
  id: string;
  sessionId: string;
  rewardType: string;
  code: string;
  status: RewardRecordStatus;
  claimedAt: Date;
  redeemedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
