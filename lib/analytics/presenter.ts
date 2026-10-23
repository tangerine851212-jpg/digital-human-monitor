const EVENT_LABELS: Record<string, string> = {
  screen_view: "打开页面",
  digital_human_init_ready: "数字人准备完成",
  voice_clone_entry_tap: "进入音色克隆",
  avatar_selected: "选择数字人形象",
  call_page_opened: "进入陪伴通话",
  base_config_download_started: "开始准备基础资源",
  base_config_download_completed: "基础资源准备完成",
  base_config_download_failed: "基础资源准备失败",
  avatar_download_started: "开始准备数字人资源",
  avatar_download_completed: "数字人资源准备完成",
  avatar_download_failed: "数字人资源准备失败",
  clone_avatar_selected: "选择克隆形象",
  voice_sample_discarded: "删除录音样本",
  voice_rerecord_requested: "重新录音",
  voice_record_started: "开始录音",
  voice_record_start_failed: "录音启动失败",
  voice_record_too_short: "录音时长过短",
  voice_record_finished: "录音完成",
  voice_record_stop_failed: "录音结束失败",
  voice_clone_create_started: "开始创建专属音色",
  voice_clone_create_succeeded: "专属音色创建成功",
  voice_clone_create_failed: "专属音色创建失败",
  voice_clone_chat_started: "开始体验专属音色",
  call_activity_opened: "打开通话页面",
  ai_conversation_unavailable: "陪伴通话暂不可用",
  clone_voice_unavailable: "专属音色暂不可用",
  ai_conversation_connecting: "陪伴通话连接中",
  ai_conversation_connected: "陪伴通话已连接",
  ai_conversation_disconnected: "陪伴通话已断开",
  ai_conversation_error: "陪伴通话异常",
  user_transcript_received: "收到用户语音文本",
  assistant_transcript_completed: "陪伴回复已生成",
  assistant_response_done: "整轮回复完成",
  ai_conversation_stopped: "陪伴通话已结束",
  clone_tts_started: "开始播放专属音色",
  clone_tts_finished: "专属音色播放完成",
  clone_tts_error: "专属音色播放失败",
  camera_enabled: "打开摄像头",
  camera_disabled: "关闭摄像头",
  camera_capture_error: "摄像头采集失败",
  camera_first_frame_ready: "摄像头画面就绪",
  user_message_uploaded: "用户聊天记录已上传",
  assistant_message_uploaded: "助手聊天记录已上传",
};

const PATH_LABELS: Record<string, string> = {
  "/android/main": "首页",
  "/android/call": "陪伴通话",
  "/android/voice-clone-setup": "音色克隆",
  "(未标记页面)": "未标记功能",
};

function humanizeFallback(value: string) {
  const normalized = value.trim().replace(/[_-]+/g, " ");
  return normalized || "未命名记录";
}

export function describeAnalyticsEventName(name: string) {
  return EVENT_LABELS[name] ?? humanizeFallback(name);
}

export function describeAnalyticsPath(pathname: string | null | undefined) {
  if (!pathname) {
    return "未标记功能";
  }

  if (PATH_LABELS[pathname]) {
    return PATH_LABELS[pathname];
  }

  if (pathname.startsWith("/android/")) {
    const label = pathname.replace("/android/", "").replace(/-/g, " ").trim();
    return label ? `Android 功能 ${label}` : "Android 功能";
  }

  return pathname;
}

export function describeAnalyticsType(type: string) {
  switch (type.toLowerCase()) {
    case "navigation":
      return "页面浏览";
    case "interaction":
      return "操作记录";
    case "performance":
      return "性能指标";
    case "conversation":
      return "聊天记录";
    case "error":
      return "异常提醒";
    default:
      return humanizeFallback(type);
  }
}

export function describeConversationRole(role: string | null | undefined) {
  switch ((role ?? "").toLowerCase()) {
    case "assistant":
      return "助手回复";
    case "user":
      return "用户发言";
    default:
      return "对话记录";
  }
}