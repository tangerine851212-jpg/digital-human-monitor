import "server-only";

import { z } from "zod";

import type {
  AnalyticsPlatform,
  AnalyticsBatchPayload,
  DashboardData,
  DashboardQuery,
  JsonValue,
  PublicAnalyticsSnapshot,
} from "@/lib/analytics/contracts";
import { ANALYTICS_RANGE_OPTIONS } from "@/lib/analytics/contracts";
import {
  describeConversationRole,
  describeAnalyticsEventName,
  describeAnalyticsPath,
  describeAnalyticsType,
} from "@/lib/analytics/presenter";
import { prisma } from "@/lib/prisma";
import { SITE_DOMAIN } from "@/lib/site";

const nullableStringField = (max: number) => z.string().trim().max(max).nullish();

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const analyticsSessionSchema = z.object({
  sessionKey: z.string().trim().min(8).max(120),
  platform: z.literal("ANDROID"),
  domain: nullableStringField(255),
  channel: nullableStringField(80),
  visitorId: nullableStringField(120),
  userId: nullableStringField(120),
  locale: nullableStringField(40),
  timezone: nullableStringField(80),
  referrer: nullableStringField(500),
  userAgent: nullableStringField(500),
  ipAddress: nullableStringField(64),
  appVersion: nullableStringField(40),
  browser: nullableStringField(80),
  browserVersion: nullableStringField(80),
  deviceType: nullableStringField(40),
  deviceBrand: nullableStringField(80),
  deviceModel: nullableStringField(120),
  osName: nullableStringField(80),
  osVersion: nullableStringField(80),
  screenWidth: z.number().int().positive().max(10000).nullish(),
  screenHeight: z.number().int().positive().max(10000).nullish(),
});

const analyticsEventSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.string().trim().min(1).max(80),
  pageUrl: nullableStringField(500),
  pathname: nullableStringField(255),
  title: nullableStringField(255),
  referrer: nullableStringField(500),
  elementTag: nullableStringField(80),
  elementText: nullableStringField(240),
  elementId: nullableStringField(120),
  elementRole: nullableStringField(80),
  component: nullableStringField(120),
  value: nullableStringField(240),
  durationMs: z.number().int().nonnegative().max(2_147_483_647).nullish(),
  sequence: z.number().int().nonnegative().max(1_000_000).nullish(),
  occurredAt: z.string().datetime().optional(),
  metadata: jsonValueSchema.nullish(),
});

const analyticsBatchSchema = z.object({
  session: analyticsSessionSchema,
  events: z.array(analyticsEventSchema).min(1).max(100),
});

type ValidatedBatch = z.infer<typeof analyticsBatchSchema>;

function truncate(value: string | null | undefined, max: number) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function readClientIp(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for");
  if (forwarded) {
    return truncate(forwarded.split(",")[0] ?? undefined, 64);
  }

  return truncate(requestHeaders.get("x-real-ip"), 64);
}

function detectBrowser(userAgent: string | undefined) {
  if (!userAgent) {
    return undefined;
  }

  if (/edg\//i.test(userAgent)) {
    return "Edge";
  }
  if (/chrome\//i.test(userAgent)) {
    return "Chrome";
  }
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari";
  }
  if (/firefox\//i.test(userAgent)) {
    return "Firefox";
  }
  if (/okhttp/i.test(userAgent)) {
    return "OkHttp";
  }

  return "Unknown";
}

function detectOs(userAgent: string | undefined) {
  if (!userAgent) {
    return { osName: undefined, osVersion: undefined, deviceType: undefined };
  }

  const androidMatch = userAgent.match(/Android\s([\d.]+)/i);
  if (androidMatch) {
    return { osName: "Android", osVersion: androidMatch[1], deviceType: "mobile" };
  }

  const iosMatch = userAgent.match(/OS\s([\d_]+)/i);
  if (iosMatch) {
    return { osName: "iOS", osVersion: iosMatch[1]?.replaceAll("_", "."), deviceType: "mobile" };
  }

  if (/Windows/i.test(userAgent)) {
    return { osName: "Windows", osVersion: undefined, deviceType: "desktop" };
  }
  if (/Mac OS X/i.test(userAgent)) {
    return { osName: "macOS", osVersion: undefined, deviceType: "desktop" };
  }
  if (/Linux/i.test(userAgent)) {
    return { osName: "Linux", osVersion: undefined, deviceType: "desktop" };
  }

  return { osName: undefined, osVersion: undefined, deviceType: undefined };
}

