import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
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

function formatStatusLabel(messages, status) {
  const normalizedStatus = String(status || "").toLowerCase();
  if (!normalizedStatus) {
    return "";
  }

  return (
    messages.common.statusLabels?.[normalizedStatus] ||
    `${normalizedStatus.charAt(0).toUpperCase()}${normalizedStatus.slice(1)}`
  );
}

function ViewApplicationData({ data, onBack, copy, messages }) {
  const profileSpeech =
  [
    data.name && `Name: ${data.name}`,
    data.email && `Email: ${data.email}`,
    data.contact && `Contact: ${data.contact}`,
    data.location && `Location: ${data.location}`,
    data.qualification && `Qualification: ${data.qualification}`,
    data.skills && `Skills: ${data.skills}`,
    data.previousJob && `Previous Job: ${data.previousJob}`,
    data.roles && `Roles: ${data.roles}`,
    data.skillsApplied && `Skills Applied: ${data.skillsApplied}`,
    data.certifications && `Certifications: ${data.certifications}`,
    data.portfolio && `Portfolio: ${data.portfolio}`,
    data.preferences && `Preferences: ${data.preferences}`,
  ]
    .filter(Boolean)
    .join(". ") || "No profile information available.";
  
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
        {data.profile_pic && (
          <img
            src={data.profile_pic}
            alt={copy.uploadLabel}
            className="h-28 w-28 rounded-[1.75rem] object-cover shadow-lg"
          />
        )}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-slate-950">
              {messages.viewPages.seekerTitle}
            </h2>

            <SpeakButton text={profileSpeech} />
          </div>
          <p className="mt-2 text-base text-slate-600">{messages.jobSeekerDashboard.viewBody}</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.personalInformation}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoField label={copy.fields.name.label} value={data.name} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.email.label} value={data.email} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.contact.label} value={data.contact} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.location.label} value={data.location} emptyLabel={messages.common.notProvided} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.educationExperience}</h3>
          <div className="mt-5 grid gap-4">
            <InfoField label={copy.fields.qualification.label} value={data.qualification} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.skills.label} value={data.skills} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.previousJob.label} value={data.previousJob} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.roles.label} value={data.roles} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.skillsApplied.label} value={data.skillsApplied} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.certifications.label} value={data.certifications} emptyLabel={messages.common.notProvided} />
            <InfoField label={copy.fields.portfolio.label} value={data.portfolio} emptyLabel={messages.common.notProvided} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
          <h3 className="text-2xl font-semibold text-slate-950">{messages.viewPages.preferenceSection}</h3>
          <div className="mt-5">
            <InfoField label={copy.fields.preferences.label} value={data.preferences} emptyLabel={messages.common.notProvided} />
          </div>
        </section>
      </div>
    </div>
  );
}

