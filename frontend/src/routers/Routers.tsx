import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage, Login, RegionDashboard, RegionPrograms } from "../pages";

const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* auth */}
        <Route path="/login" element={<Login />} />
        {/* regional director */}
        <Route
          path="/regional-director/dashboard"
          element={<RegionDashboard />}
        />
        <Route
          path="/regional-director/programs"
          element={<RegionPrograms />}
        />
      </Routes>
    </Router>
  );
};

export default Routers;
