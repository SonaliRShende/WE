const en = {
  brand: {
    shortName: "Shaurya",
    name: "Shaurya JobSphere",
    tagline: "Connecting Talent. Building Futures.",
    footerSummary: "A platform empowering women to build careers, lead with confidence, and rise without limits."
  },
  nav: {
    home: "Home",
    features: "Features",
    about: "About",
    contact: "Contact",
    dashboard: "Dashboard",
    login: "Login",
    register: "Register",
    getStarted: "Create account",
    logout: "Log out",
    language: "Language",
    signedInAs: "Signed in as",
    menu: "Menu"
  },
  common: {
    loading: "Loading...",
    optional: "Optional",
    notProvided: "Not provided",
    clickToUpload: "Click to upload",
    backToHome: "Back to Home",
    backToOptions: "Back to Options",
    backToRecommendations: "Back to Recommendations",
    backToJobSeekers: "Back to Job Seekers",
    previous: "Previous",
    next: "Next",
    showingRange: ({ start, end, total }) => `Showing ${start} - ${end} of ${total}`,
    selectField: ({ field }) => `Select ${field}`,
    browserVoiceUnsupported: "Voice recognition is not supported by your browser or needs a secure connection. Please use Chrome or Edge.",
    backendUnavailable: "Could not connect to the backend server. Please make sure the backend is running.",
    sessionMissing: "User session not found. Please log in again.",
    voiceStartError: "We could not start the microphone. It may already be in use. Please try again.",
    voiceWait: "Please wait for voice input to finish processing or stop the current recording first.",
    fieldPrefix: "Field"
  },
  footer: {
    quickLinks: "Quick links",
    accessTitle: "Languages",
    accessBody: "A platform empowering women to build careers, lead with confidence, and rise without limits.",
    copyright: ({ year }) => `© ${year} Shaurya JobSphere. All rights reserved.`
  },
  landing: {
    badge: "Professional job search and hiring",
    titleLine1: "Find the right opportunity.",
    titleLine2: "Connect with the right talent.",
    titleLine3: "Move hiring forward.",
    description: "Shaurya JobSphere is your all-in-one platform for discovering talent, exploring opportunities, and building successful careers.",
    primaryCta: "Find jobs",
    secondaryCta: "Post a job",
    roleCards: {
      seekerTitle: "For Candidates",
      seekerBody: "Create a complete profile, review relevant openings, and keep your job search organized.",
      seekerAction: "Continue as candidate",
      providerTitle: "For Employers",
      providerBody: "Publish clear job postings, review relevant candidates, and manage hiring in one place.",
      providerAction: "Continue as employer"
    },

    stats: [],
    aboutTitle: "Built for meaningful careers and confident hiring",
    aboutBody: "The platform brings talent, opportunities, and hiring decisions into one clear space so candidates and employers can move forward with confidence.",
    contactTitle: "Step into your workspace",
    contactBody: "Continue as a candidate or employer and explore the experience designed for your journey."  },
  home: {
    eyebrow: "Workspace",
    title: "Choose your job search or hiring workspace",
    description: "Select the experience that matches your role and continue in a clear, professional workflow.",
    seekerTitle: "For candidates",
    seekerBody: "Create your profile, review recommended roles, and keep your job search organized.",
    seekerAction: "Open candidate dashboard",
    providerTitle: "For employers",
    providerBody: "Post jobs, review recommended candidates, and manage hiring from one dashboard.",
    providerAction: "Open employer dashboard",
    footerNote: "Professional profiles, clear job postings, and structured hiring workflows."
  },
  auth: {
    loginTitle: "Welcome back",
    loginBody: "Sign in to access your Shaurya JobSphere workspace.",
    registerTitle: "Create your account",
    registerBody: "Create an account to build your profile or post jobs.",
    name: "Full name",
    email: "Email address",
    password: "Password",
    loginAction: "Log in",
    loginLoading: "Logging in...",
    registerAction: "Create account",
    registerLoading: "Creating account...",
    alreadyMember: "Already have an account?",
    signIn: "Sign in",
    needAccount: "Need an account?",
    signUp: "Sign up",
    formNote: "Your selected website language will stay active after sign-in."
  },
  voice: {
    starting: "Activating microphone...",
    listening: "Listening. Please speak now.",
    processing: "Transcribing voice input...",
    cancel: "Cancel",
    stop: "Stop recording",
    wait: "Please wait",
    autoStop: "Recording stops automatically after a short pause.",
    speak: "Click to speak",
    error: ({ error }) => `Voice input error: ${error}. Please try Chrome or Edge.`
  },
  submission: {
    successTitle: "Success",
    seekerSuccessBody: "Your profile has been submitted successfully.",
    providerSuccessBody: "Your job posting has been submitted successfully.",
    redirecting: "Redirecting to your dashboard...",
    submitting: "Submitting...",
    seekerSubmittingBody: "Please wait while we process your profile.",
    providerSubmittingBody: "Please wait while we process your job posting."
  },
  jobSeekerForm: {
    title: "Create your job seeker profile",
    body: "Add your background, skills, and work preferences to receive relevant job recommendations.",
    personal: "Personal information",
    experience: "Education and work experience",
    preferences: "Preferences and constraints",
    submit: "Submit profile",
    update: "Update profile",
    requiredAlert: "Please fill all mandatory fields: name, email, and location.",
    uploadLabel: "Profile picture",
    fields: {
      name: {
        label: "Full name",
        placeholder: "Enter your full name"
      },
      email: {
        label: "Email address",
        placeholder: "your.email@example.com"
      },
      contact: {
        label: "Contact number",
        placeholder: "+91 98765 43210"
      },
      location: {
        label: "Location / city",
        placeholder: "Enter your city"
      },
      qualification: {
        label: "Highest qualification",
        placeholder: "For example: B.E. IT, diploma, MBA"
      },
      skills: {
        label: "Skills",
        placeholder: "List your technical, communication, and  skills in detail."
      },
      previousJob: {
        label: "Previous job / internship",
        placeholder: "Share your most relevant role or internship"
      },
      roles: {
        label: "Roles / responsibilities",
        placeholder: "Describe the tasks you handled in your previous work"
      },
      skillsApplied: {
        label: "Skills applied",
        placeholder: "Which skills did you use in your earlier work?"
      },
      certifications: {
        label: "Certifications / achievements",
        placeholder: "Add any certificates, awards, or achievements"
      },
      portfolio: {
        label: "Portfolio / resume link",
        placeholder: "Paste a portfolio, LinkedIn, or resume link"
      },
      preferences: {
        label: "Your preferences",
        placeholder: "Tell us about availability, work preferences, schedule constraints, or special requirements."
      }
    }
  },
  jobProviderForm: {
    title: "Create your job posting",
    body: "Create a clear job posting so the platform can surface relevant candidates.",
    personal: "Employer information",
    details: "Job details",
    submit: "Post job opening",
    update: "Update job posting",
    requiredAlert: "Please fill all mandatory fields: name, email, phone number, job title, and job description.",
    uploadLabel: "Company logo",
    fields: {
      name: {
        label: "Full name",
        placeholder: "Enter your full name"
      },
      age: {
        label: "Age",
        placeholder: "Enter your age"
      },
      phoneNumber: {
        label: "Phone number",
        placeholder: "+91 98765 43210"
      },
      email: {
        label: "Email address",
        placeholder: "your.email@example.com"
      },
      companyName: {
        label: "Company name",
        placeholder: "Enter your company name"
      },
      jobTitle: {
        label: "Job title",
        placeholder: "For example: Operations Associate, Marketing Manager"
      },
      jobCategory: {
        label: "Job category"
      },
      jobDescription: {
        label: "Job description",
        placeholder: "Describe responsibilities, expectations, and the role scope."
      },
      experienceRequired: {
        label: "Experience required",
        placeholder: "For example: 2-4 years in customer support"
      },
      salaryMin: {
        label: "Minimum salary",
        placeholder: "Enter amount"
      },
      salaryMax: {
        label: "Maximum salary",
        placeholder: "Enter amount"
      },
      salaryType: {
        label: "Salary type"
      },
      jobLocation: {
        label: "Job location",
        placeholder: "For example: Pune, Remote, Bengaluru"
      },
      jobType: {
        label: "Job type"
      },
      benefits: {
        label: "Benefits and perks",
        placeholder: "Mention flexibility, insurance, leave, travel support, and more."
      },
      applicationDeadline: {
        label: "Application deadline"
      },
      requiredQualifications: {
        label: "Required qualifications",
        placeholder: "List education, certifications, or must-have qualifications"
      }
    }
  },
  taxonomy: {
    jobCategories: {
      technology: "Technology",
      healthcare: "Healthcare",
      education: "Education",
      finance: "Finance",
      sales: "Sales and marketing",
      operations: "Operations",
      hospitality: "Hospitality",
      retail: "Retail",
      manufacturing: "Manufacturing",
      other: "Other"
    },
    jobTypes: {
      "full-time": "Full-time",
      "part-time": "Part-time",
      contract: "Contract",
      temporary: "Temporary",
      freelance: "Freelance"
    },
    salaryTypes: {
      yearly: "Yearly",
      monthly: "Monthly",
      hourly: "Hourly"
    }
  },
  jobSeekerDashboard: {
    title: "Candidate dashboard",
    body: "Manage your profile, review recommended jobs, and keep your information up to date.",
    hubTitle: "Candidate dashboard",
    welcomeNew: "Choose what you would like to do next.",
    welcomeBack: "Welcome back. Choose your next step.",
    fillTitle: "Create your profile",
    updateTitle: "Update your profile",
    fillBody: "Add your skills, experience, and preferences to improve job recommendations.",
    updateBody: "Review and improve your saved profile details.",
    viewTitle: "View your profile",
    viewBody: "See the details currently saved in your job seeker profile.",
    matchesTitle: "Recommended jobs",
    matchesBody: "Review jobs recommended for your profile.",
    noProfile: "You have not filled out your profile yet. Please create it first.",
    recommendationTitle: "Recommended jobs",
    recommendationCount: ({ count }) => `${count} role(s) found for your profile`,
    noMatchesTitle: "No recommended jobs yet.",
    noMatchesBody: "Add more complete profile details to improve your recommendations.",
    overallMatch: "Overall match",
    skillsMatch: "Skills match",
    constraintsMatch: "Preference match",
    explanation: "Match insights",
    loadingRecommendations: "Loading recommendations...",
    couldNotLoadRecommendations: "Could not load recommendations. Please try again."
  },
  jobProviderDashboard: {
    title: "Employer dashboard",
    body: "Manage your job posting, review recommended candidates, and keep hiring organized.",
    hubTitle: "Employer dashboard",
    welcomeNew: "Choose what you would like to do next.",
    welcomeBack: "Welcome back. Choose your next step.",
    createTitle: "Create a job posting",
    updateTitle: "Update your job posting",
    createBody: "Publish a role and reach candidates whose profiles match your requirements.",
    updateBody: "Refine your current listing to attract stronger matches.",
    viewTitle: "View your job posting",
    viewBody: "Review the details currently visible for your active role.",
    applicationsTitle: "Recommended candidates",
    applicationsBody: "Review candidates recommended for your active job posting.",
    noPosting: "You have not posted a job yet. Please create one first.",
    candidatesTitle: "Recommended candidates",
    candidatesCount: ({ count }) => `Found ${count} candidate(s) matching your requirements`,
    noCandidates: "No matching candidates found yet.",
    loadingCandidates: "Loading matching candidates...",
    couldNotLoadCandidates: "Could not load matching candidates. Please try again.",
    clickProfile: "Open candidate profile"
  },
  viewPages: {
    seekerTitle: "Job seeker profile",
    seekerBody: "Review the full candidate profile before moving forward.",
    jobTitle: "Job posting details",
    jobBody: "Review the full details of this opportunity.",
    matchScore: ({ score }) => `Match score: ${score}%`,
    profileNotFound: "Profile not found",
    jobNotFound: "Job not found",
    loadingProfile: "Loading profile...",
    loadingJob: "Loading job details...",
    couldNotLoadProfile: "Could not load this candidate profile.",
    couldNotLoadJob: "Could not load this job posting.",
    retryProfile: "Failed to load the profile. Please try again.",
    retryJob: "Failed to load job details. Please try again.",
    companyInformation: "Company information",
    personalInformation: "Personal information",
    educationExperience: "Education and experience",
    preferenceSection: "Preferences and constraints",
    jobDetailsSection: "Job details",
    salaryRange: "Salary range",
    contactEmail: "Contact email",
    contactPhone: "Contact phone",
    contactName: "Contact name"
  }
};

export default en;
