const GEMINI_MODEL_CONNECTING_MESSAGE = "Gemini模型连接中，稍后再试.......";

const ERROR_MESSAGE_MAP: Record<string, string> = {
  INVALID_JSON: "请求数据格式不正确",
  INVALID_COUNT: "数量参数不正确",
  FETCH_LICENSES_FAILED: "获取授权码数据失败",
  EXPORT_LICENSES_FAILED: "导出授权码失败",
  SYNC_OPENCLAW_FAILED: "同步授权码失败，请稍后再试",
  UPSTREAM_UNREACHABLE: "后端服务暂不可用，请稍后再试",
  FETCH_AGENTS_FAILED: "获取代理列表失败",
  CREATE_AGENT_FAILED: "创建代理失败",
  UPDATE_AGENT_FAILED: "更新代理失败",
  DELETE_AGENT_FAILED: "删除代理失败",
  FETCH_OPERATION_LOGS_FAILED: "获取操作日志失败",
  CREATE_PLAN_FAILED: "创建套餐失败",
  UPDATE_PLAN_FAILED: "更新套餐失败",
  DELETE_PLAN_FAILED: "删除套餐失败",
  ARTICLE_GENERATE_FAILED: GEMINI_MODEL_CONNECTING_MESSAGE,
  IMAGE_GENERATE_FAILED: GEMINI_MODEL_CONNECTING_MESSAGE,
  GEMINI_MODEL_CONNECTING: GEMINI_MODEL_CONNECTING_MESSAGE,
};

export function getChineseErrorMessage(rawCode: unknown) {
  const code = String(rawCode || "INTERNAL_SERVER_ERROR").trim();
  if (!code) {
    return "操作失败，请稍后再试";
  }

  const prefix = code.split(":")[0];
  return ERROR_MESSAGE_MAP[code] || ERROR_MESSAGE_MAP[prefix] || "操作失败，请稍后再试";
}

export function errorPayload(code: string) {
  return {
    error: getChineseErrorMessage(code),
  };
}
