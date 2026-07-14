import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HiArrowLeftOnRectangle,
  HiBars3,
  HiClipboardDocumentList,
  HiShieldCheck,
  HiSquares2X2,
  HiXMark,
} from "react-icons/hi2";

const linkBase =
  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const navItems = [
  {
    to: "/regional-director/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    Icon: HiSquares2X2,
  },
  {
    to: "/regional-director/programs",
    label: "Programs",
    shortLabel: "Programs",
    Icon: HiClipboardDocumentList,
  },
];

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors outline-none",
    isActive ? "text-blue-300" : "text-slate-500 active:text-blue-200",
  ].join(" ");

const RegionSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onLogout = () => {
    navigate("/login", { replace: true });
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-900/60 bg-gradient-to-t from-[#001e5a] via-blue-950 to-slate-950 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Regional director navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch px-1">
          {navItems.map(({ to, shortLabel, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={mobileLinkClass}
              onClick={closeDrawer}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      isActive
                        ? "bg-blue-500/25 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.35)]"
                        : "text-inherit",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em]">
                    {shortLabel}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-slate-500 outline-none active:text-blue-200"
            aria-label="Open region menu"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl">
              <HiBars3 className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Region menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-label="Close menu"
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-blue-800/60 bg-gradient-to-b from-slate-950 via-blue-950 to-[#001e5a] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_0_18px_rgba(59,130,246,0.45)]">
                  <HiShieldCheck className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Regional Director
                  </p>
                  <p className="text-xs text-blue-200/70">
                    Programs & oversight
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-800/60 text-slate-300"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    [
                      linkBase,
                      isActive
                        ? "bg-blue-500/25 text-white ring-1 ring-blue-300/40"
                        : "text-slate-300 hover:bg-blue-500/10",
                    ].join(" ")
                  }
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-blue-900/60 bg-blue-950/60 px-3 py-3 text-xs text-blue-100/75">
              <HiShieldCheck
                className="mb-2 h-5 w-5 text-blue-300/80"
                aria-hidden
              />
              Signed in as{" "}
              <span className="font-semibold text-white">
                Regional Director
              </span>
              <p className="mt-1 truncate text-[10px] text-blue-300/50">
                {location.pathname}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                closeDrawer();
                onLogout();
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300"
            >
              <HiArrowLeftOnRectangle className="h-5 w-5" aria-hidden />
              Logout
            </button>
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-blue-900/60 bg-gradient-to-b from-slate-950 via-blue-950 to-[#001e5a] text-slate-200 shadow-[0_0_35px_rgba(37,99,235,0.2)] lg:flex">
        <div className="border-b border-blue-900/50 px-5 py-5">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-bold text-white shadow-[0_0_18px_rgba(59,130,246,0.45)]">
            <HiShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="mt-3 text-sm font-semibold tracking-wide text-white">
            Regional Director
          </div>
          <div className="text-xs text-blue-200/80">Programs and Oversight</div>
        </div>

        <nav className="flex-1 px-4 py-5">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/60">
            Navigation
          </div>

          <div className="space-y-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    linkBase,
                    isActive
                      ? "bg-blue-500/25 text-white ring-1 ring-blue-300/40 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                      : "text-slate-300 hover:bg-blue-500/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-blue-900/50 p-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-blue-900/60 bg-blue-950/60 px-3 py-3 text-xs text-blue-100/75 backdrop-blur-sm">
            <HiShieldCheck
              className="h-5 w-5 shrink-0 text-blue-300/80"
              aria-hidden
            />
            <span>
              Signed in as{" "}
              <span className="font-semibold text-white">
                Regional Director
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <HiArrowLeftOnRectangle className="h-5 w-5" aria-hidden />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default RegionSidebar;
