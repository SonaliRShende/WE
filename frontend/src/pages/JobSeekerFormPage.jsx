import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import JobSeekerApplication from "./JobSeekerApplication";
import { buildApiUrl } from "../config/api";

export default function JobSeekerFormPage() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem("user"));
    if (!userFromStorage?.id) {
      alert(messages.common.sessionMissing);
      navigate("/login");
      return;
    }

    fetchApplicationData(userFromStorage.id);
  }, [messages.common.sessionMissing, navigate]);

  const fetchApplicationData = async (userId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/get-job-seeker-application/${userId}`));
      const result = await response.json();
      if (result.application) {
        setApplicationData(result.application);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="px-4 py-16 text-center text-lg text-slate-600">{messages.common.loading}</div>
  );

  return (
    <JobSeekerApplication 
      existingData={applicationData}
      onSuccess={() => {
        setTimeout(() => {
          navigate("/job-seeker-dashboard");
        }, 1500);
      }}
    />
  );
}
