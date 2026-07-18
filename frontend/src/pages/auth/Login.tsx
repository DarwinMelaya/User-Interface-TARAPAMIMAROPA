import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
  HiBuildingOffice2,
  HiEnvelope,
  HiLockClosed,
  HiShieldCheck,
} from "react-icons/hi2";

type Role = "regional-director" | "psto";

const ROLES: {
  id: Role;
  label: string;
  desc: string;
  Icon: typeof HiShieldCheck;
  activeClass: string;
  iconClass: string;
  redirect: string;
}[] = [
  {
    id: "regional-director",
    label: "Regional Director",
    desc: "Region-wide command map",
    Icon: HiShieldCheck,
    activeClass: "border-blue-400/60 bg-blue-500/15 text-blue-100",
    iconClass: "from-blue-500 to-indigo-500",
    redirect: "/regional-director/dashboard",
  },
  {
    id: "psto",
    label: "PSTO",
    desc: "Provincial S&T Office",
    Icon: HiBuildingOffice2,
    activeClass: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
    iconClass: "from-emerald-500 to-teal-500",
    redirect: "/psto/dashboard",
  },
];

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("regional-director");

  const active = ROLES.find((r) => r.id === role) ?? ROLES[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(active.redirect, { replace: true });
  };

  const isRd = role === "regional-director";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div
        className={[
          "pointer-events-none absolute inset-0 transition-colors duration-500",
          isRd
            ? "bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.18),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(34,211,238,0.12),transparent_40%)]"
            : "bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(45,212,191,0.12),transparent_40%)]",
        ].join(" ")}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div
            className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${active.iconClass} shadow-[0_0_28px_rgba(59,130,246,0.4)] transition`}
          >
            <active.Icon className="h-7 w-7 text-white" aria-hidden />
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-blue-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            TARA PAMIMAROPA
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            STI Command Center · MIMAROPA
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-6"
        >
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Sign in as
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const isActive = r.id === role;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={[
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition",
                    isActive
                      ? r.activeClass
                      : "border-slate-700/70 bg-slate-950/40 text-slate-400 hover:border-slate-600",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <r.Icon className="h-5 w-5" aria-hidden />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[10px] opacity-70">{r.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-400">
                Email
              </span>
              <div className="relative">
                <HiEnvelope
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="email"
                  autoComplete="username"
                  defaultValue={
                    isRd ? "director@mimaropa.dost.gov.ph" : "psto@mimaropa.dost.gov.ph"
                  }
                  placeholder="you@dost.gov.ph"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-400">
                Password
              </span>
              <div className="relative">
                <HiLockClosed
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  defaultValue="demo"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className={[
              "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition",
              isRd
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_24px_rgba(59,130,246,0.4)]"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_24px_rgba(16,185,129,0.4)]",
            ].join(" ")}
          >
            <HiArrowRightOnRectangle className="h-5 w-5" aria-hidden />
            Sign in to {active.label}
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-500">
            Presentation build · credentials are for demo only.
          </p>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
