import { Outlet } from "react-router-dom";
import RegionSidebar from "./RegionSidebar";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <RegionSidebar />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
