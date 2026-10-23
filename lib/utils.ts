import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDurationMs(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return "暂无";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  const seconds = value / 1000;
  if (seconds < 60) {
    const rounded = seconds >= 10 ? seconds.toFixed(1) : seconds.toFixed(2);
    return `${rounded.replace(/\.0+$/, "")} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.round(seconds % 60);
  return `${minutes} 分 ${remainSeconds} 秒`;
}