function buildRangeFilter(columnName: string, rangeStart: Date) {
  return `"${columnName}" >= '${rangeStart.toISOString()}' AND "platform" = 'ANDROID'`;
}

function countResult(rows: Array<{ total: bigint | number | string | null | undefined }>) {
  const total = rows[0]?.total;
  return Number(total ?? 0);
}

function averageResult(rows: Array<{ average: number | null; total: bigint | number | string | null | undefined }>) {
  const average = rows[0]?.average;
  return {
    average: average == null ? null : Number(average),
    total: Number(rows[0]?.total ?? 0),
  };
}

function formatBucket(bucket: Date, days: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: days <= 2 ? "2-digit" : undefined,
  }).format(bucket);
}

function buildDeviceLabel(session: {
  deviceBrand: string | null;
  deviceModel: string | null;
  browser: string | null;
  osName: string | null;
}) {
  const device = [session.deviceBrand, session.deviceModel].filter(Boolean).join(" ").trim();
  if (device) {
    return device;
  }

  const browser = [session.browser, session.osName].filter(Boolean).join(" / ").trim();
  return browser || "未标记设备";
}

function readMetadataObject(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  return metadata as Record<string, JsonValue>;
}

function readMetadataString(metadata: unknown, key: string) {
  const object = readMetadataObject(metadata);
  const value = object?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readMetadataNumber(metadata: unknown, key: string) {
  const object = readMetadataObject(metadata);
  const value = object?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function compactText(value: string, max = 220) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }

  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

export function parseDashboardQuery(raw: { range?: string }): DashboardQuery {
  const parsedDays = Number(raw.range ?? 7);
  const days = ANALYTICS_RANGE_OPTIONS.includes(parsedDays as (typeof ANALYTICS_RANGE_OPTIONS)[number])
    ? parsedDays
    : 7;

  return { days };
}

export function validateAnalyticsPayload(payload: unknown) {
  return analyticsBatchSchema.parse(payload);
}

export async function ingestAnalyticsBatch(payload: unknown, requestHeaders: Headers) {
  const validated = validateAnalyticsPayload(payload);
  return saveAnalyticsBatch(validated, requestHeaders);
}

async function saveAnalyticsBatch(payload: ValidatedBatch, requestHeaders: Headers) {
  const now = new Date();
  const requestDomain = truncate(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? SITE_DOMAIN,
    255,
  );
  const requestUserAgent = truncate(requestHeaders.get("user-agent"), 500);
  const ipAddress = payload.session.ipAddress ?? readClientIp(requestHeaders);
  const userAgent = payload.session.userAgent ?? requestUserAgent;
  const osGuess = detectOs(userAgent ?? undefined);
  const browser = payload.session.browser ?? detectBrowser(userAgent ?? undefined);

  const sessionData = {
    sessionKey: payload.session.sessionKey,
    platform: payload.session.platform,
    domain: truncate(payload.session.domain ?? requestDomain, 255),
    channel: truncate(payload.session.channel ?? undefined, 80),
    visitorId: truncate(payload.session.visitorId ?? undefined, 120),
    userId: truncate(payload.session.userId ?? undefined, 120),
    locale: truncate(payload.session.locale ?? undefined, 40),
    timezone: truncate(payload.session.timezone ?? undefined, 80),
    referrer: truncate(payload.session.referrer ?? undefined, 500),
    userAgent,
    ipAddress,
    appVersion: truncate(payload.session.appVersion ?? undefined, 40),
    browser: truncate(browser ?? undefined, 80),
    browserVersion: truncate(payload.session.browserVersion ?? undefined, 80),
    deviceType: truncate(payload.session.deviceType ?? osGuess.deviceType ?? undefined, 40),
    deviceBrand: truncate(payload.session.deviceBrand ?? undefined, 80),
    deviceModel: truncate(payload.session.deviceModel ?? undefined, 120),
    osName: truncate(payload.session.osName ?? osGuess.osName ?? undefined, 80),
    osVersion: truncate(payload.session.osVersion ?? osGuess.osVersion ?? undefined, 80),
    screenWidth: payload.session.screenWidth ?? undefined,
    screenHeight: payload.session.screenHeight ?? undefined,
    lastSeenAt: now,
  };

  const events = payload.events.map((event) => ({
    sessionKey: payload.session.sessionKey,
    platform: payload.session.platform,
    name: truncate(event.name, 120) ?? "unknown",
    type: truncate(event.type, 80) ?? "custom",
    pageUrl: truncate(event.pageUrl ?? undefined, 500),
    pathname: truncate(event.pathname ?? undefined, 255),
    title: truncate(event.title ?? undefined, 255),
    referrer: truncate(event.referrer ?? payload.session.referrer ?? undefined, 500),
    elementTag: truncate(event.elementTag ?? undefined, 80),
    elementText: truncate(event.elementText ?? undefined, 240),
    elementId: truncate(event.elementId ?? undefined, 120),
    elementRole: truncate(event.elementRole ?? undefined, 80),
    component: truncate(event.component ?? undefined, 120),
    value: truncate(event.value ?? undefined, 240),
    durationMs: event.durationMs ?? undefined,
    sequence: event.sequence ?? undefined,
    metadata: event.metadata == null ? undefined : event.metadata,
    occurredAt: event.occurredAt ? new Date(event.occurredAt) : now,
  }));

  const session = await prisma.$transaction(async (tx: {
    analyticsSession: typeof prisma.analyticsSession;
    analyticsEvent: typeof prisma.analyticsEvent;
  }) => {
    const activeSession = await tx.analyticsSession.upsert({
      where: { sessionKey: payload.session.sessionKey },
      update: {
        ...sessionData,
        eventCount: { increment: events.length },
      },
      create: {
        ...sessionData,
        startedAt: now,
        eventCount: events.length,
      },
      select: { id: true, sessionKey: true },
    });

    await tx.analyticsEvent.createMany({
      data: events.map((event) => ({
        ...event,
        sessionId: activeSession.id,
      })),
    });

    return activeSession;
  });

  return {
    accepted: events.length,
    sessionKey: session.sessionKey,
  };
}

export async function getDashboardData(query: DashboardQuery): Promise<DashboardData> {
  const now = new Date();
  const rangeStart = new Date(now.getTime() - query.days * 24 * 60 * 60 * 1000);
  const sessionFilter = buildRangeFilter("lastSeenAt", rangeStart);
  const eventFilter = buildRangeFilter("occurredAt", rangeStart);
  const usageEventFilter = `${eventFilter} AND lower("type") NOT IN ('conversation', 'performance')`;
  const sessionWhere = {
    lastSeenAt: { gte: rangeStart },
    platform: "ANDROID" as const,
  };
  const eventWhere = {
    occurredAt: { gte: rangeStart },
    platform: "ANDROID" as const,
  };

  const [
    sessionCountRows,
    visitorCountRows,
    errorCountRows,
    responseDurationRows,
    connectDurationRows,
    assistantTextDurationRows,
    assistantFirstAudioRows,
    cloneCreateDurationRows,
    activityTrendRows,
    topEventRows,
    topPathRows,
    recentSessions,
    recentEvents,
    recentConversations,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(*)::bigint AS total
      FROM "AnalyticsSession"
      WHERE ${sessionFilter}
    `),
    prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(DISTINCT COALESCE(NULLIF("visitorId", ''), "sessionKey"))::bigint AS total
      FROM "AnalyticsSession"
      WHERE ${sessionFilter}
    `),
    prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND (
          lower("type") = 'error'
          OR lower("name") LIKE '%error%'
          OR lower("name") LIKE '%fail%'
        )
    `),
    prisma.$queryRawUnsafe<Array<{ average: number | null; total: bigint }>>(`
      SELECT AVG("durationMs")::double precision AS average,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND "name" = 'assistant_response_done'
        AND "durationMs" IS NOT NULL
    `),
    prisma.$queryRawUnsafe<Array<{ average: number | null; total: bigint }>>(`
      SELECT AVG("durationMs")::double precision AS average,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND "name" = 'ai_conversation_connected'
        AND "durationMs" IS NOT NULL
    `),
    prisma.$queryRawUnsafe<Array<{ average: number | null; total: bigint }>>(`
      SELECT AVG("durationMs")::double precision AS average,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND "name" = 'assistant_message_uploaded'
        AND "durationMs" IS NOT NULL
    `),
    prisma.$queryRawUnsafe<Array<{ average: number | null; total: bigint }>>(`
      SELECT AVG(NULLIF("metadata"->>'firstAudioLatencyMs', '')::double precision) AS average,
             COUNT(*) FILTER (WHERE NULLIF("metadata"->>'firstAudioLatencyMs', '') IS NOT NULL)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND "name" = 'assistant_response_done'
    `),
    prisma.$queryRawUnsafe<Array<{ average: number | null; total: bigint }>>(`
      SELECT AVG("durationMs")::double precision AS average,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${eventFilter}
        AND "name" = 'voice_clone_create_succeeded'
        AND "durationMs" IS NOT NULL
    `),
    prisma.$queryRawUnsafe<Array<{ bucket: Date; total: bigint }>>(`
      SELECT date_trunc('${query.days <= 2 ? "hour" : "day"}', "occurredAt") AS bucket,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${usageEventFilter}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    prisma.$queryRawUnsafe<Array<{ label: string; detail: string | null; total: bigint }>>(`
      SELECT "name" AS label,
             MIN("type") AS detail,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${usageEventFilter}
      GROUP BY "name"
      ORDER BY total DESC
      LIMIT 8
    `),
    prisma.$queryRawUnsafe<Array<{ label: string; total: bigint }>>(`
      SELECT COALESCE(NULLIF("pathname", ''), '(未标记页面)') AS label,
             COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${usageEventFilter}
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 8
    `),
    prisma.analyticsSession.findMany({
      where: sessionWhere,
      orderBy: { lastSeenAt: "desc" },
      take: 12,
      select: {
        sessionKey: true,
        platform: true,
        eventCount: true,
        locale: true,
        appVersion: true,
        deviceBrand: true,
        deviceModel: true,
        browser: true,
        osName: true,
        lastSeenAt: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...eventWhere,
        type: { not: "conversation" },
      },
      orderBy: { occurredAt: "desc" },
      take: 18,
      select: {
        id: true,
        sessionKey: true,
        platform: true,
        name: true,
        type: true,
        pathname: true,
        component: true,
        elementText: true,
        value: true,
        durationMs: true,
        occurredAt: true,
        metadata: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        ...eventWhere,
        type: "conversation",
      },
      orderBy: { occurredAt: "desc" },
      take: 12,
      select: {
        id: true,
        sessionKey: true,
        name: true,
        elementText: true,
        value: true,
        durationMs: true,
        occurredAt: true,
        metadata: true,
      },
    }),
  ]);

  const sessionCount = countResult(sessionCountRows);
  const uniqueVisitors = countResult(visitorCountRows);
  const errorCount = countResult(errorCountRows);
  const responseDuration = averageResult(responseDurationRows);
  const connectDuration = averageResult(connectDurationRows);
  const assistantTextDuration = averageResult(assistantTextDurationRows);
  const assistantFirstAudio = averageResult(assistantFirstAudioRows);
  const cloneCreateDuration = averageResult(cloneCreateDurationRows);

  return {
    stats: [
      {
        label: "活跃设备",
        value: sessionCount,
        hint: `${query.days} 天内仍在上报数据的 Android 设备`,
      },
      {
        label: "活跃使用者",
        value: uniqueVisitors,
        hint: "按安装标识或会话编号去重后的实际使用主体",
      },
      {
        label: "平均回复耗时(ms)",
        value: responseDuration.average == null ? 0 : Math.round(responseDuration.average),
        hint:
          responseDuration.total > 0
            ? `基于 ${responseDuration.total} 次已完成回复，从老人说完到整轮回复结束`
            : "还没有可计算的回复耗时",
      },
      {
        label: "异常提醒",
        value: errorCount,
        hint: "连接、播放、录音和资源准备失败都会在这里体现",
      },
    ],
    performanceMetrics: [
      {
        label: "连接成功",
        valueMs: connectDuration.average,
        sampleCount: connectDuration.total,
        hint: "从点击开始对话到建立实时连接",
      },
      {
        label: "文字回复完成",
        valueMs: assistantTextDuration.average,
        sampleCount: assistantTextDuration.total,
        hint: "从老人停顿到拿到完整文字回复",
      },
      {
        label: "开始出声",
        valueMs: assistantFirstAudio.average,
        sampleCount: assistantFirstAudio.total,
        hint: "标准陪伴通话从停顿到第一段声音到达",
      },
      {
        label: "专属音色生成",
        valueMs: cloneCreateDuration.average,
        sampleCount: cloneCreateDuration.total,
        hint: "从提交录音到拿到可用专属音色",
      },
    ],
    activityTrend: activityTrendRows.map((row: { bucket: Date; total: bigint | number | string }) => ({
      bucket: formatBucket(row.bucket, query.days),
      total: Number(row.total),
    })),
    topEvents: topEventRows.map((row: { label: string; detail: string | null; total: bigint | number | string }) => ({
      label: describeAnalyticsEventName(row.label),
      detail: row.detail ? describeAnalyticsType(row.detail) : row.detail,
      total: Number(row.total),
    })),
    topPaths: topPathRows.map((row: { label: string; total: bigint | number | string }) => ({
      label: describeAnalyticsPath(row.label),
      total: Number(row.total),
    })),
    recentEvents: recentEvents.map((event: {
      id: string;
      sessionKey: string;
      platform: AnalyticsPlatform;
      name: string;
      type: string;
      pathname: string | null;
      component: string | null;
      elementText: string | null;
      value: string | null;
      durationMs: number | null;
      occurredAt: Date;
      metadata: unknown;
    }) => ({
      id: event.id,
      sessionKey: event.sessionKey,
      platform: event.platform,
      name: describeAnalyticsEventName(event.name),
      type: describeAnalyticsType(event.type),
      pathname: describeAnalyticsPath(event.pathname),
      component: event.component,
      elementText: event.elementText,
      value: event.value,
      durationMs: event.durationMs,
      occurredAt: event.occurredAt.toISOString(),
      metadata: (event.metadata ?? null) as DashboardData["recentEvents"][number]["metadata"],
    })),
    recentConversations: recentConversations.map((event: {
      id: string;
      sessionKey: string;
      name: string;
      elementText: string | null;
      value: string | null;
      durationMs: number | null;
      occurredAt: Date;
      metadata: unknown;
    }) => {
      const role = readMetadataString(event.metadata, "role") ?? (event.name.startsWith("assistant") ? "assistant" : "user");
      const fullText = readMetadataString(event.metadata, "text") ?? event.elementText ?? event.value ?? "";
      const mode = readMetadataString(event.metadata, "mode");
      const turnIndex = readMetadataNumber(event.metadata, "turnIndex");

      return {
        id: event.id,
        sessionKey: event.sessionKey,
        role: describeConversationRole(role),
        text: compactText(fullText),
        mode,
        turnIndex: turnIndex == null ? null : Math.round(turnIndex),
        durationMs: event.durationMs,
        occurredAt: event.occurredAt.toISOString(),
      };
    }),
    recentSessions: recentSessions.map((session: {
      sessionKey: string;
      platform: AnalyticsPlatform;
      eventCount: number;
      locale: string | null;
      appVersion: string | null;
      deviceBrand: string | null;
      deviceModel: string | null;
      browser: string | null;
      osName: string | null;
      lastSeenAt: Date;
    }) => ({
      sessionKey: session.sessionKey,
      platform: session.platform,
      eventCount: session.eventCount,
      locale: session.locale,
      appVersion: session.appVersion,
      deviceLabel: buildDeviceLabel(session),
      lastSeenAt: session.lastSeenAt.toISOString(),
    })),
  };
}

export async function getPublicAnalyticsSnapshot(): Promise<PublicAnalyticsSnapshot> {
  const rangeStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const eventFilter = buildRangeFilter("occurredAt", rangeStart);
  const usageEventFilter = `${eventFilter} AND lower("type") NOT IN ('conversation', 'performance')`;
  const sessionFilter = buildRangeFilter("lastSeenAt", rangeStart);
  const [eventRows, sessionRows, topActionRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${usageEventFilter}
    `),
    prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(*)::bigint AS total
      FROM "AnalyticsSession"
      WHERE ${sessionFilter}
    `),
    prisma.$queryRawUnsafe<Array<{ label: string; total: bigint }>>(`
      SELECT "name" AS label, COUNT(*)::bigint AS total
      FROM "AnalyticsEvent"
      WHERE ${usageEventFilter}
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 1
    `),
  ]);

  const events24h = countResult(eventRows);
  const sessions24h = countResult(sessionRows);

  return {
    events24h,
    sessions24h,
    topAction: topActionRows[0] ? describeAnalyticsEventName(topActionRows[0].label) : "等待第一条记录",
  };
}

export type AnalyticsPayload = AnalyticsBatchPayload;