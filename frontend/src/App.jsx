import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landingpage";
import Register from "./pages/Registration/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import JobSeekerApplication from "./pages/JobSeekerApplication";
import JobSeekerFormPage from "./pages/JobSeekerFormPage";
import JobProviderApplication from "./pages/JobProviderApplication";
import JobProviderFormPage from "./pages/JobProviderFormPage";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import JobProviderDashboard from "./pages/JobProviderDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/find-job" element={<JobSeekerApplication/>}/>
        <Route path="/job-seeker-form" element={<JobSeekerFormPage/>}/>
        <Route path="/offer-job" element={<JobProviderApplication/>}/>
        <Route path="/job-provider-form" element={<JobProviderFormPage/>}/>
        <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard/>}/>
        <Route path="/job-provider-dashboard" element={<JobProviderDashboard/>}/>
      </Routes>
    </Router>
  );
}

export default App;
