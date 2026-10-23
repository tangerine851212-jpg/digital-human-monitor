export const ANALYTICS_RANGE_OPTIONS = [1, 7, 30, 90] as const;
export const TRACK_FLUSH_INTERVAL_MS = 5000;
export const TRACK_BATCH_SIZE = 12;

export type AnalyticsPlatform = "WEB" | "ANDROID";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface AnalyticsSessionPayload {
  sessionKey: string;
  platform: AnalyticsPlatform;
  domain?: string;
  channel?: string;
  visitorId?: string;
  userId?: string;
  locale?: string;
  timezone?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  appVersion?: string;
  browser?: string;
  browserVersion?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface AnalyticsEventPayload {
  name: string;
  type: string;
  pageUrl?: string;
  pathname?: string;
  title?: string;
  referrer?: string;
  elementTag?: string;
  elementText?: string;
  elementId?: string;
  elementRole?: string;
  component?: string;
  value?: string;
  durationMs?: number;
  sequence?: number;
  occurredAt?: string;
  metadata?: JsonValue;
}

export interface AnalyticsBatchPayload {
  session: AnalyticsSessionPayload;
  events: AnalyticsEventPayload[];
}

export interface DashboardQuery {
  days: number;
}

export interface DashboardStat {
  label: string;
  value: number;
  hint: string;
}

export interface DashboardPerformanceMetric {
  label: string;
  valueMs: number | null;
  sampleCount: number;
  hint: string;
}

export interface DashboardTrendPoint {
  bucket: string;
  total: number;
}

export interface DashboardTopItem {
  label: string;
  total: number;
  detail?: string | null;
}

export interface DashboardRecentEvent {
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
  occurredAt: string;
  metadata: JsonValue | null;
}

export interface DashboardConversationItem {
  id: string;
  sessionKey: string;
  role: string;
  text: string;
  mode: string | null;
  turnIndex: number | null;
  durationMs: number | null;
  occurredAt: string;
}

export interface DashboardRecentSession {
  sessionKey: string;
  platform: AnalyticsPlatform;
  eventCount: number;
  locale: string | null;
  appVersion: string | null;
  deviceLabel: string;
  lastSeenAt: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  performanceMetrics: DashboardPerformanceMetric[];
  activityTrend: DashboardTrendPoint[];
  topEvents: DashboardTopItem[];
  topPaths: DashboardTopItem[];
  recentEvents: DashboardRecentEvent[];
  recentConversations: DashboardConversationItem[];
  recentSessions: DashboardRecentSession[];
}

export interface PublicAnalyticsSnapshot {
  events24h: number;
  sessions24h: number;
  topAction: string;
}