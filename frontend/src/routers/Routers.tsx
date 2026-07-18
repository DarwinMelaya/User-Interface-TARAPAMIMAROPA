import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  LandingPage,
  Login,
  RegionDashboard,
  RegionPrograms,
  PstoDashboard,
  PstoPrograms,
} from "../pages";
import Layout from "../layout/Layout";

const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* auth */}
        <Route path="/login" element={<Login />} />
        {/* regional director */}
        <Route path="/regional-director" element={<Layout />}>
          <Route path="dashboard" element={<RegionDashboard />} />
          <Route path="programs" element={<RegionPrograms />} />
        </Route>
        {/* psto */}
        <Route path="/psto" element={<Layout />}>
          <Route path="dashboard" element={<PstoDashboard />} />
          <Route path="programs" element={<PstoPrograms />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default Routers;
