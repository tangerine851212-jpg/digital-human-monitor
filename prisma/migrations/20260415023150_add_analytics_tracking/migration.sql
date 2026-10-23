-- CreateEnum
CREATE TYPE "AnalyticsPlatform" AS ENUM ('WEB', 'ANDROID');

-- CreateTable
CREATE TABLE "AnalyticsSession" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "platform" "AnalyticsPlatform" NOT NULL,
    "domain" TEXT,
    "channel" TEXT,
    "visitorId" TEXT,
    "userId" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "appVersion" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "deviceType" TEXT,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "osName" TEXT,
    "osVersion" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "platform" "AnalyticsPlatform" NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pageUrl" TEXT,
    "pathname" TEXT,
    "title" TEXT,
    "referrer" TEXT,
    "elementTag" TEXT,
    "elementText" TEXT,
    "elementId" TEXT,
    "elementRole" TEXT,
    "component" TEXT,
    "value" TEXT,
    "durationMs" INTEGER,
    "sequence" INTEGER,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSession_sessionKey_key" ON "AnalyticsSession"("sessionKey");

-- CreateIndex
CREATE INDEX "AnalyticsSession_platform_lastSeenAt_idx" ON "AnalyticsSession"("platform", "lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsSession_visitorId_lastSeenAt_idx" ON "AnalyticsSession"("visitorId", "lastSeenAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_platform_occurredAt_idx" ON "AnalyticsEvent"("platform", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_occurredAt_idx" ON "AnalyticsEvent"("name", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_occurredAt_idx" ON "AnalyticsEvent"("type", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_pathname_occurredAt_idx" ON "AnalyticsEvent"("pathname", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionKey_occurredAt_idx" ON "AnalyticsEvent"("sessionKey", "occurredAt" DESC);

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
