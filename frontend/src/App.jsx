import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landingpage";
import Register from "./pages/Registration/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import JobSeekerApplication from "./pages/JobSeekerApplication";
import JobProviderApplication from "./pages/JobProviderApplication";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/find-job" element={<JobSeekerApplication/>}/>
        <Route path="/offer-job" element={<JobProviderApplication/>}/>
      </Routes>
    </Router>
  );
}

export default App;
