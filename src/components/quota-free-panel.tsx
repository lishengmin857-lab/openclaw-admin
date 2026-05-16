"use client";

import { useEffect, useState } from "react";

type QuotaFreeRollingSettings = {
  textPeriodDays: number;
  imagePeriodDays: number;
  textLimit: number;
  imageLimit: number;
  deAiLimit: number;
};

const DEFAULTS: QuotaFreeRollingSettings = {
  textPeriodDays: 3,
  imagePeriodDays: 7,
  textLimit: 2,
  imageLimit: 3,
  deAiLimit: 1,
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

export function QuotaFreePanel() {
  const [form, setForm] = useState<QuotaFreeRollingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/quota-free-rolling", {
        headers: authHeader(),
        cache: "no-store",
      });
      const data = (await res.json()) as { settings?: QuotaFreeRollingSettings; error?: string };
      if (!res.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      if (data.settings) {
        setForm({ ...DEFAULTS, ...data.settings });
      }
    } catch {
      setError("加载失败，请确认 node-backend 已启动");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings/quota-free-rolling", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { settings?: QuotaFreeRollingSettings; error?: string };
      if (!response.ok) {
        setError(data.error ?? "保存失败");
        return;
      }
      if (data.settings) setForm({ ...DEFAULTS, ...data.settings });
      setMessage("已保存。仅对当前未开通会员的用户按新周期重置额度。");
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-500">正在加载...</div>;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Quota · Free Tier</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">免费额度重置周期</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          仅影响「未开通会员」账号：从每个周期锚点日起算，满 N 天后文字或图片已用次数清零并进入新周期。已开通会员按套餐总额度累计扣减，不受此处影响。
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">文字额度周期</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">每 {form.textPeriodDays} 天</p>
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">图片额度周期</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">每 {form.imagePeriodDays} 天</p>
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">文字额度上限</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{form.textLimit} 次</p>
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">图片额度上限</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{form.imageLimit} 次</p>
        </div>
        <div className="rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">二次去 AI 额度</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{form.deAiLimit} 次</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">文字更新间隔（天）</span>
            <input
              type="number"
              min={1}
              max={365}
              value={form.textPeriodDays}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setForm((f) => ({ ...f, textPeriodDays: Math.min(365, Math.max(1, n)) }));
              }}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">图片更新间隔（天）</span>
            <input
              type="number"
              min={1}
              max={365}
              value={form.imagePeriodDays}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setForm((f) => ({ ...f, imagePeriodDays: Math.min(365, Math.max(1, n)) }));
              }}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">文字额度上限（次）</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={form.textLimit}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setForm((f) => ({ ...f, textLimit: Math.min(10000, Math.max(0, n)) }));
              }}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">图片额度上限（次）</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={form.imageLimit}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setForm((f) => ({ ...f, imageLimit: Math.min(10000, Math.max(0, n)) }));
              }}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">二次去 AI 额度上限（次）</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={form.deAiLimit}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(n)) return;
                setForm((f) => ({ ...f, deAiLimit: Math.min(10000, Math.max(0, n)) }));
              }}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
        </div>
        {message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-50"
          >
            刷新
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>
    </div>
  );
}
