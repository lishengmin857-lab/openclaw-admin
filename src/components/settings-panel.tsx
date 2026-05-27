"use client";

import { useEffect, useState } from "react";

const DEFAULT_ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";

const TEXT_MODEL_OPTIONS = [
  {
    provider: "doubao",
    label: "豆包",
    model: "doubao-seed-2-0-pro-260215",
    baseUrl: DEFAULT_ARK_BASE_URL,
    endpoint: "/responses",
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    model: "deepseek-v3-2-251201",
    baseUrl: DEFAULT_ARK_BASE_URL,
    endpoint: "/responses",
  },
  {
    provider: "kimi",
    label: "Kimi",
    model: "kimi-k2-thinking-251104",
    baseUrl: DEFAULT_ARK_BASE_URL,
    endpoint: "/responses",
  },
  {
    provider: "mimo",
    label: "小米 MiMo",
    model: "mimo-v2.5-pro",
    baseUrl: DEFAULT_MIMO_BASE_URL,
    endpoint: "/chat/completions",
  },
] as const;

type TextProvider = (typeof TEXT_MODEL_OPTIONS)[number]["provider"];

type ImageSettings = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

type TextProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

type TextSettings = TextProviderConfig & {
  provider: TextProvider;
  providers: Record<TextProvider, TextProviderConfig>;
  enableWebSearch: boolean;
  reasoningEffort: string;
};

type RawTextSettings = Partial<Omit<TextSettings, "provider" | "providers">> & {
  provider?: string;
  providers?: Partial<Record<TextProvider, Partial<TextProviderConfig>>>;
};

function getTextModelOption(provider: string) {
  return TEXT_MODEL_OPTIONS.find((option) => option.provider === provider) ?? TEXT_MODEL_OPTIONS[0];
}

function inferTextProvider(provider: string | undefined, model: string): TextProvider {
  if (provider === "doubao" || provider === "deepseek" || provider === "kimi" || provider === "mimo") {
    return provider;
  }
  const normalizedModel = model.trim().toLowerCase();
  if (normalizedModel.startsWith("deepseek")) return "deepseek";
  if (normalizedModel.startsWith("kimi") || normalizedModel.includes("moonshot")) return "kimi";
  if (normalizedModel.startsWith("mimo")) return "mimo";
  return "doubao";
}

function getDefaultProviderConfig(provider: TextProvider): TextProviderConfig {
  const option = getTextModelOption(provider);
  return {
    apiKey: "",
    model: option.model,
    baseUrl: option.baseUrl,
  };
}

function normalizeTextSettings(settings: RawTextSettings = {}): TextSettings {
  const model = settings.model?.trim() || "";
  const provider = inferTextProvider(settings.provider, model);
  const rawProviders = settings.providers ?? {};
  const providers = TEXT_MODEL_OPTIONS.reduce(
    (result, option) => {
      const providerConfig = rawProviders[option.provider] ?? {};
      const topLevelActiveConfig = option.provider === provider;

      result[option.provider] = {
        apiKey: providerConfig.apiKey ?? (topLevelActiveConfig ? settings.apiKey ?? "" : ""),
        model:
          providerConfig.model?.trim() ||
          (topLevelActiveConfig ? model : "") ||
          option.model,
        baseUrl:
          providerConfig.baseUrl?.trim() ||
          (topLevelActiveConfig ? settings.baseUrl?.trim() || "" : "") ||
          option.baseUrl,
      };
      return result;
    },
    {} as Record<TextProvider, TextProviderConfig>,
  );
  const activeConfig = providers[provider] ?? getDefaultProviderConfig(provider);

  return {
    provider,
    providers,
    ...activeConfig,
    enableWebSearch:
      typeof settings.enableWebSearch === "boolean"
        ? settings.enableWebSearch
        : provider === "kimi" || provider === "deepseek" || provider === "mimo",
    reasoningEffort: settings.reasoningEffort?.trim() || "medium",
  };
}

function withActiveTextConfig(settings: TextSettings): TextSettings {
  const activeConfig = settings.providers[settings.provider] ?? getDefaultProviderConfig(settings.provider);
  return {
    ...settings,
    ...activeConfig,
  };
}

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

