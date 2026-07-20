import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiArrowLeftOnRectangle,
  HiBars3,
  HiClipboardDocumentList,
  HiSquares2X2,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";

const linkBase =
  "flex w-full min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition duration-[180ms] focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

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
  {
    to: "/regional-director/employee-record",
    label: "Employee Record",
    shortLabel: "Employee Record",
    Icon: HiUserGroup,
  },
];

const RegionSidebar = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onLogout = () => {
    navigate("/login", { replace: true });
  };

  const closeDrawer = () => setDrawerOpen(false);

  const brandBlock = (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
        T
      </span>
      <div className="min-w-0 leading-snug">
        <p className="truncate text-sm font-semibold text-white">
          TARA PAMIMAROPA
        </p>
        <p className="truncate text-xs text-slate-400">Regional Director</p>
      </div>
    </div>
  );

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-0.5" aria-label="Regional director">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              linkBase,
              isActive
                ? "bg-slate-800 font-medium text-white"
                : "font-normal text-slate-400 hover:bg-slate-900 hover:text-slate-200",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={[
                  "h-4 w-4 shrink-0",
                  isActive ? "text-blue-400" : "text-slate-500",
                ].join(" ")}
                aria-hidden
              />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const logoutButton = (className: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm font-medium text-slate-300 transition duration-[180ms] hover:border-slate-600 hover:bg-slate-900 hover:text-white",
        className,
      ].join(" ")}
    >
      <HiArrowLeftOnRectangle className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  );

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Regional director navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch">
          {navItems.map(({ to, shortLabel, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeDrawer}
              className={({ isActive }) =>
                [
                  "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-xs outline-none transition duration-[180ms]",
                  isActive
                    ? "font-medium text-white"
                    : "font-normal text-slate-500 active:text-slate-300",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={[
                      "h-5 w-5",
                      isActive ? "text-blue-400" : "text-inherit",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span>{shortLabel}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-normal text-slate-500 outline-none transition duration-[180ms] active:text-slate-300"
            aria-label="Open region menu"
          >
            <HiBars3 className="h-5 w-5" aria-hidden />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Region menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={closeDrawer}
            aria-label="Close menu"
          />
          <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-xl border border-slate-800 bg-slate-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
            <div className="mb-6 flex items-center justify-between gap-3">
              {brandBlock}
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition duration-[180ms] hover:bg-slate-900 hover:text-white"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <p className="mb-2 px-3 text-xs font-medium text-slate-500">Menu</p>
            {navList(closeDrawer)}

            <div className="mt-6 border-t border-slate-800 pt-4">
              {logoutButton("", () => {
                closeDrawer();
                onLogout();
              })}
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-200 lg:flex">
        <div className="border-b border-slate-800 px-4 py-5">{brandBlock}</div>

        <div className="flex flex-1 flex-col px-3 py-4">
          <p className="mb-2 px-3 text-xs font-medium text-slate-500">Menu</p>
          {navList()}
        </div>

        <div className="border-t border-slate-800 p-3">
          {logoutButton("", onLogout)}
        </div>
      </aside>
    </>
  );
};

export default RegionSidebar;
