-- CreateEnum
CREATE TYPE "ReviewSessionStatus" AS ENUM ('CREATED', 'INTERVIEWING', 'GENERATING', 'GENERATED', 'SELECTED', 'PUBLISH_PREPARED', 'PUBLISH_CONFIRMED', 'REWARDED');
CREATE TYPE "RewardStatus" AS ENUM ('CLAIMED', 'REDEEMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "theme" JSONB NOT NULL,
    "copy" JSONB NOT NULL,
    "rules" JSONB NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'local-template',
    "aiModel" TEXT,
    "aiFallbackToLocal" BOOLEAN NOT NULL DEFAULT true,
    "reviewStyles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperienceTag" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "groupExternalId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupSortOrder" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExperienceTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublishPlatform" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "actionHint" TEXT NOT NULL,
    "miniProgram" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublishPlatform_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewSession" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "anonymousId" TEXT,
    "openId" TEXT,
    "dishIds" JSONB NOT NULL,
    "tagIds" JSONB NOT NULL,
    "message" VARCHAR(120) NOT NULL DEFAULT '',
    "selectedReviewId" TEXT,
    "selectedPlatformId" TEXT,
    "status" "ReviewSessionStatus" NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "styleName" TEXT NOT NULL,
    "styleLabel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublishRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "platformExternalId" TEXT NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublishRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'CLAIMED',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RewardRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "storeId" TEXT,
    "sessionId" TEXT,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "Merchant_storageKey_key" ON "Merchant"("storageKey");
CREATE UNIQUE INDEX "Store_merchantId_externalId_key" ON "Store"("merchantId", "externalId");
CREATE UNIQUE INDEX "Dish_merchantId_storeId_externalId_key" ON "Dish"("merchantId", "storeId", "externalId");
CREATE UNIQUE INDEX "ExperienceTag_merchantId_storeId_externalId_key" ON "ExperienceTag"("merchantId", "storeId", "externalId");
CREATE UNIQUE INDEX "PublishPlatform_merchantId_storeId_externalId_key" ON "PublishPlatform"("merchantId", "storeId", "externalId");
CREATE UNIQUE INDEX "PublishRecord_sessionId_key" ON "PublishRecord"("sessionId");
CREATE UNIQUE INDEX "RewardRecord_sessionId_key" ON "RewardRecord"("sessionId");
CREATE UNIQUE INDEX "RewardRecord_code_key" ON "RewardRecord"("code");

-- Query indexes
CREATE INDEX "Store_merchantId_active_idx" ON "Store"("merchantId", "active");
CREATE INDEX "Dish_merchantId_storeId_active_sortOrder_idx" ON "Dish"("merchantId", "storeId", "active", "sortOrder");
CREATE INDEX "ExperienceTag_merchantId_storeId_active_groupSortOrder_sortOrder_idx" ON "ExperienceTag"("merchantId", "storeId", "active", "groupSortOrder", "sortOrder");
CREATE INDEX "PublishPlatform_merchantId_storeId_active_sortOrder_idx" ON "PublishPlatform"("merchantId", "storeId", "active", "sortOrder");
CREATE INDEX "ReviewSession_merchantId_storeId_createdAt_idx" ON "ReviewSession"("merchantId", "storeId", "createdAt");
CREATE INDEX "ReviewSession_expiresAt_idx" ON "ReviewSession"("expiresAt");
CREATE INDEX "Review_sessionId_createdAt_idx" ON "Review"("sessionId", "createdAt");
CREATE INDEX "PublishRecord_platformExternalId_createdAt_idx" ON "PublishRecord"("platformExternalId", "createdAt");
CREATE INDEX "AnalyticsEvent_merchantId_storeId_createdAt_idx" ON "AnalyticsEvent"("merchantId", "storeId", "createdAt");
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- Foreign keys
ALTER TABLE "Store" ADD CONSTRAINT "Store_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceTag" ADD CONSTRAINT "ExperienceTag_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExperienceTag" ADD CONSTRAINT "ExperienceTag_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishPlatform" ADD CONSTRAINT "PublishPlatform_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishPlatform" ADD CONSTRAINT "PublishPlatform_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewSession" ADD CONSTRAINT "ReviewSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublishRecord" ADD CONSTRAINT "PublishRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRecord" ADD CONSTRAINT "RewardRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReviewSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
