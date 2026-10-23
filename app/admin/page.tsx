import Link from "next/link";
import { ArrowUpRight, Clock3, Smartphone, Sparkles } from "lucide-react";

import { DashboardCharts } from "@/components/admin/dashboard-charts";
import type { DashboardData } from "@/lib/analytics/contracts";
import { getDashboardData, parseDashboardQuery } from "@/lib/analytics/server";
import { formatDateTime, formatDurationMs, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ranges = [
  { label: "24 小时", value: "1" },
  { label: "7 天", value: "7" },
  { label: "30 天", value: "30" },
  { label: "90 天", value: "90" },
] as const;

type RecentEventItem = DashboardData["recentEvents"][number];
type ConversationItem = DashboardData["recentConversations"][number];

function describeConversationMode(mode: string | null) {
  if (mode === "clone") {
    return "专属音色模式";
  }
  if (mode === "standard") {
    return "标准模式";
  }
  return null;
}

function buildEventNote(event: RecentEventItem) {
  const notes = [
    event.durationMs && event.durationMs > 0 ? `耗时 ${formatDurationMs(event.durationMs)}` : null,
    event.value?.trim() || null,
    event.elementText?.trim() || null,
  ].filter(Boolean);

  return notes[0] ?? "无额外说明";
}

function buildConversationNote(item: ConversationItem) {
  const notes = [
    item.turnIndex ? `第 ${item.turnIndex} 轮` : null,
    describeConversationMode(item.mode),
    item.durationMs && item.durationMs > 0
      ? `${item.role === "用户发言" ? "识别完成" : "文本完成"} ${formatDurationMs(item.durationMs)}`
      : null,
  ].filter(Boolean);

  return notes.join(" · ");
}

type AdminPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const rawParams = await searchParams;
  const query = parseDashboardQuery(rawParams);
  const data = await getDashboardData(query);

  return (
    <main className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
      <div className="hero-orb left-[-120px] top-[10%]" />
      <div className="hero-orb right-[-120px] top-[-40px] bg-[radial-gradient(circle,_rgba(29,111,104,0.16)_0%,_rgba(29,111,104,0)_72%)]" />
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="soft-card p-7 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--ink-2)]">
                <Sparkles className="h-4 w-4 text-[var(--accent-1)]" />
                Android 陪伴数据台
              </div>
              <div>
                <p className="eyebrow">使用总览</p>
                <h1 className="font-[var(--font-display)] text-4xl leading-tight text-[var(--ink-1)] sm:text-5xl">
                  最近谁在使用，哪里需要留意，一眼看清。
                </h1>
              </div>
              <p className="max-w-3xl text-base leading-8 text-[var(--ink-2)]">
                这里持续汇总老年陪伴助手在 Android 应用中的使用情况，除了常用功能和异常提醒，也会单独整理回复耗时、连接速度和最近对话片段，方便你直接判断体验是不是顺畅。
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-white/75 px-5 py-3 text-sm font-semibold text-[var(--ink-1)]"
              >
                返回首页
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <div className="flex flex-wrap gap-2 text-sm text-[var(--ink-2)]">
                <span className="pill-tag">Android 应用</span>
                <span className="pill-tag">数据自动更新</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--ink-3)]">时间范围</p>
              <div className="flex flex-wrap gap-2">
                {ranges.map((item) => (
                  <Link
                    key={item.value}
                    href={`?range=${item.value}`}
                    className={query.days === Number(item.value) ? "filter-pill filter-pill-active" : "filter-pill"}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <strong className="stat-value">{formatNumber(stat.value)}</strong>
              <p className="stat-hint">{stat.hint}</p>
            </article>
          ))}
        </section>

        <DashboardCharts activityTrend={data.activityTrend} topEvents={data.topEvents} />

        <section className="soft-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">性能概览</p>
              <h2 className="text-2xl font-semibold text-[var(--ink-1)]">陪伴流程现在快不快</h2>
            </div>
            <p className="text-sm text-[var(--ink-3)]">只看真实耗时，不看空洞的成功失败计数</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.performanceMetrics.map((metric) => (
              <article key={metric.label} className="rounded-[24px] border border-[var(--line-soft)] bg-white/80 px-5 py-5 shadow-[var(--shadow-card)]">
                <p className="mb-2 text-sm text-[var(--ink-3)]">{metric.label}</p>
                <strong className="text-3xl font-semibold text-[var(--ink-1)]">{formatDurationMs(metric.valueMs)}</strong>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-2)]">{metric.hint}</p>
                <p className="mt-2 text-xs text-[var(--ink-3)]">{metric.sampleCount > 0 ? `基于 ${formatNumber(metric.sampleCount)} 次记录` : "暂无样本"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="soft-card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">常用功能</p>
                <h2 className="text-2xl font-semibold text-[var(--ink-1)]">最近更常打开哪里</h2>
              </div>
              <div className="pill-tag">
                <Clock3 className="h-4 w-4" />
                近 {query.days} 天
              </div>
            </div>

            <div className="space-y-3">
              {data.topPaths.map((item, index) => (
                <div key={item.label} className="list-row">
                  <div className="flex items-center gap-4">
                    <span className="index-badge">{index + 1}</span>
                    <div>
                      <p className="text-sm text-[var(--ink-3)]">功能页面</p>
                      <p className="text-base font-semibold text-[var(--ink-1)]">{item.label}</p>
                    </div>
                  </div>
                  <strong className="text-lg font-semibold text-[var(--ink-1)]">{formatNumber(item.total)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="soft-card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">最近活跃设备</p>
                <h2 className="text-2xl font-semibold text-[var(--ink-1)]">刚刚还在使用的是谁</h2>
              </div>
            </div>

            <div className="space-y-3">
              {data.recentSessions.map((session) => (
                <div key={session.sessionKey} className="rounded-[24px] border border-[var(--line-soft)] bg-white/80 px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
                      <Smartphone className="h-4 w-4 text-[var(--accent-2)]" />
                      Android 设备
                    </div>
                    <span className="text-xs text-[var(--ink-3)]">{formatDateTime(session.lastSeenAt)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[var(--ink-1)]">{session.deviceLabel}</p>
                    <p className="text-sm text-[var(--ink-2)]">设备会话 {session.sessionKey.slice(0, 18)}...</p>
                    <p className="text-sm text-[var(--ink-3)]">
                      {formatNumber(session.eventCount)} 条事件
                      {session.appVersion ? ` · 版本 ${session.appVersion}` : ""}
                      {session.locale ? ` · ${session.locale}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="soft-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">最近对话</p>
              <h2 className="text-2xl font-semibold text-[var(--ink-1)]">刚刚聊了些什么</h2>
            </div>
            <p className="text-sm text-[var(--ink-3)]">聊天记录会自动上传，这里只展示最新片段</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {data.recentConversations.length > 0 ? (
              data.recentConversations.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-[var(--line-soft)] bg-white/80 px-5 py-5 shadow-[var(--shadow-card)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-sm font-medium text-[var(--ink-1)]">
                      {item.role}
                    </span>
                    <span className="text-xs text-[var(--ink-3)]">{formatDateTime(item.occurredAt)}</span>
                  </div>
                  <p className="text-base leading-8 text-[var(--ink-1)]">{item.text}</p>
                  <p className="mt-3 text-sm text-[var(--ink-3)]">{buildConversationNote(item) || "已自动归档到聊天记录"}</p>
                  <p className="mt-1 text-xs text-[var(--ink-3)]">设备会话 {item.sessionKey.slice(0, 18)}...</p>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--line-soft)] bg-white/60 px-5 py-8 text-sm text-[var(--ink-3)] lg:col-span-2">
                当前时间范围内还没有自动上传的聊天片段。
              </div>
            )}
          </div>
        </section>

        <section className="soft-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">最近记录</p>
              <h2 className="text-2xl font-semibold text-[var(--ink-1)]">刚刚发生了什么</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-[var(--ink-3)]">
                  <th className="px-4">时间</th>
                  <th className="px-4">终端</th>
                  <th className="px-4">动作</th>
                  <th className="px-4">页面 / 功能</th>
                  <th className="px-4">补充说明</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => (
                  <tr key={event.id} className="rounded-[24px] bg-white/80 text-sm text-[var(--ink-2)] shadow-[var(--shadow-card)]">
                    <td className="rounded-l-[20px] px-4 py-4">{formatDateTime(event.occurredAt)}</td>
                    <td className="px-4 py-4">Android</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[var(--ink-1)]">
                        {event.name}
                      </span>
                      <p className="mt-2 text-xs tracking-[0.18em] text-[var(--ink-3)]">{event.type}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-[var(--ink-1)]">{event.pathname ?? "未标记功能"}</p>
                      <p className="mt-1 text-xs text-[var(--ink-3)]">{event.component ?? "无额外标签"}</p>
                    </td>
                    <td className="rounded-r-[20px] px-4 py-4">
                      <p>{buildEventNote(event)}</p>
                      <p className="mt-1 text-xs text-[var(--ink-3)]">设备会话 {event.sessionKey.slice(0, 18)}...</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}