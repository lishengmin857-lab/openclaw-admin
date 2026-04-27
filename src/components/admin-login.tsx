"use client";

import { FormEvent, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type FocusField = "email" | "password" | null;

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "15076032131";
    }

    return window.localStorage.getItem("openclaw-admin-phone") ?? "15076032131";
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState<FocusField>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginHint, setLoginHint] = useState("请输入后台管理员账号");
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.45 });
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const inputActive = focusField !== null;
  const avertEyes = focusField === "password" && showPassword;
  const passwordLean = Math.min(password.length, 16) / 16;

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginHint("账号和密码都要填写");
      return;
    }

    setLoginLoading(true);
    setLoginHint("正在校验后台入口...");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: email.trim(),
          password,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        token?: string;
        admin?: { displayName: string; phone: string };
      };

      if (!response.ok || !result.token || !result.admin) {
        throw new Error(result.error || "LOGIN_FAILED");
      }

      if (remember) {
        window.localStorage.setItem("openclaw-admin-phone", email.trim());
      } else {
        window.localStorage.removeItem("openclaw-admin-phone");
      }

      window.localStorage.setItem("openclaw-admin-token", result.token);
      window.localStorage.setItem("openclaw-admin-name", result.admin.displayName);
      window.sessionStorage.setItem("openclaw-admin-auth", "ok");
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message === "INVALID_CREDENTIALS"
            ? "账号或密码错误"
            : error.message === "ADMIN_DISABLED"
              ? "管理员账号已停用"
              : error.message === "UPSTREAM_UNREACHABLE"
                ? "登录服务不可用，请确认 node-backend 已启动"
                : "登录失败，请稍后重试"
          : "登录失败，请稍后重试";
      setLoginHint(message);
      setLoginLoading(false);
      return;
    }

    setLoginLoading(false);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4efe8] text-slate-950">
      <style jsx global>{`
        @keyframes openclaw-blink-soft {
          0%,
          44%,
          48%,
          100% {
            transform: scaleY(1);
          }
          45%,
          47% {
            transform: scaleY(0.12);
          }
        }

        @keyframes openclaw-blink-double {
          0%,
          33%,
          39%,
          41%,
          100% {
            transform: scaleY(1);
          }
          34%,
          38%,
          40% {
            transform: scaleY(0.1);
          }
        }

        @keyframes openclaw-mouth-bob {
          0%,
          100% {
            transform: translate(-50%, 0) scaleX(1);
          }
          50% {
            transform: translate(-50%, 1px) scaleX(0.92);
          }
        }
      `}</style>
      <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section
          className="relative isolate overflow-hidden bg-[linear-gradient(160deg,#4b5563_0%,#2f3642_40%,#1f2937_100%)]"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMouse({
              x: (event.clientX - rect.left) / rect.width,
              y: (event.clientY - rect.top) / rect.height,
            });
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_30%)]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />

          <div className="relative flex min-h-[44vh] flex-col justify-between px-8 py-8 sm:px-12 sm:py-10 lg:min-h-screen lg:px-14 lg:py-14">
            <div className="max-w-md text-white/92">
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/55">
                OpenClaw Admin
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <CharacterStage
                mouse={mouse}
                inputActive={inputActive}
                avertEyes={avertEyes}
                passwordLean={passwordLean}
              />
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#f7f3ee] px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#6b7280]">
              Secure Access
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{loginHint}</p>

            <form className="mt-8 space-y-5" onSubmit={handleLogin}>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Account
                <input
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  className="h-14 rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 outline-none transition focus:border-[#5b43ff] focus:ring-4 focus:ring-[#5b43ff]/10"
                  inputMode="numeric"
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder="请输入管理员手机号"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => setFocusField("password")}
                    onBlur={() => setFocusField(null)}
                    className="h-14 w-full rounded-full border border-slate-200 bg-white px-5 pr-14 text-sm text-slate-900 outline-none transition focus:border-[#5b43ff] focus:ring-4 focus:ring-[#5b43ff]/10"
                    placeholder="请输入后台密码"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setShowPassword((value) => !value);
                      passwordInputRef.current?.focus();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#5b43ff] focus:ring-[#5b43ff]"
                  />
                  Remember for 30 days
                </label>
                <button type="button" className="font-medium text-[#4856c5] transition hover:text-[#2f3aa1]">
                  Admin only
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="h-14 w-full rounded-full border border-slate-200 bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loginLoading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              默认超级管理员账号已写入数据库
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function CharacterStage({
  mouse,
  inputActive,
  avertEyes,
  passwordLean,
}: {
  mouse: { x: number; y: number };
  inputActive: boolean;
  avertEyes: boolean;
  passwordLean: number;
}) {
  return (
    <div className="relative mt-6 h-[410px] w-full max-w-[520px] sm:h-[500px] lg:mt-0 lg:h-[620px] lg:max-w-[640px]">
      <div className="absolute left-1/2 top-[58%] h-[240px] w-[360px] -translate-x-1/2 rounded-full bg-black/15 blur-3xl sm:h-[280px] sm:w-[420px] lg:top-[60%] lg:h-[320px] lg:w-[500px]" />

      <Character color="#ff774d" shape="arch" width={206} height={198} left={44} bottom={72} eyeBase={{ x: 0.52, y: 0.54 }} mouse={mouse} inputActive={inputActive} avertEyes={avertEyes} passwordLean={passwordLean} layer={3} eyeStyle="dot" eyeBias={avertEyes ? "left" : "right"} eyeY="28%" />
      <Character color="#4c24ff" shape="slant" width={150} height={356} left={142} bottom={104} eyeBase={{ x: 0.54, y: 0.23 }} mouse={mouse} inputActive={inputActive} avertEyes={avertEyes} passwordLean={passwordLean} role="leader" layer={1} eyeStyle="full" eyeBias={avertEyes ? "left" : "right"} blink="soft" />
      <Character color="#17171d" shape="slim" width={108} height={286} left={266} bottom={70} eyeBase={{ x: 0.54, y: 0.18 }} mouse={mouse} inputActive={inputActive} avertEyes={avertEyes} passwordLean={passwordLean} layer={2} eyeStyle="full" eyeBias={avertEyes ? "left" : "right"} blink="double" />
      <Character color="#d9c437" shape="arch" width={132} height={252} left={352} bottom={66} eyeBase={{ x: 0.5, y: 0.23 }} mouse={mouse} inputActive={inputActive} avertEyes={avertEyes} passwordLean={passwordLean} mouth layer={4} eyeStyle="dot" eyeBias={avertEyes ? "left" : "right"} />
    </div>
  );
}

