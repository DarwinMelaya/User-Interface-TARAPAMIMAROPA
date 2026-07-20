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
  redirect: string;
}[] = [
  {
    id: "regional-director",
    label: "Regional Director",
    desc: "Region-wide command map",
    Icon: HiShieldCheck,
    redirect: "/regional-director/dashboard",
  },
  {
    id: "psto",
    label: "PSTO",
    desc: "Provincial S&T Office",
    Icon: HiBuildingOffice2,
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f6f9] px-4 py-10 text-slate-800">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,56,168,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,56,168,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#e8eef8] via-transparent to-[#f4f6f9]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-[10px] bg-[#0038a8] text-xl font-black text-white shadow-[0_2px_8px_rgba(0,56,168,0.18)]">
            T
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[#0038a8]">
            TARAPAMIMAROPA
          </h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            DOST-MIMAROPA · Staff sign-in
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[14px] border border-[#c5cdd8] bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.04)] sm:p-6"
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
                    "flex min-h-[44px] flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition duration-[180ms]",
                    isActive
                      ? "border-[#0038a8] bg-[#e8eef8] text-[#0038a8] shadow-[0_1px_2px_rgba(0,56,168,0.12)]"
                      : "border-[#c5cdd8] bg-[#f8fafc] text-slate-600 hover:border-[#0038a8] hover:text-[#0038a8]",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <r.Icon className="h-5 w-5" aria-hidden />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[10px] text-slate-500">{r.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Email
              </span>
              <div className="relative">
                <HiEnvelope
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="email"
                  autoComplete="username"
                  defaultValue={
                    isRd
                      ? "director@mimaropa.dost.gov.ph"
                      : "psto@mimaropa.dost.gov.ph"
                  }
                  placeholder="you@dost.gov.ph"
                  className="w-full rounded-[6px] border border-[#b8c0cc] bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition duration-[180ms] focus:border-[#0038a8] focus:ring-2 focus:ring-[#0038a8]/20"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Password
              </span>
              <div className="relative">
                <HiLockClosed
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  defaultValue="demo"
                  placeholder="••••••••"
                  className="w-full rounded-[6px] border border-[#b8c0cc] bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition duration-[180ms] focus:border-[#0038a8] focus:ring-2 focus:ring-[#0038a8]/20"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-[6px] border border-[#0038a8] bg-[#0038a8] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-[180ms] hover:scale-[1.01] hover:bg-[#002d87] hover:shadow-[0_2px_8px_rgba(0,56,168,0.2)]"
          >
            <HiArrowRightOnRectangle className="h-5 w-5" aria-hidden />
            Sign in to {active.label}
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-500">
            Presentation build. Credentials for demo only.
          </p>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 transition duration-[180ms] hover:text-[#0038a8]"
          >
            Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
