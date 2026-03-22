import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useLocale } from "../context/LocaleContext";

function InfoField({ label, value, emptyLabel }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-base text-slate-800">{value || emptyLabel}</p>
    </div>
  );
}

function ViewApplicationData({ data, onBack, messages, copy }) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700"
      >
        <ArrowLeft size={18} />
        {messages.common.backToJobSeekers}
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
          <h2 className="text-3xl font-semibold text-slate-950">{messages.viewPages.seekerTitle}</h2>
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
        {messages.common.backToJobSeekers}
      </button>
    </div>
  );
}

export default function ViewJobSeekerProfilePage() {
  const navigate = useNavigate();
  const { seekerId } = useParams();
  const { messages } = useLocale();
  const copy = messages.jobSeekerForm;
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeekerProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://127.0.0.1:5000/api/get-job-seeker-application/${seekerId}`
        );
        const data = await response.json();
        if (data.application) {
          setProfileData(data.application);
        } else {
          setError(messages.viewPages.couldNotLoadProfile);
        }
      } catch (fetchError) {
        console.error("Error fetching seeker profile:", fetchError);
        setError(messages.viewPages.retryProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchSeekerProfile();
  }, [messages.viewPages.couldNotLoadProfile, messages.viewPages.retryProfile, seekerId]);

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
              {messages.viewPages.seekerTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              {messages.viewPages.seekerBody}
            </p>
          </section>

          <section className="mt-8 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8">
            {loading && <p className="text-lg text-slate-600">{messages.viewPages.loadingProfile}</p>}
            {error && !loading && (
              <UnavailableData
                message={error}
                onBack={() => navigate("/job-provider-dashboard")}
                messages={messages}
              />
            )}
            {profileData && !loading && (
              <ViewApplicationData
                data={profileData}
                onBack={() => navigate("/job-provider-dashboard")}
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
