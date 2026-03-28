import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Loader,
  Mic,
  MicOff,
  Upload,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useLocale } from "../context/LocaleContext";
import { buildApiUrl } from "../config/api";

const initialFormData = {
  name: "",
  age: "",
  phoneNumber: "",
  email: "",
  companyName: "",
  companyLogo: null,
  jobTitle: "",
  jobCategory: "",
  jobDescription: "",
  experienceRequired: "",
  salaryMin: "",
  salaryMax: "",
  salaryType: "yearly",
  jobLocation: "",
  jobType: "full-time",
  benefits: "",
  applicationDeadline: "",
  requiredQualifications: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

const VoiceFeedbackModal = ({ voiceState, toggleVoiceInput, fieldLabels, messages }) => {
  const { state, field } = voiceState;

  if (state === "idle") {
    return null;
  }

  const fieldLabel = fieldLabels[field] ?? field;

  const variants = {
    starting: {
      title: messages.voice.starting,
      icon: <Mic size={48} className="text-amber-500" />,
      border: "border-amber-300",
      buttonText: messages.voice.cancel,
      buttonClass: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    },
    listening: {
      title: messages.voice.listening,
      icon: <MicOff size={48} className="animate-pulse text-rose-500" />,
      border: "border-rose-300",
      buttonText: messages.voice.stop,
      buttonClass: "bg-rose-500 text-white hover:bg-rose-600",
    },
    processing: {
      title: messages.voice.processing,
      icon: <Loader size={48} className="animate-spin text-sky-600" />,
      border: "border-sky-300",
      buttonText: messages.voice.wait,
      buttonClass: "cursor-not-allowed bg-sky-100 text-sky-700",
    },
  };

  const current = variants[state];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-[2rem] border bg-white p-8 text-center shadow-2xl ${current.border}`}>
        <div className="flex justify-center">{current.icon}</div>
        <h3 className="mt-4 text-2xl font-semibold text-slate-950">{current.title}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {messages.common.fieldPrefix}: <strong>{fieldLabel}</strong>
        </p>
        <button
          type="button"
          onClick={() => toggleVoiceInput(field)}
          disabled={state === "processing"}
          className={`mt-6 rounded-full px-5 py-3 text-sm font-semibold transition ${current.buttonClass}`}
        >
          {current.buttonText}
        </button>
        {state === "listening" && (
          <p className="mt-3 text-xs text-slate-500">{messages.voice.autoStop}</p>
        )}
      </div>
    </div>
  );
};

const SubmissionModal = ({ isSubmitting, isSuccess, messages }) => {
  if (!isSubmitting && !isSuccess) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-10 text-center shadow-2xl">
        {isSuccess ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle size={48} className="text-emerald-600" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">
              {messages.submission.successTitle}
            </h2>
            <p className="mt-3 text-base text-slate-600">
              {messages.submission.providerSuccessBody}
            </p>
            <p className="mt-5 text-sm text-slate-500">{messages.submission.redirecting}</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-100">
              <Loader size={40} className="animate-spin text-sky-600" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">
              {messages.submission.submitting}
            </h2>
            <p className="mt-3 text-base text-slate-600">
              {messages.submission.providerSubmittingBody}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const InputField = ({
  label,
  field,
  value,
  placeholder,
  type = "text",
  rows,
  mandatory = false,
  handleInputChange,
  toggleVoiceInput,
  voiceButtonTitle,
  options = null,
  selectPrompt,
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">
      {label} {mandatory && <span className="text-rose-500">*</span>}
    </span>
    <div className="relative">
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => handleInputChange(field, event.target.value)}
          placeholder={placeholder}
          rows={rows || 4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(event) => handleInputChange(field, event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          <option value="">{selectPrompt}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => handleInputChange(field, event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-14 text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        />
      )}
      {type !== "select" && (
        <button
          type="button"
          onClick={() => toggleVoiceInput(field)}
          className="absolute right-3 top-3 rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-sky-100 hover:text-sky-700"
          title={voiceButtonTitle}
        >
          <Mic size={18} />
        </button>
      )}
    </div>
  </label>
);

export default function JobProviderApplication({ existingData = null, onSuccess = null }) {
  const { messages, speechLocale, languageLabel, t } = useLocale();
  const copy = messages.jobProviderForm;

  const [formData, setFormData] = useState(
    existingData
      ? {
          name: existingData.name ?? "",
          age: existingData.age ?? "",
          phoneNumber: existingData.phoneNumber ?? existingData.phone_number ?? "",
          email: existingData.email ?? "",
          companyName: existingData.companyName ?? existingData.company_name ?? "",
          companyLogo: null,
          jobTitle: existingData.jobTitle ?? existingData.job_title ?? "",
          jobCategory: existingData.jobCategory ?? existingData.job_category ?? "",
          jobDescription: existingData.jobDescription ?? existingData.job_description ?? "",
          experienceRequired:
            existingData.experienceRequired ?? existingData.experience_required ?? "",
          salaryMin: existingData.salaryMin ?? existingData.salary_min ?? "",
          salaryMax: existingData.salaryMax ?? existingData.salary_max ?? "",
          salaryType: existingData.salaryType ?? existingData.salary_type ?? "yearly",
          jobLocation: existingData.jobLocation ?? existingData.job_location ?? "",
          jobType: existingData.jobType ?? existingData.job_type ?? "full-time",
          benefits: existingData.benefits ?? "",
          applicationDeadline:
            existingData.applicationDeadline ?? existingData.application_deadline ?? "",
          requiredQualifications:
            existingData.requiredQualifications ?? existingData.required_qualifications ?? "",
        }
      : initialFormData
  );
  const [logoPreview, setLogoPreview] = useState(
    existingData && (existingData.company_logo || existingData.companyLogo)
      ? existingData.company_logo || existingData.companyLogo
      : null
  );
  const [voiceState, setVoiceState] = useState({ state: "idle", field: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const processingRef = useRef(false);
  const recognitionRef = useRef(null);

  const fieldLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(copy.fields).map(([key, value]) => [key, value.label])
      ),
    [copy.fields]
  );

  const jobCategories = useMemo(
    () =>
      Object.entries(messages.taxonomy.jobCategories).map(([value, label]) => ({ value, label })),
    [messages.taxonomy.jobCategories]
  );
  const jobTypes = useMemo(
    () => Object.entries(messages.taxonomy.jobTypes).map(([value, label]) => ({ value, label })),
    [messages.taxonomy.jobTypes]
  );
  const salaryTypes = useMemo(
    () => Object.entries(messages.taxonomy.salaryTypes).map(([value, label]) => ({ value, label })),
    [messages.taxonomy.salaryTypes]
  );

  const handleInputChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData((previous) => ({ ...previous, companyLogo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData((previous) => ({ ...previous, companyLogo: null }));
    setLogoPreview(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (voiceState.state !== "idle") {
      alert(messages.common.voiceWait);
      return;
    }

    let user;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      user = null;
    }

    const sessionEmail = user?.email?.trim() || "";

    if (!user?.id || !sessionEmail) {
      alert(messages.common.sessionMissing);
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.jobTitle.trim() ||
      !formData.jobDescription.trim()
    ) {
      alert(copy.requiredAlert);
      return;
    }

    if (!EMAIL_REGEX.test(sessionEmail)) {
      alert(copy.invalidEmailAlert);
      return;
    }

    const phoneValue = formData.phoneNumber.trim();
    if (!PHONE_REGEX.test(phoneValue)) {
      alert(copy.invalidPhoneAlert);
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    const { companyLogo, ...dataToSend } = formData;
    const payload = {
      ...dataToSend,
      email: sessionEmail,
      phoneNumber: phoneValue,
      user_id: user.id,
      posting_id: existingData?._id || null,
      company_logo: logoPreview || null,
    };

    try {
      const response = await fetch(buildApiUrl("/api/submit-job-posting"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setIsSubmitting(false);
        alert(result.error || messages.common.backendUnavailable);
        return;
      }

      setIsSuccess(true);
      setFormData({ ...initialFormData, email: sessionEmail });
      setLogoPreview(null);

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        window.location.href = "/job-provider-dashboard";
      }, 2200);
    } catch (error) {
      console.error("Network or unexpected error:", error);
      setIsSubmitting(false);
      alert(messages.common.backendUnavailable);
    }
  };

  useEffect(() => {
    try {
      const parsedUser = JSON.parse(localStorage.getItem("user"));
      if (parsedUser?.email) {
        setFormData((previous) => ({ ...previous, email: parsedUser.email.trim() }));
      }
    } catch (error) {
      console.error("User session parse error:", error);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLocale;

    recognition.onstart = () => {
      setVoiceState((previous) => ({ ...previous, state: "listening" }));
      processingRef.current = false;
    };

    recognition.onresult = (event) => {
      if (processingRef.current) {
        return;
      }

      processingRef.current = true;
      const spokenText = event.results[0][0].transcript.trim();

      setVoiceState((previous) => {
        if (!previous.field) {
          processingRef.current = false;
          return previous;
        }

        const currentField = previous.field;
        setFormData((previousForm) => {
          const currentValue = previousForm[currentField] || "";
          return {
            ...previousForm,
            [currentField]: currentValue ? `${currentValue} ${spokenText}` : spokenText,
          };
        });

        return { ...previous, state: "processing" };
      });

      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    };

    recognition.onerror = (event) => {
      alert(t("voice.error", { error: event.error }));
      setVoiceState({ state: "idle", field: null });
      processingRef.current = false;
    };

    recognition.onend = () => {
      setTimeout(() => {
        setVoiceState({ state: "idle", field: null });
        processingRef.current = false;
      }, 350);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error("Recognition cleanup:", error);
        }
      }
      recognitionRef.current = null;
      processingRef.current = false;
    };
  }, [speechLocale, t]);

  const toggleVoiceInput = (field) => {
    const isActive = voiceState.field === field && voiceState.state !== "idle";

    if (!recognitionRef.current) {
      alert(messages.common.browserVoiceUnsupported);
      return;
    }

    if (isActive) {
      recognitionRef.current.stop();
      processingRef.current = false;
      return;
    }

    if (voiceState.state !== "idle") {
      recognitionRef.current.stop();
      processingRef.current = false;
    }

    setVoiceState({ state: "starting", field });

    setTimeout(() => {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setVoiceState({ state: "idle", field: null });
        alert(messages.common.voiceStartError);
      }
    }, 180);
  };

  return (
    <>
      <Navbar />
      <VoiceFeedbackModal
        voiceState={voiceState}
        toggleVoiceInput={toggleVoiceInput}
        fieldLabels={fieldLabels}
        messages={messages}
      />
      <SubmissionModal
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        messages={messages}
      />

      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <a
            href="/job-provider-dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
            {messages.common.backToHome}
          </a>

          <section className="mt-6 rounded-[2.25rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                  {messages.brand.shortName}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                  {copy.body}
                </p>
              </div>

            </div>

            <form className="mt-10 space-y-10" onSubmit={handleSubmit}>
              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
                <h2 className="text-2xl font-semibold text-slate-950">{copy.personal}</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <InputField
                    label={copy.fields.name.label}
                    field="name"
                    value={formData.name}
                    placeholder={copy.fields.name.placeholder}
                    mandatory
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.age.label}
                    field="age"
                    value={formData.age}
                    placeholder={copy.fields.age.placeholder}
                    type="number"
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.phoneNumber.label}
                    field="phoneNumber"
                    value={formData.phoneNumber}
                    placeholder={copy.fields.phoneNumber.placeholder}
                    type="tel"
                    mandatory
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      {copy.fields.email.label} <span className="text-rose-500">*</span>
                    </span>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                    />
                  </label>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.9fr]">
                  <InputField
                    label={copy.fields.companyName.label}
                    field="companyName"
                    value={formData.companyName}
                    placeholder={copy.fields.companyName.placeholder}
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <div>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      {copy.uploadLabel} <span className="text-slate-500">({messages.common.optional})</span>
                    </span>
                    {logoPreview ? (
                      <div className="relative inline-flex rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
                        <img
                          src={logoPreview}
                          alt={copy.uploadLabel}
                          className="h-28 w-28 rounded-[1.25rem] object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1.5 text-white shadow-lg transition hover:bg-rose-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex min-h-32 cursor-pointer items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-8 text-center transition hover:border-sky-300 hover:bg-sky-50">
                        <div>
                          <Upload size={30} className="mx-auto text-slate-400" />
                          <p className="mt-3 text-sm font-medium text-slate-600">
                            {messages.common.clickToUpload}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-6">
                <h2 className="text-2xl font-semibold text-indigo-700">{copy.details}</h2>
                <div className="mt-6 space-y-6">
                  <InputField
                    label={copy.fields.jobTitle.label}
                    field="jobTitle"
                    value={formData.jobTitle}
                    placeholder={copy.fields.jobTitle.placeholder}
                    mandatory
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.jobCategory.label}
                    field="jobCategory"
                    value={formData.jobCategory}
                    type="select"
                    options={jobCategories}
                    mandatory
                    handleInputChange={handleInputChange}
                    selectPrompt={messages.common.selectField({ field: copy.fields.jobCategory.label })}
                  />
                  <InputField
                    label={copy.fields.jobDescription.label}
                    field="jobDescription"
                    value={formData.jobDescription}
                    placeholder={copy.fields.jobDescription.placeholder}
                    type="textarea"
                    rows={6}
                    mandatory
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.requiredQualifications.label}
                    field="requiredQualifications"
                    value={formData.requiredQualifications}
                    placeholder={copy.fields.requiredQualifications.placeholder}
                    type="textarea"
                    rows={4}
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.experienceRequired.label}
                    field="experienceRequired"
                    value={formData.experienceRequired}
                    placeholder={copy.fields.experienceRequired.placeholder}
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <div className="grid gap-6 md:grid-cols-3">
                    <InputField
                      label={copy.fields.salaryMin.label}
                      field="salaryMin"
                      value={formData.salaryMin}
                      placeholder={copy.fields.salaryMin.placeholder}
                      type="number"
                      handleInputChange={handleInputChange}
                      toggleVoiceInput={toggleVoiceInput}
                      voiceButtonTitle={messages.voice.speak}
                    />
                    <InputField
                      label={copy.fields.salaryMax.label}
                      field="salaryMax"
                      value={formData.salaryMax}
                      placeholder={copy.fields.salaryMax.placeholder}
                      type="number"
                      handleInputChange={handleInputChange}
                      toggleVoiceInput={toggleVoiceInput}
                      voiceButtonTitle={messages.voice.speak}
                    />
                    <InputField
                      label={copy.fields.salaryType.label}
                      field="salaryType"
                      value={formData.salaryType}
                      type="select"
                      options={salaryTypes}
                      handleInputChange={handleInputChange}
                      selectPrompt={messages.common.selectField({ field: copy.fields.salaryType.label })}
                    />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <InputField
                      label={copy.fields.jobLocation.label}
                      field="jobLocation"
                      value={formData.jobLocation}
                      placeholder={copy.fields.jobLocation.placeholder}
                      handleInputChange={handleInputChange}
                      toggleVoiceInput={toggleVoiceInput}
                      voiceButtonTitle={messages.voice.speak}
                    />
                    <InputField
                      label={copy.fields.jobType.label}
                      field="jobType"
                      value={formData.jobType}
                      type="select"
                      options={jobTypes}
                      handleInputChange={handleInputChange}
                      selectPrompt={messages.common.selectField({ field: copy.fields.jobType.label })}
                    />
                  </div>
                  <InputField
                    label={copy.fields.benefits.label}
                    field="benefits"
                    value={formData.benefits}
                    placeholder={copy.fields.benefits.placeholder}
                    type="textarea"
                    rows={4}
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                  <InputField
                    label={copy.fields.applicationDeadline.label}
                    field="applicationDeadline"
                    value={formData.applicationDeadline}
                    type="date"
                    handleInputChange={handleInputChange}
                    toggleVoiceInput={toggleVoiceInput}
                    voiceButtonTitle={messages.voice.speak}
                  />
                </div>
              </section>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={voiceState.state !== "idle" || isSubmitting}
                  className="rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? messages.submission.submitting
                    : existingData
                    ? copy.update
                    : copy.submit}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
