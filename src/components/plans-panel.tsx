"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Edit2, Plus, RefreshCw, Trash2, X, Save } from "lucide-react";

type Plan = {
  id: string;
  code: string;
  name: string;
  billingType: string;
  priceCents: number;
  priceLabel: string;
  isActive: boolean;
  planCategory?: "text_only" | "text_image";
  supportsImage?: boolean;
  textDailyLimit: number;
  textMonthlyLimit?: number;
  imageMonthlyLimit: number;
  deAiMonthlyLimit: number;
  wechatAccountLimit: number;
  tagline: string;
  features: string[];
};

const PLAN_NAME_OPTIONS = ["基础月卡", "进阶季卡", "至尊年卡"] as const;

function normalizeAdminPlanName(value: string) {
  const raw = String(value || "").trim();
  if ((PLAN_NAME_OPTIONS as readonly string[]).includes(raw)) {
    return raw;
  }
  if (raw.includes("至尊") && raw.includes("年")) return "至尊年卡";
  if (raw.includes("进阶季卡") || raw.includes("进阶月卡")) return "进阶季卡";
  if (raw.includes("基础月卡")) return "基础月卡";
  return PLAN_NAME_OPTIONS[0];
}

function getToken() {
  return typeof window === "undefined" ? "" : (window.localStorage.getItem("openclaw-admin-token") ?? "");
}

function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}

function getPlanCategory(plan: Pick<Plan, "planCategory" | "imageMonthlyLimit">) {
  return plan.planCategory ?? (plan.imageMonthlyLimit > 0 ? "text_image" : "text_only");
}