function maskValue(value: string) {
  if (!value) return "未配置";
  if (value.length <= 10) return value;
  return `${value.slice(0, 8)}****${value.slice(-4)}`;
}

export function SettingsPanel() {
  const [imageForm, setImageForm] = useState<ImageSettings>({
    apiKey: "",
    model: "",
    baseUrl: DEFAULT_ARK_BASE_URL,
  });
  const [textForm, setTextForm] = useState<TextSettings>(normalizeTextSettings());
  const [loading, setLoading] = useState(true);
  const [imageSaving, setImageSaving] = useState(false);
  const [textSaving, setTextSaving] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const [imageRes, textRes] = await Promise.all([
        fetch("/api/admin/settings/image-generation", { headers: authHeader(), cache: "no-store" }),
        fetch("/api/admin/settings/text-generation", { headers: authHeader(), cache: "no-store" }),
      ]);
      const imageData = (await imageRes.json()) as { settings?: ImageSettings; error?: string };
      const textData = (await textRes.json()) as { settings?: RawTextSettings; error?: string };
      if (imageData.settings) setImageForm(imageData.settings);
      if (textData.settings) setTextForm(normalizeTextSettings(textData.settings));
      const errMsg =
        (!imageRes.ok ? (imageData.error ?? "图片配置加载失败") : "") ||
        (!textRes.ok ? (textData.error ?? "文本配置加载失败") : "");
      if (errMsg) setError(errMsg);
    } catch {
      setError("加载系统配置失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleTextProviderChange(provider: TextProvider) {
    setTextForm((form) =>
      withActiveTextConfig({
        ...form,
        provider,
        providers: {
          ...form.providers,
          [provider]: form.providers[provider] ?? getDefaultProviderConfig(provider),
        },
        enableWebSearch:
          provider === "kimi" || provider === "deepseek" || provider === "mimo"
            ? true
            : form.enableWebSearch,
      }),
    );
  }

  function updateActiveTextConfig(updates: Partial<TextProviderConfig>) {
    setTextForm((form) =>
      withActiveTextConfig({
        ...form,
        providers: {
          ...form.providers,
          [form.provider]: {
            ...(form.providers[form.provider] ?? getDefaultProviderConfig(form.provider)),
            ...updates,
          },
        },
      }),
    );
  }

  async function handleSaveImage() {
    setImageSaving(true);
    setImageMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings/image-generation", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(imageForm),
      });
      const data = (await response.json()) as { settings?: ImageSettings; error?: string };
      if (!response.ok) { setError(data.error ?? "SAVE_FAILED"); return; }
      if (data.settings) setImageForm(data.settings);
      setImageMessage("图片模型配置已保存");
    } catch {
      setError("保存失败");
    } finally {
      setImageSaving(false);
    }
  }

  async function handleSaveText() {
    setTextSaving(true);
    setTextMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings/text-generation", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(withActiveTextConfig(textForm)),
      });
      const data = (await response.json()) as { settings?: RawTextSettings; error?: string };
      if (!response.ok) { setError(data.error ?? "SAVE_FAILED"); return; }
      if (data.settings) setTextForm(normalizeTextSettings(data.settings));
      setTextMessage("文本模型配置已保存");
    } catch {
      setError("保存失败");
    } finally {
      setTextSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">正在加载系统配置...</div>;
  }

  const activeTextConfig = textForm.providers[textForm.provider] ?? getDefaultProviderConfig(textForm.provider);

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {/* 文本模型配置 */}
      <div className="space-y-5">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500">Text Model</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">文本模型配置</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            服务端统一使用的文章生成 Key 和模型。客户端不再显示此配置，由后台统一维护。
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="当前模型选择" value={getTextModelOption(textForm.provider).label} />
          <StatCard label="当前文本模型" value={activeTextConfig.model || "未配置"} compact />
          <StatCard label="当前 Key" value={maskValue(activeTextConfig.apiKey)} />
          <StatCard label="联网搜索默认值" value={textForm.enableWebSearch ? "开启" : "关闭"} />
          <StatCard label="思考深度 (Reasoning)" value={
            textForm.reasoningEffort === "high" ? "高" :
            textForm.reasoningEffort === "low" ? "低" :
            textForm.reasoningEffort === "minimal" ? "关闭" : "中 (默认)"
          } />
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">模型选择</span>
            <select
              value={textForm.provider}
              onChange={(event) => handleTextProviderChange(event.target.value as TextProvider)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
            >
              {TEXT_MODEL_OPTIONS.map((option) => (
                <option key={option.provider} value={option.provider}>
                  {option.label} - {option.model}
                </option>
              ))}
            </select>
          </div>
          <Field label={`${getTextModelOption(textForm.provider).label} API Key`} value={activeTextConfig.apiKey}
            onChange={(v) => updateActiveTextConfig({ apiKey: v })}
            placeholder="填写文章生成使用的 Ark API Key" password />
          <Field label={`${getTextModelOption(textForm.provider).label} 模型名称 / 接入点 ID`} value={activeTextConfig.model}
            onChange={(v) => updateActiveTextConfig({ model: v })}
            placeholder="填写方舟控制台实际可调用的模型名或接入点 ID" />
          <Field label={`${getTextModelOption(textForm.provider).label} 接口地址`} value={activeTextConfig.baseUrl}
            onChange={(v) => updateActiveTextConfig({ baseUrl: v })}
            placeholder={`${getTextModelOption(textForm.provider).baseUrl}${getTextModelOption(textForm.provider).endpoint}`} />
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={textForm.enableWebSearch}
              onChange={(e) => setTextForm((f) => ({ ...f, enableWebSearch: e.target.checked }))}
              className="h-4 w-4 rounded border-stone-300 accent-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">默认开启联网搜索</span>
          </label>
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">推理深度 (Reasoning Effort)</span>
            <select
              value={textForm.reasoningEffort}
              disabled={textForm.provider !== "doubao" && textForm.provider !== "mimo"}
              onChange={(e) => setTextForm((f) => ({ ...f, reasoningEffort: e.target.value }))}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-amber-400 bg-white disabled:bg-stone-100 disabled:text-slate-400"
            >
              <option value="high">高 (high) - 深度分析，适合复杂问题</option>
              <option value="medium">中 (medium) - 均衡模式，兼顾速度与深度</option>
              <option value="low">低 (low) - 轻量思考，侧重快速响应</option>
              <option value="minimal">关闭 (minimal) - 关闭思考，直接回答</option>
            </select>
          </div>
          {textMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{textMessage}</div>
          ) : null}
          <div className="flex gap-3">
            <button type="button" onClick={() => void loadSettings()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-50">
              刷新
            </button>
            <button type="button" onClick={handleSaveText} disabled={textSaving}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
              {textSaving ? "保存中..." : "保存文本配置"}
            </button>
          </div>
        </section>
      </div>

      {/* 图片模型配置 */}
      <div className="space-y-5">
        <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Image Model</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">图片模型配置</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            服务端统一使用的图片生成 Key、模型名称和接口地址。修改后客户端会自动走新的后端配置。
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="当前图片模型" value={imageForm.model || "未配置"} />
          <StatCard label="当前 Key" value={maskValue(imageForm.apiKey)} />
          <StatCard label="接口地址" value={imageForm.baseUrl || "未配置"} compact />
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm space-y-5">
          <Field label="图片 API Key" value={imageForm.apiKey}
            onChange={(v) => setImageForm((f) => ({ ...f, apiKey: v }))}
            placeholder="填写图片生成使用的豆包 API Key" password />
          <Field label="图片模型名称" value={imageForm.model}
            onChange={(v) => setImageForm((f) => ({ ...f, model: v }))}
            placeholder="例如：doubao-seedream-4-0" />
          <Field label="图片接口地址" value={imageForm.baseUrl}
            onChange={(v) => setImageForm((f) => ({ ...f, baseUrl: v }))}
            placeholder="https://ark.cn-beijing.volces.com/api/v3" />
          {imageMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{imageMessage}</div>
          ) : null}
          <div className="flex gap-3">
            <button type="button" onClick={() => void loadSettings()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-50">
              刷新
            </button>
            <button type="button" onClick={handleSaveImage} disabled={imageSaving}
              className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {imageSaving ? "保存中..." : "保存图片配置"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  password = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  password?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={password ? "password" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
      />
    </label>
  );
}

function StatCard({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 font-semibold tracking-tight text-slate-950 ${compact ? "text-base break-all" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}