function UnavailableData({ message, onBack, messages }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h2 className="text-2xl font-semibold text-slate-950">{messages.viewPages.profileNotFound}</h2>
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

function ViewJobRecommendations({ userId, onBack, messages, language }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [appliedPostingIds, setAppliedPostingIds] = useState([]);
  const [applicationStatusByPosting, setApplicationStatusByPosting] = useState({});
  const [applyingPostingIds, setApplyingPostingIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendationStatus, setRecommendationStatus] = useState("idle");
  const [page, setPage] = useState(0);
  const perPage = 6;

  const handleApply = async ({ postingId, jobId }) => {
    if (!postingId) {
      alert(messages.jobSeekerDashboard.missingPostingId);
      return;
    }

    if (appliedPostingIds.includes(postingId)) {
      return;
    }

    try {
      setApplyingPostingIds((previous) => [...previous, postingId]);

      const response = await fetch(buildApiUrl("/api/apply-recommended-job"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          posting_id: postingId,
          job_id: jobId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || messages.jobSeekerDashboard.applyFailure);
      }

      setAppliedPostingIds((previous) =>
        previous.includes(postingId) ? previous : [...previous, postingId]
      );
      setApplicationStatusByPosting((previous) => ({
        ...previous,
        [postingId]: previous[postingId] || "applied",
      }));
      alert(messages.jobSeekerDashboard.applySuccess);
    } catch (applyError) {
      console.error("Error applying to recommended job:", applyError);
      alert(messages.jobSeekerDashboard.applyFailure);
    } finally {
      setApplyingPostingIds((previous) => previous.filter((id) => id !== postingId));
    }
  };

  useEffect(() => {
    let isActive = true;
    let pollTimer = null;
    const maxPollAttempts = 30;
    const pollDelayMs = 2000;

    const fetchJobRecommendations = async () => {
      const requestRecommendations = async (attempt = 0) => {
        let keepLoading = false;

        try {
          if (attempt === 0) {
            setLoading(true);
            setError(null);
            setRecommendationStatus("idle");
          }

          const response = await fetch(
            buildApiUrl(`/api/job-recommendations/${userId}`, { lang: language })
          );
          const data = await response.json();

          if (!isActive) {
            return;
          }

          const rankedJobs = Array.isArray(data.ranked_jobs) ? data.ranked_jobs : [];
          const nextStatus = typeof data.status === "string" ? data.status : "ready";
          setRecommendations(rankedJobs);
          setAppliedPostingIds(data.applied_posting_ids || []);
          setApplicationStatusByPosting(data.application_status_by_posting || {});
          setRecommendationStatus(nextStatus);

          if (nextStatus === "failed" && !rankedJobs.length) {
            setError(messages.jobSeekerDashboard.recommendationsPreparingFailed);
            return;
          }

          const shouldPollAgain =
            (nextStatus === "queued" || nextStatus === "regenerating") &&
            !rankedJobs.length &&
            attempt < maxPollAttempts;

          if (shouldPollAgain) {
            keepLoading = true;
            pollTimer = window.setTimeout(() => {
              requestRecommendations(attempt + 1);
            }, pollDelayMs);
          }
        } catch (fetchError) {
          console.error("Error fetching recommendations:", fetchError);
          if (isActive) {
            setError(messages.jobSeekerDashboard.couldNotLoadRecommendations);
          }
        } finally {
          if (isActive && !keepLoading) {
            setLoading(false);
          }
        }
      };

      try {
        await requestRecommendations();
      } catch (unexpectedError) {
        console.error("Unexpected recommendation polling error:", unexpectedError);
        if (isActive) {
          setError(messages.jobSeekerDashboard.couldNotLoadRecommendations);
          setLoading(false);
        }
      }
    };

    fetchJobRecommendations();

    return () => {
      isActive = false;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [
    language,
    messages.jobSeekerDashboard.couldNotLoadRecommendations,
    messages.jobSeekerDashboard.recommendationsPreparingFailed,
    userId,
  ]);

  const currentItems = recommendations.slice(page * perPage, (page + 1) * perPage);

  if (loading) {
    return <p className="text-lg text-slate-600">{messages.jobSeekerDashboard.loadingRecommendations}</p>;
  }

  if (error) {
    return <p className="text-lg text-rose-600">{error}</p>;
  }

  if (
    !recommendations.length &&
    (recommendationStatus === "queued" || recommendationStatus === "regenerating")
  ) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-sky-300 bg-sky-50/70 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-950">
          {messages.jobSeekerDashboard.updatingRecommendationsTitle}
        </h2>
        <p className="mt-3 text-base text-slate-600">
          {messages.jobSeekerDashboard.updatingRecommendationsBody}
        </p>
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

  if (!recommendations.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-950">
          {messages.jobSeekerDashboard.noMatchesTitle}
        </h2>
        <p className="mt-3 text-base text-slate-600">
          {messages.jobSeekerDashboard.noMatchesBody}
        </p>
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
        {messages.jobSeekerDashboard.recommendationTitle}
      </h2>
      <p className="mt-2 text-base text-slate-600">
        {messages.jobSeekerDashboard.recommendationCount({ count: recommendations.length })}
      </p>

      <div className="mt-8 space-y-5">
        {currentItems.map((job) => {
          const routeJobId = job.posting_id || job.job_id;
          const postingId = job.posting_id;
          const applicationStatus = postingId ? applicationStatusByPosting[postingId] : null;
          const alreadyApplied =
            postingId
              ? applicationStatus === "applied" ||
                applicationStatus === "selected" ||
                appliedPostingIds.includes(postingId)
              : false;
          const isSelected = applicationStatus === "selected";
          const isApplying = postingId ? applyingPostingIds.includes(postingId) : false;

          const jobSpeech = [
            job.job_title && `Job Title: ${job.job_title}`,
          
            job.company && `Company: ${job.company}`,
          
            (job.location || job.job_location) &&
              `Location: ${job.location || job.job_location}`,
          
            (job.job_description || job.description) &&
              `Job Description: ${
                job.job_description || job.description
              }`,

            job.job_score != null &&
              `Overall Match Score: ${(job.job_score * 100).toFixed(0)} percent`,

            
            job.explanation &&
              `Why this job matches you: ${job.explanation}`,
            
            job.skill_score != null &&
              `Skills Match: ${(job.skill_score * 100).toFixed(0)} percent`,
            
            job.constraint_score != null &&
              `Constraint Match: ${(job.constraint_score * 100).toFixed(0)} percent`,
          ]
            .filter(Boolean)
            .join(". ") || "No job information available.";
          return (
            <div
              key={routeJobId || job.job_title}
              className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">
                    {job.job_title}
                  </h3>

                  <p className="mt-2 text-base text-slate-600">
                    {job.company}
                  </p>

                  {applicationStatus && (
                    <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {formatStatusLabel(messages, applicationStatus)}
                    </span>
                  )}
                </div>
                
                <SpeakButton text={jobSpeech} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {messages.jobSeekerDashboard.skillsMatch}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {(job.skill_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {messages.jobSeekerDashboard.constraintsMatch}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {(job.constraint_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {job.explanation && (
                <div className="mt-5 rounded-[1.25rem] bg-amber-50 p-4 text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {messages.jobSeekerDashboard.explanation}
                  </p>
                  <p className="mt-2 leading-7">{job.explanation}</p>
                </div>
              )}

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
                <button
                  type="button"
                  disabled={!routeJobId}
                  onClick={() =>
                    navigate(`/view-job/${routeJobId}`, {
                      state: {
                        matchScore: (job.job_score * 100).toFixed(0),
                        jobId: job.job_id,
                        postingId: job.posting_id,
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {messages.jobSeekerDashboard.matchesTitle}
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  disabled={!postingId || alreadyApplied || isApplying}
                  onClick={() => handleApply({ postingId, jobId: job.job_id })}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSelected
                    ? messages.jobSeekerDashboard.selectedAction
                    : alreadyApplied
                      ? messages.jobSeekerDashboard.appliedAction
                      : isApplying
                        ? messages.jobSeekerDashboard.applyingAction
                        : messages.jobSeekerDashboard.applyAction}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > perPage && (
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
              end: Math.min((page + 1) * perPage, recommendations.length),
              total: recommendations.length,
            })}
          </p>
          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(Math.floor((recommendations.length - 1) / perPage), current + 1)
              )
            }
            disabled={(page + 1) * perPage >= recommendations.length}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.common.next}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JobSeekerDashboard() {
  const navigate = useNavigate();
  const { messages, language } = useLocale();
  const copy = messages.jobSeekerForm;
  const [applicationData, setApplicationData] = useState(null);
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

    const fetchApplicationData = async () => {
      try {
        const response = await fetch(
          buildApiUrl(`/api/get-job-seeker-application/${userFromStorage.id}`, { lang: language })
        );
        const result = await response.json();
        if (result.application) {
          setApplicationData(result.application);
        }
      } catch (error) {
        console.error("Error fetching application:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [language, messages.common.sessionMissing, navigate]);

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
      title: applicationData
        ? messages.jobSeekerDashboard.updateTitle
        : messages.jobSeekerDashboard.fillTitle,
      body: applicationData
        ? messages.jobSeekerDashboard.updateBody
        : messages.jobSeekerDashboard.fillBody,
      action: () => navigate("/job-seeker-form"),
    },
    {
      title: messages.jobSeekerDashboard.viewTitle,
      body: messages.jobSeekerDashboard.viewBody,
      action: () => setActiveTab("view"),
    },
    {
      title: messages.jobSeekerDashboard.matchesTitle,
      body: messages.jobSeekerDashboard.matchesBody,
      action: () => setActiveTab("results"),
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
              {messages.jobSeekerDashboard.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {messages.jobSeekerDashboard.body}
            </p>
          </section>

          <section className="mt-8 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            {activeTab === "options" && (
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  {messages.jobSeekerDashboard.hubTitle}
                </h2>
                <p className="mt-3 text-base text-slate-600">
                  {applicationData
                    ? messages.jobSeekerDashboard.welcomeBack
                    : messages.jobSeekerDashboard.welcomeNew}
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
              (applicationData ? (
                <ViewApplicationData
                  data={applicationData}
                  onBack={() => setActiveTab("options")}
                  copy={copy}
                  messages={messages}
                />
              ) : (
                <UnavailableData
                  message={messages.jobSeekerDashboard.noProfile}
                  onBack={() => setActiveTab("options")}
                  messages={messages}
                />
              ))}

            {activeTab === "results" && user && (
              <ViewJobRecommendations
                userId={user.id}
                onBack={() => setActiveTab("options")}
                messages={messages}
                language={language}
              />
            )}

          </section>
        </div>
      </main>
    </>
  );
}
