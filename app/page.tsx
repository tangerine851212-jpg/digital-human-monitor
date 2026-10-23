import Link from "next/link";
import { Activity, ArrowRight, Clock3, Smartphone, Sparkles } from "lucide-react";

import { getPublicAnalyticsSnapshot } from "@/lib/analytics/server";
import { ADMIN_PATH } from "@/lib/site";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const focusCards = [
  {
    icon: Smartphone,
    title: "看哪些长辈还在持续使用",
    description: "活跃设备和最近打开的功能会持续更新，方便判断陪伴助手有没有被真正用起来。",
  },
  {
    icon: Sparkles,
    title: "看陪伴流程是否顺畅",
    description: "进入通话、开始互动、创建专属音色这些关键动作，都会按时间留下记录。",
  },
  {
    icon: Activity,
    title: "看哪里需要尽快处理",
    description: "当连接、播放、录音或资源准备失败时，后台会留下清晰的异常提醒。",
  },
];

export default async function Home() {
  const snapshot = await getPublicAnalyticsSnapshot();

  return (
    <main className="relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
      <div className="hero-orb left-[-120px] top-[-80px]" />
      <div className="hero-orb right-[-80px] top-[20%] bg-[radial-gradient(circle,_rgba(25,113,103,0.18)_0%,_rgba(25,113,103,0)_72%)]" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="soft-card relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.5)_0%,_rgba(255,255,255,0)_70%)] lg:block" />
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-2)]">
                <span className="pill-tag">老年陪伴助手</span>
                <span className="pill-tag">Android 使用概览</span>
              </div>

              <div className="space-y-4">
                <p className="eyebrow">陪伴助手总览</p>
                <h1 className="max-w-3xl font-[var(--font-display)] text-4xl leading-tight text-[var(--ink-1)] sm:text-5xl lg:text-6xl">
                  把每一次陪伴是否顺畅，看得更清楚一些。
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[var(--ink-2)]">
                  在这里关注老年陪伴助手数字人应用里的真实使用情况，帮助你了解长辈最近是否在使用、常用哪些功能、有没有遇到卡住或失败。
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={ADMIN_PATH}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                >
                  打开管理员面板
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <article className="stat-card">
                <p className="stat-label">24 小时互动记录</p>
                <strong className="stat-value">{formatNumber(snapshot.events24h)}</strong>
                <p className="stat-hint">最近一天里记录到的关键动作</p>
              </article>
              <article className="stat-card">
                <p className="stat-label">24 小时活跃设备</p>
                <strong className="stat-value">{formatNumber(snapshot.sessions24h)}</strong>
                <p className="stat-hint">最近一天里仍在使用的 Android 设备</p>
              </article>
              <article className="stat-card">
                <p className="stat-label">最近最常见动作</p>
                <strong className="stat-value text-[clamp(1.5rem,2vw,2rem)]">{snapshot.topAction}</strong>
                <p className="stat-hint">帮助快速判断大家最近最常用哪项能力</p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {focusCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="soft-card p-6">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent-1)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-[var(--ink-1)]">{card.title}</h2>
                <p className="text-base leading-7 text-[var(--ink-2)]">{card.description}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="soft-card p-7">
            <p className="eyebrow">后台重点关注</p>
            <h2 className="mb-5 text-3xl font-semibold text-[var(--ink-1)]">这些关键过程会持续留痕</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "进入首页、通话页和音色克隆页",
                "选择形象、进入陪伴通话",
                "开始录音、重录、完成录音",
                "创建专属音色和开始体验",
                "陪伴通话连接、断开和结束",
                "资源准备、播放和摄像头异常",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-[var(--line-soft)] bg-white/80 px-4 py-4 text-[var(--ink-2)]">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="soft-card p-7">
            <p className="eyebrow">适合日常巡检</p>
            <h2 className="mb-5 text-3xl font-semibold text-[var(--ink-1)]">打开后台后，先看这三件事</h2>
            <div className="space-y-4">
              {[
                {
                  icon: Clock3,
                  title: "先看最近一天是不是还有人在使用",
                  description: "如果活跃设备突然明显减少，就要尽快确认入口、资源和服务是不是出了问题。",
                },
                {
                  icon: Sparkles,
                  title: "再看最近最常见的动作有没有变化",
                  description: "高频动作能反映长辈现在更依赖哪项能力，也能判断新功能有没有被接受。",
                },
                {
                  icon: Activity,
                  title: "最后看异常提醒有没有集中出现",
                  description: "一旦某类失败突然增多，通常就说明某个陪伴流程需要尽快排查。",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[22px] border border-[var(--line-soft)] bg-white/80 px-4 py-4">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent-1)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-[var(--ink-1)]">{item.title}</h3>
                    <p className="text-sm leading-7 text-[var(--ink-2)]">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
