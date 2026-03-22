import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import JobProviderApplication from "./JobProviderApplication";
import { buildApiUrl } from "../config/api";

export default function JobProviderFormPage() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const [jobPostingData, setJobPostingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem("user"));
    if (!userFromStorage?.id) {
      alert(messages.common.sessionMissing);
      navigate("/login");
      return;
    }

    fetchJobPostingData(userFromStorage.id);
  }, [messages.common.sessionMissing, navigate]);

  const fetchJobPostingData = async (userId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/get-job-posting/${userId}`));
      const result = await response.json();
      if (result.posting) {
        setJobPostingData(result.posting);
      }
    } catch (error) {
      console.error('Error fetching job posting:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="px-4 py-16 text-center text-lg text-slate-600">{messages.common.loading}</div>
  );

  return (
    <JobProviderApplication 
      existingData={jobPostingData}
      onSuccess={() => {
        setTimeout(() => {
          navigate("/job-provider-dashboard");
        }, 1500);
      }}
    />
  );
}
