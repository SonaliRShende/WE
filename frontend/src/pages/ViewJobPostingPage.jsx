import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatOptionLabel } from "../content/locales";
import { useLocale } from "../context/LocaleContext";
import { buildApiUrl } from "../config/api";
import SpeakButton from "../components/SpeakButton";

function InfoField({ label, value, emptyLabel }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-base text-slate-800">{value || emptyLabel}</p>
    </div>
  );
}

function ViewJobPostingDetail({ data, onBack, matchScore, messages, copy }) {
const jobSpeech =
  [
    (data.jobTitle || data.job_title) &&
      `Job Title: ${data.jobTitle || data.job_title}`,

    (data.companyName || data.company_name) &&
      `Company Name: ${data.companyName || data.company_name}`,

    (data.jobLocation || data.job_location) &&
      `Location: ${data.jobLocation || data.job_location}`,

    (data.jobCategory || data.job_category) &&
      `Job Category: ${formatOptionLabel(
        messages,
        "jobCategories",
        data.jobCategory || data.job_category
      )}`,

    (data.jobType || data.job_type) &&
      `Job Type: ${formatOptionLabel(
        messages,
        "jobTypes",
        data.jobType || data.job_type
      )}`,

    (data.experienceRequired || data.experience_required) &&
      `Experience Required: ${
        data.experienceRequired || data.experience_required
      }`,

    (data.salaryMin || data.salary_min) &&
      `Salary: ${data.salaryMin || data.salary_min} to ${
        data.salaryMax || data.salary_max
      } ${formatOptionLabel(
        messages,
        "salaryTypes",
        data.salaryType || data.salary_type
      )}`,

    (data.jobDescription || data.job_description) &&
      `Job Description: ${
        data.jobDescription || data.job_description
      }`,

    data.benefits &&
      `Benefits: ${data.benefits}`,

    (data.requiredQualifications || data.required_qualifications) &&
      `Required Qualifications: ${
        data.requiredQualifications ||
        data.required_qualifications
      }`,
  ]
    .filter(Boolean)
    .join(". ") ||
  "No job information available.";
  
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700"
      >
        <ArrowLeft size={18} />
        {messages.common.backToRecommendations}
      </button>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
        {data.company_logo && (
          <img
            src={data.company_logo}
            alt={copy.uploadLabel}
            className="h-24 w-24 rounded-[1.75rem] object-cover shadow-lg"
          />
        )}
        <div>
          <div className="flex items-center gap-3">

              <h2 className="text-3xl font-semibold text-slate-950">
                  {messages.viewPages.jobTitle}
              </h2>

              <SpeakButton text={jobSpeech} />

          </div>
          {matchScore && (
            <p className="mt-2 text-base font-semibold text-sky-700">
              {messages.viewPages.matchScore({ score: matchScore })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.companyInformation}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoField label={copy.fields.companyName.label} value={data.companyName || data.company_name} emptyLabel={messages.common.notProvided} />
            <InfoField label={messages.viewPages.contactEmail} value={data.email} emptyLabel={messages.common.notProvided} />
            <InfoField label={messages.viewPages.contactPhone} value={data.phoneNumber || data.phone_number} emptyLabel={messages.common.notProvided} />
            <InfoField label={messages.viewPages.contactName} value={data.name} emptyLabel={messages.common.notProvided} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.jobDetailsSection}</h3>
            <SpeakButton text={jobSpeech} />
          </div>
          <div className="mt-5 grid gap-4">
            <InfoField label={copy.fields.jobTitle.label} value={data.jobTitle || data.job_title} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.jobCategory.label} value={formatOptionLabel(messages, "jobCategories", data.jobCategory || data.job_category)} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.jobType.label} value={formatOptionLabel(messages, "jobTypes", data.jobType || data.job_type)} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.jobLocation.label} value={data.jobLocation || data.job_location} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.jobDescription.label} value={data.jobDescription || data.job_description} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.experienceRequired.label} value={data.experienceRequired || data.experience_required} emptyLabel={messages.common.notProvided} />
            <InfoField
              label={messages.viewPages.salaryRange}
              value={`${data.salaryMin || data.salary_min || ""} - ${data.salaryMax || data.salary_max || ""} (${formatOptionLabel(messages, "salaryTypes", data.salaryType || data.salary_type)})`}
              emptyLabel={messages.common.notProvided}
            />
            <InfoField label={copy.fields.benefits.label} value={data.benefits} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.requiredQualifications.label} value={data.requiredQualifications || data.required_qualifications} emptyLabel={messages.common.notProvided} />
          </div>
        </section>
      </div>
    </div>
  );
}

function UnavailableData({ message, onBack, messages }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h2 className="text-2xl font-semibold text-slate-950">{messages.viewPages.jobNotFound}</h2>
      <p className="mt-3 text-base text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-sky-700"
      >
        <ArrowLeft size={18} />
        {messages.common.backToRecommendations}
      </button>
    </div>
  );
}

export default function ViewJobPostingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const { messages, language } = useLocale();
  const copy = messages.jobProviderForm;
  const [postingData, setPostingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const matchScore = location.state?.matchScore ?? null;
  const candidateIds = [...new Set([jobId, location.state?.postingId, location.state?.jobId].filter(Boolean))];
  const candidateIdsKey = candidateIds.join("|");

  useEffect(() => {
    let isActive = true;

    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        setError(null);
        setPostingData(null);

        for (const candidateId of candidateIds) {
          const response = await fetch(
            buildApiUrl(`/api/get-job-posting-by-id/${candidateId}`, { lang: language })
          );

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          if (data.posting) {
            if (isActive) {
              setPostingData(data.posting);
            }
            return;
          }
        }

        if (isActive) {
          setError(messages.viewPages.couldNotLoadJob);
        }
      } catch (fetchError) {
        console.error("Error fetching job posting:", fetchError);
        if (isActive) {
          setError(messages.viewPages.retryJob);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (!candidateIds.length) {
      setLoading(false);
      setError(messages.viewPages.couldNotLoadJob);
      return undefined;
    }

    fetchJobPosting();

    return () => {
      isActive = false;
    };
  }, [candidateIdsKey, language, messages.viewPages.couldNotLoadJob, messages.viewPages.retryJob]);

  return (
    <>
      <Navbar />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              {messages.brand.shortName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {messages.viewPages.jobTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {messages.viewPages.jobBody}
            </p>
          </section>

          <section className="mt-8 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            {loading && <p className="text-lg text-slate-600">{messages.viewPages.loadingJob}</p>}
            {error && !loading && (
              <UnavailableData
                message={error}
                onBack={() => navigate("/job-seeker-dashboard")}
                messages={messages}
              />
            )}
            {postingData && !loading && (
              <ViewJobPostingDetail
                data={postingData}
                onBack={() => navigate("/job-seeker-dashboard")}
                matchScore={matchScore}
                messages={messages}
                copy={copy}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
