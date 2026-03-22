import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLocale } from "../context/LocaleContext";
import { formatOptionLabel } from "../content/locales";

function InfoField({ label, value, emptyLabel }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-base text-slate-800">{value || emptyLabel}</p>
    </div>
  );
}

function ViewJobPosting({ data, onBack, copy, messages }) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700"
      >
        <ArrowLeft size={18} />
        {messages.common.backToOptions}
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
          <h2 className="text-3xl font-semibold text-slate-950">{messages.viewPages.jobTitle}</h2>
          <p className="mt-2 text-base text-slate-600">{messages.jobProviderDashboard.viewBody}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.companyInformation}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoField label={copy.fields.name.label} value={data.name} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.email.label} value={data.email} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.phoneNumber.label} value={data.phoneNumber || data.phone_number} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.companyName.label} value={data.companyName || data.company_name} emptyLabel={messages.common.notProvided} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.jobDetailsSection}</h3>
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
        {messages.common.backToOptions}
      </button>
    </div>
  );
}

function ViewJobApplications({ userId, onBack, hasJobPosting, messages }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const perPage = 6;

  useEffect(() => {
    if (!hasJobPosting) {
      setLoading(false);
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://127.0.0.1:5000/api/matching-job-seekers/${userId}`);
        const data = await response.json();
        setApplications(data.matches || []);
      } catch (fetchError) {
        console.error("Error fetching matching seekers:", fetchError);
        setError(messages.jobProviderDashboard.couldNotLoadCandidates);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [hasJobPosting, messages.jobProviderDashboard.couldNotLoadCandidates, userId]);

  if (!hasJobPosting) {
    return (
      <UnavailableData
        message={messages.jobProviderDashboard.noPosting}
        onBack={onBack}
        messages={messages}
      />
    );
  }

  if (loading) {
    return <p className="text-lg text-slate-600">{messages.jobProviderDashboard.loadingCandidates}</p>;
  }

  if (error) {
    return <p className="text-lg text-rose-600">{error}</p>;
  }

  if (!applications.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-950">
          {messages.jobProviderDashboard.noCandidates}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-sky-700"
        >
          <ArrowLeft size={18} />
          {messages.common.backToOptions}
        </button>
      </div>
    );
  }

  const currentItems = applications.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700"
      >
        <ArrowLeft size={18} />
        {messages.common.backToOptions}
      </button>

      <h2 className="mt-6 text-3xl font-semibold text-slate-950">
        {messages.jobProviderDashboard.candidatesTitle}
      </h2>
      <p className="mt-2 text-base text-slate-600">
        {messages.jobProviderDashboard.candidatesCount({ count: applications.length })}
      </p>

      <div className="mt-8 space-y-5">
        {currentItems.map((seeker) => (
          <button
            key={seeker.seeker_id}
            type="button"
            onClick={() => navigate(`/view-seeker/${seeker.seeker_id}`)}
            className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-sky-200"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-950">{seeker.seeker_name}</h3>
                <p className="mt-2 text-base text-slate-600">{seeker.seeker_email}</p>
              </div>
              <ChevronRight className="hidden text-sky-700 sm:block" />
            </div>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              {messages.jobProviderDashboard.clickProfile}
            </p>
          </button>
        ))}
      </div>

      {applications.length > perPage && (
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.common.previous}
          </button>
          <p className="text-sm text-slate-500">
            {messages.common.showingRange({
              start: page * perPage + 1,
              end: Math.min((page + 1) * perPage, applications.length),
              total: applications.length,
            })}
          </p>
          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(Math.floor((applications.length - 1) / perPage), current + 1)
              )
            }
            disabled={(page + 1) * perPage >= applications.length}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.common.next}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JobProviderDashboard() {
  const navigate = useNavigate();
  const { messages } = useLocale();
  const copy = messages.jobProviderForm;
  const [jobPostingData, setJobPostingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("options");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem("user"));
    if (!userFromStorage?.id) {
      alert(messages.common.sessionMissing);
      navigate("/login");
      return;
    }

    setUser(userFromStorage);

    const fetchJobPostingData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/get-job-posting/${userFromStorage.id}`);
        const result = await response.json();
        if (result.posting) {
          setJobPostingData(result.posting);
        }
      } catch (error) {
        console.error("Error fetching job posting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostingData();
  }, [messages.common.sessionMissing, navigate]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="px-4 py-16 text-center text-lg text-slate-600">{messages.common.loading}</div>
      </>
    );
  }

  const actionCards = [
    {
      title: jobPostingData
        ? messages.jobProviderDashboard.updateTitle
        : messages.jobProviderDashboard.createTitle,
      body: jobPostingData
        ? messages.jobProviderDashboard.updateBody
        : messages.jobProviderDashboard.createBody,
      action: () => navigate("/job-provider-form"),
    },
    {
      title: messages.jobProviderDashboard.viewTitle,
      body: messages.jobProviderDashboard.viewBody,
      action: () => setActiveTab("view"),
    },
    {
      title: messages.jobProviderDashboard.applicationsTitle,
      body: messages.jobProviderDashboard.applicationsBody,
      action: () => setActiveTab("applications"),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
            {messages.common.backToHome}
          </button>

          <section className="mt-6 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              {messages.brand.shortName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {messages.jobProviderDashboard.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {messages.jobProviderDashboard.body}
            </p>
          </section>

          <section className="mt-8 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            {activeTab === "options" && (
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  {messages.jobProviderDashboard.hubTitle}
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  {jobPostingData
                    ? messages.jobProviderDashboard.welcomeBack
                    : messages.jobProviderDashboard.welcomeNew}
                </p>
                <div className="mt-8 grid gap-5">
                  {actionCards.map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={card.action}
                      className="flex w-full items-center justify-between rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
                    >
                      <div>
                        <h3 className="text-2xl font-semibold text-slate-950">{card.title}</h3>
                        <p className="mt-2 text-base text-slate-600">{card.body}</p>
                      </div>
                      <ChevronRight className="hidden text-sky-700 sm:block" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "view" &&
              (jobPostingData ? (
                <ViewJobPosting
                  data={jobPostingData}
                  onBack={() => setActiveTab("options")}
                  copy={copy}
                  messages={messages}
                />
              ) : (
                <UnavailableData
                  message={messages.jobProviderDashboard.noPosting}
                  onBack={() => setActiveTab("options")}
                  messages={messages}
                />
              ))}

            {activeTab === "applications" && user && (
              <ViewJobApplications
                userId={user.id}
                onBack={() => setActiveTab("options")}
                hasJobPosting={!!jobPostingData}
                messages={messages}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