function getPlanCategoryLabel(plan: Pick<Plan, "planCategory" | "imageMonthlyLimit">) {
  return getPlanCategory(plan) === "text_only" ? "文案创作" : "图文创作";
}

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const handleEdit = (plan: Plan) => {
    setModalMode("edit");
    setEditingPlan({ ...plan, name: normalizeAdminPlanName(plan.name) });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingPlan({
      id: "",
      code: "",
      name: PLAN_NAME_OPTIONS[0],
      billingType: "monthly",
      priceCents: 0,
      priceLabel: "0.00",
      isActive: true,
      planCategory: "text_only",
      supportsImage: false,
      textDailyLimit: 0,
      textMonthlyLimit: 0,
      imageMonthlyLimit: 0,
      deAiMonthlyLimit: 0,
      wechatAccountLimit: 1,
      tagline: "",
      features: [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan || (modalMode === "edit" && (!editingPlan.id || editingPlan.id === "undefined"))) {
      toast.error("无效的套餐 ID");
      return;
    }
    setSaving(true);

    try {
      const planCategory = getPlanCategory(editingPlan);
      const planName = normalizeAdminPlanName(editingPlan.name);
      const res = await fetch(modalMode === "create" ? "/api/v1/admin/plans" : `/api/v1/admin/plans/${editingPlan.id}`, {
        method: modalMode === "create" ? "POST" : "PATCH",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editingPlan.code,
          billingType: editingPlan.billingType,
          name: planName,
          priceCents: editingPlan.priceCents,
          isActive: editingPlan.isActive,
          planCategory,
          textMonthlyLimit: editingPlan.textMonthlyLimit ?? editingPlan.textDailyLimit * 30,
          imageMonthlyLimit: planCategory === "text_only" ? 0 : editingPlan.imageMonthlyLimit,
          deAiMonthlyLimit: editingPlan.deAiMonthlyLimit,
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

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`确认删除套餐「${plan.name}」？已有订单或会员使用的套餐不能删除。`)) return;
    try {
      const res = await fetch(`/api/v1/admin/plans/${plan.id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "DELETE_FAILED");
      }
      toast.success("套餐已删除");
      fetchPlans();
    } catch (error) {
      toast.error(error instanceof Error && error.message === "PLAN_IN_USE" ? "该套餐已有订单或会员记录，不能删除" : "删除套餐失败");
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              新增套餐
            </button>
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
        </div>
      </section>

      <div className="grid gap-3 md:hidden">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm ${plan.isActive ? "" : "bg-stone-50/70 text-slate-500"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={`font-semibold ${plan.isActive ? "text-slate-950" : "text-slate-500"}`}>
                  {plan.name}
                </h3>
                <p className="mt-1 break-all font-mono text-xs text-slate-500">{plan.code}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{getPlanCategoryLabel(plan)}</p>
              </div>
              <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                {plan.isActive ? "已激活" : "已禁用"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-3">
              <MobileField label="价格" value={`${plan.priceLabel} 元`} />
              <MobileField label="文章" value={`${plan.textMonthlyLimit ?? plan.textDailyLimit * 30} 篇`} />
              <MobileField label="图片" value={`${plan.imageMonthlyLimit} 图`} />
              <MobileField label="去AI味" value={`${plan.deAiMonthlyLimit ?? 0} 次`} />
              <MobileField label="公众号" value={`${plan.wechatAccountLimit > 500 ? "∞" : plan.wechatAccountLimit} 个`} />
            </div>

            <button
              onClick={() => handleEdit(plan)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700"
            >
              <Edit2 className="h-3.5 w-3.5" />
              编辑
            </button>
          </article>
        ))}
        {plans.length === 0 && !loading && (
          <div className="rounded-[24px] border border-stone-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            暂无套餐数据
          </div>
        )}
      </div>

      <div className="hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.04)] overflow-hidden md:block">
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
                  <div className="mt-1 text-xs font-semibold text-slate-500">{getPlanCategoryLabel(plan)}</div>
                </td>
                <td className={`px-6 py-4 font-medium ${plan.isActive ? "text-slate-700" : "text-slate-500"}`}>
                  {plan.priceLabel} 元
                </td>
                <td className={`px-6 py-4 ${plan.isActive ? "text-slate-600" : "text-slate-500"}`}>
                  <div className="flex gap-2">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 text-xs">{plan.textMonthlyLimit ?? plan.textDailyLimit * 30} 文</span>
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 text-xs">{plan.imageMonthlyLimit} 图</span>
                    <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 text-xs">润色 {plan.deAiMonthlyLimit ?? 0}</span>
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 text-xs">{plan.wechatAccountLimit > 500 ? '∞' : plan.wechatAccountLimit} 号</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
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
                  <button
                    onClick={() => void handleDelete(plan)}
                    className="mt-2 flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {"\u5220\u9664"}
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

      {mounted && isModalOpen && editingPlan && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5">
          <div className="max-h-[calc(100vh-32px)] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4">
              <h3 className="text-xl font-bold text-slate-950">
                {modalMode === "create" ? "新增套餐" : `编辑套餐：${editingPlan.name}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">编码</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.code}
                    disabled={modalMode === "edit"}
                    onChange={e => setEditingPlan({ ...editingPlan, code: e.target.value })}
                    placeholder="如 basic_month"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">名称</label>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  >
                    {PLAN_NAME_OPTIONS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">价格 (单位: 分)</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.priceCents}
                    onChange={e => setEditingPlan({ ...editingPlan, priceCents: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">套餐类型</label>
                  <select
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={getPlanCategory(editingPlan)}
                    onChange={e => {
                      const planCategory = e.target.value as "text_only" | "text_image";
                      setEditingPlan({
                        ...editingPlan,
                        planCategory,
                        supportsImage: planCategory === "text_image",
                        imageMonthlyLimit: planCategory === "text_only" ? 0 : editingPlan.imageMonthlyLimit,
                      });
                    }}
                  >
                    <option value="text_only">文案创作</option>
                    <option value="text_image">图文创作</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">文章总数</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.textMonthlyLimit ?? editingPlan.textDailyLimit * 30}
                    onChange={e => setEditingPlan({ ...editingPlan, textMonthlyLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">图片总数</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.imageMonthlyLimit}
                    disabled={getPlanCategory(editingPlan) === "text_only"}
                    onChange={e => setEditingPlan({ ...editingPlan, imageMonthlyLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">去AI味</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.deAiMonthlyLimit ?? 0}
                    onChange={e => setEditingPlan({ ...editingPlan, deAiMonthlyLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">公众号数</label>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                    value={editingPlan.wechatAccountLimit}
                    onChange={e => setEditingPlan({ ...editingPlan, wechatAccountLimit: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">标语 (Tagline)</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition"
                  value={editingPlan.tagline}
                  onChange={e => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">状态</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingPlan.isActive}
                      onChange={() => setEditingPlan({ ...editingPlan, isActive: true })}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">激活</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!editingPlan.isActive}
                      onChange={() => setEditingPlan({ ...editingPlan, isActive: false })}
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
                  onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value.split("\n") })}
                />
              </div>

              <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-stone-100 bg-white px-6 py-4">
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
        </div>,
        document.body,
      )}
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="min-w-0 text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
