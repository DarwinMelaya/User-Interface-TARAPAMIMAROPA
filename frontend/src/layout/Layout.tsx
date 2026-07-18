import { Outlet, useLocation } from "react-router-dom";
import RegionSidebar from "./RegionSidebar";
import PstoSidebar from "./PstoSidebar";

const Layout = () => {
  const location = useLocation();
  const isPsto = location.pathname.startsWith("/psto");

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {isPsto ? <PstoSidebar /> : <RegionSidebar />}
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
