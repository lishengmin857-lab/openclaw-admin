"use client";

import { useEffect, useState } from "react";

type RegistrationPolicySettings = {
  ipWindowDays: number;
  ipMaxCount: number;
  subnetWindowDays: number;
  subnetMaxCount: number;
  maxAccountsPerDevice: number;
};

const REG_POLICY_DEFAULTS: RegistrationPolicySettings = {
  ipWindowDays: 7,
  ipMaxCount: 10,
  subnetWindowDays: 7,
  subnetMaxCount: 40,
  maxAccountsPerDevice: 3,
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

export function RegistrationPolicyPanel() {
  const [regPolicy, setRegPolicy] = useState<RegistrationPolicySettings>(REG_POLICY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPolicy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/registration-policy", {
        headers: authHeader(),
        cache: "no-store",
      });
      const data = (await res.json()) as { settings?: RegistrationPolicySettings; error?: string };
      if (!res.ok) {
        setError(data.error ?? "注册策略加载失败");
        return;
      }
      if (data.settings) {
        setRegPolicy({ ...REG_POLICY_DEFAULTS, ...data.settings });
      }
    } catch {
      setError("加载失败，请检查 node-backend 是否已启动");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPolicy();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSuccessMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings/registration-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(regPolicy),
      });
      const data = (await response.json()) as { settings?: RegistrationPolicySettings; error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      if (data.settings) {
        setRegPolicy({ ...REG_POLICY_DEFAULTS, ...data.settings });
      }
      setSuccessMessage("注册风控策略已保存，新配置立即对注册接口生效");
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">正在加载注册策略...</div>;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Registration Guard</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">会员注册风控</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          约束由 OpenClaw node-backend 在注册用户时执行：在时间窗内统计同一 IP、同一网段的成功注册次数，并限制客户端通过请求头
          <code className="mx-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs">X-Device-Id</code>
          上报的同一设备关联的账号总数。
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          若服务部署在反代（Nginx/CDN）之后，需在 node-backend 环境变量中设置{" "}
          <code className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-900">TRUST_PROXY=true</code>，
          否则限流会看到反代服务器 IP。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="IP 统计窗口（天）" value={String(regPolicy.ipWindowDays)} />
        <StatCard label="IP 窗口内上限" value={String(regPolicy.ipMaxCount)} />
        <StatCard label="网段窗口（天）" value={String(regPolicy.subnetWindowDays)} />
        <StatCard label="网段窗口内上限" value={String(regPolicy.subnetMaxCount)} />
        <StatCard label="单设备最多账号数" value={String(regPolicy.maxAccountsPerDevice)} />
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <IntegerField
            label="IP 窗口（天）"
            value={regPolicy.ipWindowDays}
            min={1}
            max={90}
            onChange={(n) => setRegPolicy((f) => ({ ...f, ipWindowDays: n }))}
          />
          <IntegerField
            label="同一 IP 最大注册数"
            value={regPolicy.ipMaxCount}
            min={1}
            max={500_000}
            onChange={(n) => setRegPolicy((f) => ({ ...f, ipMaxCount: n }))}
          />
          <IntegerField
            label="网段窗口（天）"
            value={regPolicy.subnetWindowDays}
            min={1}
            max={90}
            onChange={(n) => setRegPolicy((f) => ({ ...f, subnetWindowDays: n }))}
          />
          <IntegerField
            label="同一网段最大注册数"
            value={regPolicy.subnetMaxCount}
            min={1}
            max={500_000}
            onChange={(n) => setRegPolicy((f) => ({ ...f, subnetMaxCount: n }))}
          />
          <IntegerField
            label="单设备账号上限"
            value={regPolicy.maxAccountsPerDevice}
            min={1}
            max={500}
            onChange={(n) => setRegPolicy((f) => ({ ...f, maxAccountsPerDevice: n }))}
          />
        </div>

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadPolicy()}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-50"
          >
            刷新
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存注册策略"}
          </button>
        </div>
      </section>
    </div>
  );
}

function IntegerField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : min}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.min(max, Math.max(min, parsed)));
        }}
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
      />
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