function Character({
  color,
  shape,
  width,
  height,
  left,
  bottom,
  eyeBase,
  mouse,
  inputActive,
  avertEyes,
  passwordLean,
  mouth = false,
  role = "default",
  layer = 1,
  eyeStyle = "full",
  eyeBias = "center",
  eyeY = "17%",
  blink = "none",
}: {
  color: string;
  shape: "arch" | "slant" | "slim";
  width: number;
  height: number;
  left: number;
  bottom: number;
  eyeBase: { x: number; y: number };
  mouse: { x: number; y: number };
  inputActive: boolean;
  avertEyes: boolean;
  passwordLean: number;
  mouth?: boolean;
  role?: "default" | "leader";
  layer?: number;
  eyeStyle?: "full" | "dot";
  eyeBias?: "left" | "center" | "right";
  eyeY?: string;
  blink?: "none" | "soft" | "double";
}) {
  const peeking = inputActive && !avertEyes;
  const leanStrength = role === "leader" ? 1 : role === "default" && shape === "arch" ? 0.55 : 0.7;
  const leanRotate = passwordLean * 10 * leanStrength;
  const leanLift = passwordLean * 14 * leanStrength;
  const leanShift = passwordLean * 8 * leanStrength;

  const transform = useMemo(() => {
    if (role === "leader") {
      if (peeking) {
        return `translate3d(${22 + leanShift}px, ${-38 - leanLift}px, 0) rotateZ(${7 + leanRotate * 0.45}deg) scale(${1.05 + passwordLean * 0.026})`;
      }
    }

    if (peeking) {
      return `translate3d(${10 + leanShift * 0.55}px, ${-10 - leanLift * 0.62}px, 0) rotateZ(${leanRotate * 0.28}deg)`;
    }

    return "translate3d(0,0,0)";
  }, [leanLift, leanRotate, leanShift, passwordLean, peeking, role]);

  const lookX = (mouse.x - eyeBase.x) * 15;
  const lookY = (mouse.y - eyeBase.y) * 12;
  const mouthStyle = mouth
    ? {
        transform: `translate(calc(-50% + ${Math.max(-5.5, Math.min(5.5, lookX * 0.26))}px), ${Math.max(-1.5, Math.min(4, lookY * 0.16 + passwordLean * 2.8))}px) scaleX(${1 - passwordLean * 0.08}) rotate(${Math.max(-4, Math.min(4, lookX * 0.12))}deg)`,
      }
    : undefined;
  const pupilStyle = avertEyes
    ? { transform: "translate3d(-1.6px, -0.1px, 0)", opacity: 1 }
    : {
        transform: `translate3d(${Math.max(-2.1, Math.min(2.1, lookX * 0.5))}px, ${Math.max(-1.5, Math.min(1.5, lookY * 0.42))}px, 0)`,
        opacity: 1,
      };

  const radius =
    shape === "arch"
      ? "999px 999px 18px 18px"
      : shape === "slant"
        ? "10px 10px 14px 14px"
        : "10px 10px 0 0";

  const baseTilt = peeking && role === "leader" ? "perspective(900px) rotateX(7deg) rotateY(-2deg)" : "";
  const skew = shape === "slant" ? "skewY(-8deg)" : "none";
  const neck =
    peeking
      ? role === "leader"
        ? `translate(${8 + leanShift * 0.2}px, ${8 + leanLift * 0.4}px) rotate(${1.5 + leanRotate * 0.08}deg) scaleY(${0.98 - passwordLean * 0.03})`
        : `translateY(${-18 + leanLift * 0.15}px) rotate(${leanRotate * 0.12}deg)`
      : "translateY(0)";

  return (
    <div
      className="absolute transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform"
      style={{ width, height, left, bottom, zIndex: layer, transform, transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute inset-0 shadow-[0_20px_48px_rgba(0,0,0,0.18)] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{
          background: color,
          borderRadius: radius,
          transform: `${baseTilt} ${skew} ${neck}`.trim(),
          transformOrigin: peeking && role === "leader" ? "78% 100%" : "bottom center",
          clipPath: peeking && role === "leader" ? "polygon(8% 0%, 100% 0%, 100% 100%, 86% 100%, 82% 90%, 62% 84%, 24% 82%, 0% 100%, 0% 18%)" : undefined,
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_45%)]" />

        <Eye x="39%" y={eyeY} pupilStyle={pupilStyle} avertEyes={avertEyes} lookX={lookX} lookY={lookY} eyeStyle={eyeStyle} eyeBias={eyeBias} blink={blink} />
        <Eye x="61%" y={eyeY} pupilStyle={pupilStyle} avertEyes={avertEyes} lookX={lookX} lookY={lookY} eyeStyle={eyeStyle} eyeBias={eyeBias} blink={blink} />

        {mouth ? (
          <div
            className="absolute left-1/2 top-[44%] h-[3px] w-10 rounded-full bg-slate-900/80 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{
              ...mouthStyle,
              animation: "openclaw-mouth-bob 2.3s ease-in-out infinite",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function Eye({
  x,
  y,
  pupilStyle,
  avertEyes,
  lookX,
  lookY,
  eyeStyle,
  eyeBias,
  blink,
}: {
  x: string;
  y: string;
  pupilStyle: { transform: string; opacity: number };
  avertEyes: boolean;
  lookX: number;
  lookY: number;
  eyeStyle: "full" | "dot";
  eyeBias: "left" | "center" | "right";
  blink: "none" | "soft" | "double";
}) {
  const biasOffset = eyeBias === "left" ? -5.8 : eyeBias === "right" ? 5.8 : 0;
  const trackingOffsetX =
    eyeStyle === "dot" ? Math.max(-5.4, Math.min(5.4, lookX * 0.4)) : Math.max(-2.2, Math.min(2.2, lookX * 0.16));
  const trackingOffsetY =
    eyeStyle === "dot" ? Math.max(-3.6, Math.min(3.6, lookY * 0.3)) : Math.max(-1.5, Math.min(1.5, lookY * 0.12));
  const eyeOffsetX = biasOffset + trackingOffsetX;
  const eyeOffsetY = trackingOffsetY;
  const shellRotate = eyeStyle === "full" ? (eyeBias === "left" ? -10 : eyeBias === "right" ? 10 : 0) : 0;
  const shellScaleX = eyeStyle === "full" && eyeBias !== "center" ? 0.86 : 1;
  const blinkAnimation: CSSProperties | undefined =
    eyeStyle === "full" && blink !== "none"
      ? {
          animation:
            blink === "soft"
              ? "openclaw-blink-soft 4.8s ease-in-out infinite 0.35s"
              : "openclaw-blink-double 3.35s ease-in-out infinite 1.05s",
          transformOrigin: "center 58%",
        }
      : undefined;

  if (eyeStyle === "dot") {
    return (
      <div
        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{ left: x, top: y, transform: `translate(calc(-50% + ${eyeOffsetX}px), calc(-50% + ${eyeOffsetY}px))` }}
      />
    );
  }

  return (
    <div
      className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff9f3] shadow-[0_2px_8px_rgba(15,23,42,0.14)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
      style={{
        left: x,
        top: y,
        transform: `translate(calc(-50% + ${eyeOffsetX}px), calc(-50% + ${eyeOffsetY}px)) rotate(${shellRotate}deg) scaleX(${shellScaleX})`,
        ...blinkAnimation,
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
        style={pupilStyle}
      />
      {avertEyes ? <div className="absolute left-1/2 top-1/2 h-[1.5px] w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950/22" /> : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.3A12.4 12.4 0 0 1 12 5c6.4 0 10 7 10 7a18.8 18.8 0 0 1-3.1 3.8" />
      <path d="M6.5 6.5C3.9 8.1 2 12 2 12a18.2 18.2 0 0 0 7.2 5.8" />
      <path d="M14.8 14.8A4 4 0 0 1 9.2 9.2" />
    </svg>
  );
}
