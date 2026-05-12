"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit2, RefreshCw, X, Save } from "lucide-react";

type Plan = {
  id: string;
  code: string;
  name: string;
  billingType: string;
  priceCents: number;
  priceLabel: string;
  isActive: boolean;
  textDailyLimit: number;
  imageMonthlyLimit: number;
  wechatAccountLimit: number;
  tagline: string;
  features: string[];
};

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/plans?includeInactive=true", {
        headers: authHeader(),
        cache: "no-store",
      });
      const data = await res.json();
      // 适配不同的 API 结构
      const plansList = Array.isArray(data) ? data : data.plans || [];
      setPlans(plansList);
    } catch {
      toast.error("获取套餐列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan || !editingPlan.id || editingPlan.id === "undefined") {
      toast.error("无效的套餐 ID");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch(`/api/v1/admin/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingPlan.name,
          priceCents: editingPlan.priceCents,
          isActive: editingPlan.isActive,
          textDailyLimit: editingPlan.textDailyLimit,
          imageMonthlyLimit: editingPlan.imageMonthlyLimit,
          wechatAccountLimit: editingPlan.wechatAccountLimit,
          tagline: editingPlan.tagline,
          features: editingPlan.features,
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      
      toast.success("套餐更新成功");
      setIsModalOpen(false);
      fetchPlans();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Product Center</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">套餐管理</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              在此管理订阅套餐的定价、额度以及展示内容。所有修改将实时同步到用户端。
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPlans}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </section>

      <div className="rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              <th className="px-6 py-4 font-semibold text-slate-700">名称/编码</th>
              <th className="px-6 py-4 font-semibold text-slate-700">价格</th>
              <th className="px-6 py-4 font-semibold text-slate-700">限额 (文字/图片/公众号)</th>
              <th className="px-6 py-4 font-semibold text-slate-700">状态</th>
              <th className="px-6 py-4 font-semibold text-slate-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {plans.map((plan) => (
              <tr key={plan.id} className={`transition hover:bg-stone-50/50 ${plan.isActive ? "" : "bg-stone-50/60 text-slate-500"}`}>
                <td className="px-6 py-4">
                  <div className={`font-semibold ${plan.isActive ? "text-slate-950" : "text-slate-500"}`}>{plan.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{plan.code}</div>
                </td>
                <td className={`px-6 py-4 font-medium ${plan.isActive ? "text-slate-700" : "text-slate-500"}`}>
                  {plan.priceLabel} 元
                </td>
                <td className={`px-6 py-4 ${plan.isActive ? "text-slate-600" : "text-slate-500"}`}>
                  <div className="flex gap-2">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 text-xs">{plan.textDailyLimit} 文</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 text-xs">{plan.imageMonthlyLimit} 图</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 text-xs">{plan.wechatAccountLimit > 500 ? '∞' : plan.wechatAccountLimit} 号</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {plan.isActive ? "已激活" : "已禁用"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {plans.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">暂无套餐数据</div>
        )}
      </div>

      {isModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-950">编辑套餐：{editingPlan.name}</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">名称</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">价格 (单位: 分)</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.priceCents}
                    onChange={e => setEditingPlan({...editingPlan, priceCents: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">每日文字</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.textDailyLimit}
                    onChange={e => setEditingPlan({...editingPlan, textDailyLimit: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">每月图片</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.imageMonthlyLimit}
                    onChange={e => setEditingPlan({...editingPlan, imageMonthlyLimit: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">公众号数</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.wechatAccountLimit}
                    onChange={e => setEditingPlan({...editingPlan, wechatAccountLimit: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">标语 (Tagline)</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                  value={editingPlan.tagline}
                  onChange={e => setEditingPlan({...editingPlan, tagline: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">状态</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingPlan.isActive}
                      onChange={() => setEditingPlan({...editingPlan, isActive: true})}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">激活</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!editingPlan.isActive}
                      onChange={() => setEditingPlan({...editingPlan, isActive: false})}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">禁用</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">权益列表 (每行一个)</label>
                <textarea
                  rows={4}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                  value={editingPlan.features.join("\n")}
                  onChange={e => setEditingPlan({...editingPlan, features: e.target.value.split("\n")})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-full border border-stone-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "正在保存..." : "确认保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
