const hi = {
  brand: {
    shortName: "Shaurya",
    name: "Shaurya JobSphere",
    tagline: "प्रतिभा को जोड़ना। भविष्य बनाना।",
    footerSummary: "महिलाओं को करियर बनाने, आत्मविश्वास के साथ नेतृत्व करने और बिना सीमाओं के आगे बढ़ने के लिए सशक्त बनाने वाला मंच।"
  },
  nav: {
    home: "मुखपृष्ठ",
    features: "विशेषताएँ",
    about: "हमारे बारे में",
    contact: "संपर्क",
    dashboard: "डैशबोर्ड",
    login: "लॉग इन",
    register: "पंजीकरण",
    getStarted: "खाता बनाएं",
    logout: "लॉग आउट",
    language: "भाषा",
    signedInAs: "इस रूप में लॉग इन",
    menu: "मेन्यू",
    notifications: "सूचनाएँ",
    markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
    noNotifications: "अभी तक कोई सूचना नहीं है।"
  },
  common: {
    loading: "लोड हो रहा है...",
    optional: "वैकल्पिक",
    notProvided: "प्रदान नहीं किया गया",
    clickToUpload: "अपलोड करने के लिए क्लिक करें",
    backToHome: "मुखपृष्ठ पर वापस जाएँ",
    backToOptions: "विकल्पों पर वापस जाएँ",
    backToRecommendations: "अनुशंसाओं पर वापस जाएँ",
    backToJobSeekers: "नौकरी खोजने वालों पर वापस जाएँ",
    previous: "पिछला",
    next: "अगला",
    showingRange: ({ start, end, total }) => `${total} में से ${start} - ${end} दिखा रहा है`,
    selectField: ({ field }) => `${field} चुनें`,
    browserVoiceUnsupported: "आपका ब्राउज़र वॉइस रिकग्निशन का समर्थन नहीं करता या सुरक्षित कनेक्शन की आवश्यकता है। कृपया Chrome या Edge का उपयोग करें।",
    backendUnavailable: "बैकएंड सर्वर से कनेक्ट नहीं हो सका। कृपया सुनिश्चित करें कि बैकएंड चल रहा है।",
    sessionMissing: "यूज़र सेशन नहीं मिला। कृपया फिर से लॉग इन करें।",
    voiceStartError: "माइक्रोफ़ोन शुरू नहीं हो सका। हो सकता है यह पहले से उपयोग में हो। कृपया फिर से प्रयास करें।",
    voiceWait: "कृपया वॉइस इनपुट की प्रक्रिया पूरी होने तक प्रतीक्षा करें या पहले वर्तमान रिकॉर्डिंग रोकें।",
    fieldPrefix: "फ़ील्ड",
    statusLabels: {
      applied: "आवेदन किया",
      selected: "चयनित"
    }
  },
  footer: {
    quickLinks: "त्वरित लिंक",
    accessTitle: "भाषाएँ",
    accessBody: "Shaurya JobSphere को अंग्रेज़ी, हिंदी या मराठी में हर उम्मीदवार और नियोक्ता वर्कफ़्लो में उपयोग करें।",
    copyright: ({ year }) => `© ${year} Shaurya JobSphere. सर्वाधिकार सुरक्षित।`
  },
  landing: {
    badge: "पेशेवर नौकरी खोज और भर्ती",
    titleLine1: "सही अवसर खोजें।",
    titleLine2: "सही प्रतिभा से जुड़ें।",
    titleLine3: "भर्ती को आगे बढ़ाएँ।",
    description: "Shaurya JobSphere प्रतिभा खोजने, अवसरों को तलाशने और सफल करियर बनाने के लिए आपका ऑल-इन-वन प्लेटफ़ॉर्म है।",
    primaryCta: "नौकरियाँ खोजें",
    secondaryCta: "नौकरी पोस्ट करें",
    roleCards: {
      seekerTitle: "उम्मीदवारों के लिए",
      seekerBody: "एक पूरा प्रोफ़ाइल बनाएं, प्रासंगिक नौकरियाँ देखें और अपनी नौकरी खोज को व्यवस्थित रखें।",
      seekerAction: "उम्मीदवार के रूप में आगे बढ़ें",
      providerTitle: "नियोक्ताओं के लिए",
      providerBody: "स्पष्ट नौकरी पोस्ट प्रकाशित करें, प्रासंगिक उम्मीदवारों की समीक्षा करें और भर्ती को एक ही जगह पर प्रबंधित करें।",
      providerAction: "नियोक्ता के रूप में आगे बढ़ें"
    },

    stats: [],
    aboutTitle: "सार्थक करियर और आत्मविश्वासी भर्ती के लिए बनाया गया",
    aboutBody: "यह प्लेटफ़ॉर्म प्रतिभा, अवसरों और भर्ती निर्णयों को एक स्पष्ट स्थान पर लाता है ताकि उम्मीदवार और नियोक्ता आत्मविश्वास के साथ आगे बढ़ सकें।",
    contactTitle: "अपने कार्यक्षेत्र में प्रवेश करें",
    contactBody: "उम्मीदवार या नियोक्ता के रूप में आगे बढ़ें और अपनी यात्रा के लिए डिज़ाइन किया गया अनुभव देखें।"
  },
  home: {
    eyebrow: "कार्यस्थल",
    title: "अपना नौकरी खोज या भर्ती कार्यक्षेत्र चुनें",
    description: "अपनी भूमिका से मेल खाने वाला अनुभव चुनें और एक स्पष्ट, पेशेवर प्रक्रिया में आगे बढ़ें।",
    seekerTitle: "उम्मीदवारों के लिए",
    seekerBody: "अपना प्रोफ़ाइल बनाएं, अनुशंसित भूमिकाएँ देखें और अपनी नौकरी खोज को व्यवस्थित रखें।",
    seekerAction: "उम्मीदवार डैशबोर्ड खोलें",
    providerTitle: "नियोक्ताओं के लिए",
    providerBody: "नौकरियाँ पोस्ट करें, अनुशंसित उम्मीदवारों की समीक्षा करें और एक ही डैशबोर्ड से भर्ती प्रबंधित करें।",
    providerAction: "नियोक्ता डैशबोर्ड खोलें",
    footerNote: "पेशेवर प्रोफ़ाइल, स्पष्ट नौकरी पोस्टिंग और संरचित भर्ती वर्कफ़्लो।"
  },
  auth: {
    loginTitle: "वापसी पर स्वागत है",
    loginBody: "अपने Shaurya JobSphere कार्यक्षेत्र तक पहुँचने के लिए साइन इन करें।",
    registerTitle: "अपना खाता बनाएं",
    registerBody: "अपना प्रोफ़ाइल बनाने या नौकरियाँ पोस्ट करने के लिए खाता बनाएं।",
    name: "पूरा नाम",
    email: "ईमेल पता",
    password: "पासवर्ड",
    loginAction: "लॉग इन",
    loginLoading: "लॉग इन हो रहा है...",
    registerAction: "खाता बनाएं",
    registerLoading: "खाता बनाया जा रहा है...",
    alreadyMember: "क्या आपका पहले से खाता है?",
    signIn: "साइन इन",
    needAccount: "क्या खाता चाहिए?",
    signUp: "साइन अप",
  },
  voice: {
    starting: "माइक्रोफ़ोन सक्रिय किया जा रहा है...",
    listening: "सुन रहा है। कृपया अब बोलें।",
    processing: "वॉइस इनपुट को टेक्स्ट में बदला जा रहा है...",
    cancel: "रद्द करें",
    stop: "रिकॉर्डिंग रोकें",
    wait: "कृपया प्रतीक्षा करें",
    autoStop: "थोड़े विराम के बाद रिकॉर्डिंग अपने आप रुक जाएगी।",
    speak: "बोलने के लिए क्लिक करें",
    error: ({ error }) => `वॉइस इनपुट त्रुटि: ${error}. कृपया Chrome या Edge का उपयोग करें।`
  },
  submission: {
    successTitle: "सफलता",
    seekerSuccessBody: "आपका प्रोफ़ाइल सफलतापूर्वक सबमिट हो गया है।",
    providerSuccessBody: "आपकी नौकरी पोस्ट सफलतापूर्वक सबमिट हो गई है।",
    redirecting: "आपके डैशबोर्ड पर ले जाया जा रहा है...",
    submitting: "सबमिट किया जा रहा है...",
    seekerSubmittingBody: "कृपया प्रतीक्षा करें, हम आपके प्रोफ़ाइल को प्रोसेस कर रहे हैं।",
    providerSubmittingBody: "कृपया प्रतीक्षा करें, हम आपकी नौकरी पोस्ट को प्रोसेस कर रहे हैं।"
  },
  jobSeekerForm: {
    title: "अपना जॉब सीकर प्रोफ़ाइल बनाएं",
    body: "प्रासंगिक नौकरी अनुशंसाएँ पाने के लिए अपनी पृष्ठभूमि, कौशल और कार्य प्राथमिकताएँ जोड़ें।",
    personal: "व्यक्तिगत जानकारी",
    experience: "शिक्षा और कार्य अनुभव",
    preferences: "प्राथमिकताएँ और बाधाएँ",
    submit: "प्रोफ़ाइल सबमिट करें",
    update: "प्रोफ़ाइल अपडेट करें",
    requiredAlert: "कृपया सभी आवश्यक फ़ील्ड भरें: नाम, लॉगिन ईमेल और स्थान।",
    invalidEmailAlert: "आपका लॉगिन ईमेल मान्य नहीं है। कृपया फिर से लॉग इन करें।",
    invalidContactAlert: "कृपया मान्य संपर्क नंबर दर्ज करें (ठीक 10 अंक)।",
    uploadLabel: "प्रोफ़ाइल फ़ोटो",
    fields: {
      name: {
        label: "पूरा नाम",
        placeholder: "अपना पूरा नाम दर्ज करें"
      },
      email: {
        label: "ईमेल पता",
        placeholder: "your.email@example.com"
      },
      contact: {
        label: "संपर्क नंबर",
        placeholder: "+91 98765 43210"
      },
      location: {
        label: "स्थान / शहर",
        placeholder: "अपना शहर दर्ज करें"
      },
      qualification: {
        label: "उच्चतम योग्यता",
        placeholder: "उदाहरण: B.E. IT, डिप्लोमा, MBA"
      },
      skills: {
        label: "कौशल",
        placeholder: "अपने तकनीकी, संचार और अन्य कौशल विस्तार से लिखें।"
      },
      previousJob: {
        label: "पिछली नौकरी / इंटर्नशिप",
        placeholder: "अपनी सबसे प्रासंगिक भूमिका या इंटर्नशिप साझा करें"
      },
      roles: {
        label: "भूमिकाएँ / जिम्मेदारियाँ",
        placeholder: "अपने पिछले कार्य में संभाले गए कार्यों का वर्णन करें"
      },
      skillsApplied: {
        label: "प्रयोग किए गए कौशल",
        placeholder: "आपने अपने पहले के कार्य में कौन से कौशल उपयोग किए?"
      },
      certifications: {
        label: "प्रमाणपत्र / उपलब्धियाँ",
        placeholder: "कोई प्रमाणपत्र, पुरस्कार या उपलब्धियाँ जोड़ें"
      },
      portfolio: {
        label: "पोर्टफोलियो / रिज़्यूमे लिंक",
        placeholder: "पोर्टफोलियो, LinkedIn या रिज़्यूमे लिंक पेस्ट करें"
      },
      preferences: {
        label: "आपकी प्राथमिकताएँ",
        placeholder: "उपलब्धता, कार्य प्राथमिकताओं, समय की बाधाओं या विशेष आवश्यकताओं के बारे में बताएं।"
      }
    }
  },
  jobProviderForm: {
    title: "अपनी नौकरी पोस्ट बनाएं",
    body: "एक स्पष्ट नौकरी पोस्ट बनाएं ताकि प्लेटफ़ॉर्म प्रासंगिक उम्मीदवार दिखा सके।",
    personal: "नियोक्ता जानकारी",
    details: "नौकरी विवरण",
    submit: "नौकरी अवसर पोस्ट करें",
    update: "नौकरी पोस्ट अपडेट करें",
    requiredAlert: "कृपया सभी आवश्यक फ़ील्ड भरें: नाम, लॉगिन ईमेल, फोन नंबर, नौकरी का शीर्षक और नौकरी का विवरण।",
    invalidEmailAlert: "आपका लॉगिन ईमेल मान्य नहीं है। कृपया फिर से लॉग इन करें।",
    invalidPhoneAlert: "कृपया मान्य फोन नंबर दर्ज करें (ठीक 10 अंक)।",
    uploadLabel: "कंपनी लोगो",
    fields: {
      name: {
        label: "पूरा नाम",
        placeholder: "अपना पूरा नाम दर्ज करें"
      },
      age: {
        label: "आयु",
        placeholder: "अपनी आयु दर्ज करें"
      },
      phoneNumber: {
        label: "फोन नंबर",
        placeholder: "+91 98765 43210"
      },
      email: {
        label: "ईमेल पता",
        placeholder: "your.email@example.com"
      },
      companyName: {
        label: "कंपनी का नाम",
        placeholder: "अपनी कंपनी का नाम दर्ज करें"
      },
      jobTitle: {
        label: "नौकरी का शीर्षक",
        placeholder: "उदाहरण: Operations Associate, Marketing Manager"
      },
      jobCategory: {
        label: "नौकरी श्रेणी"
      },
      jobDescription: {
        label: "नौकरी का विवरण",
        placeholder: "जिम्मेदारियाँ, अपेक्षाएँ और भूमिका की सीमा का वर्णन करें।"
      },
      experienceRequired: {
        label: "आवश्यक अनुभव",
        placeholder: "उदाहरण: ग्राहक सहायता में 2-4 वर्ष"
      },
      salaryMin: {
        label: "न्यूनतम वेतन",
        placeholder: "राशि दर्ज करें"
      },
      salaryMax: {
        label: "अधिकतम वेतन",
        placeholder: "राशि दर्ज करें"
      },
      salaryType: {
        label: "वेतन प्रकार"
      },
      jobLocation: {
        label: "नौकरी का स्थान",
        placeholder: "उदाहरण: पुणे, Remote, बेंगलुरु"
      },
      jobType: {
        label: "नौकरी का प्रकार"
      },
      benefits: {
        label: "लाभ और सुविधाएँ",
        placeholder: "लचीलापन, बीमा, अवकाश, यात्रा सहायता और अन्य सुविधाएँ लिखें।"
      },
      applicationDeadline: {
        label: "आवेदन की अंतिम तिथि"
      },
      requiredQualifications: {
        label: "आवश्यक योग्यताएँ",
        placeholder: "शिक्षा, प्रमाणपत्र या अनिवार्य योग्यताएँ लिखें"
      }
    }
  },
  taxonomy: {
    jobCategories: {
      technology: "प्रौद्योगिकी",
      healthcare: "स्वास्थ्य सेवा",
      education: "शिक्षा",
      finance: "वित्त",
      sales: "बिक्री और विपणन",
      operations: "संचालन",
      hospitality: "आतिथ्य",
      retail: "खुदरा",
      manufacturing: "विनिर्माण",
      other: "अन्य"
    },
    jobTypes: {
      "full-time": "पूर्णकालिक",
      "part-time": "अंशकालिक",
      contract: "अनुबंध आधारित",
      temporary: "अस्थायी",
      freelance: "फ्रीलांस"
    },
    salaryTypes: {
      yearly: "वार्षिक",
      monthly: "मासिक",
      hourly: "प्रति घंटा"
    }
  },
  jobSeekerDashboard: {
    title: "उम्मीदवार डैशबोर्ड",
    body: "अपना प्रोफ़ाइल प्रबंधित करें, अनुशंसित नौकरियाँ देखें और अपनी जानकारी अपडेट रखें।",
    hubTitle: "उम्मीदवार डैशबोर्ड",
    welcomeNew: "चुनें कि आप आगे क्या करना चाहते हैं।",
    welcomeBack: "वापसी पर स्वागत है। अपना अगला कदम चुनें।",
    fillTitle: "अपना प्रोफ़ाइल बनाएं",
    updateTitle: "अपना प्रोफ़ाइल अपडेट करें",
    fillBody: "नौकरी अनुशंसाओं को बेहतर बनाने के लिए अपने कौशल, अनुभव और प्राथमिकताएँ जोड़ें।",
    updateBody: "सहेजे गए प्रोफ़ाइल विवरण की समीक्षा करें और सुधार करें।",
    viewTitle: "अपना प्रोफ़ाइल देखें",
    viewBody: "अपने जॉब सीकर प्रोफ़ाइल में वर्तमान में सहेजी गई जानकारी देखें।",
    matchesTitle: "अनुशंसित नौकरियाँ",
    matchesBody: "अपने प्रोफ़ाइल के लिए अनुशंसित नौकरियाँ देखें।",
    noProfile: "आपने अभी तक अपना प्रोफ़ाइल नहीं भरा है। कृपया पहले इसे बनाएं।",
    recommendationTitle: "अनुशंसित नौकरियाँ",
    recommendationCount: ({ count }) => `आपके प्रोफ़ाइल के लिए ${count} भूमिका मिली`,
    noMatchesTitle: "अभी तक कोई अनुशंसित नौकरी नहीं है।",
    noMatchesBody: "अनुशंसाओं को बेहतर बनाने के लिए अधिक पूर्ण प्रोफ़ाइल विवरण जोड़ें।",
    updatingRecommendationsTitle: "आपकी अनुशंसाएँ फिर से तैयार की जा रही हैं।",
    updatingRecommendationsBody: "आपकी अपडेट की गई प्रोफ़ाइल के लिए नए मैच बनाए जा रहे हैं। कृपया थोड़ी देर बाद फिर देखें।",
    overallMatch: "कुल मिलान",
    skillsMatch: "कौशल मिलान",
    constraintsMatch: "प्राथमिकता मिलान",
    explanation: "मिलान संबंधी जानकारी",
    loadingRecommendations: "अनुशंसाएँ लोड हो रही हैं...",
    couldNotLoadRecommendations: "अनुशंसाएँ लोड नहीं हो सकीं। कृपया फिर से प्रयास करें।",
    recommendationsPreparingFailed: "हम अभी अनुशंसाएँ रीफ़्रेश नहीं कर सके। कृपया थोड़ी देर बाद फिर प्रयास करें।",
    missingPostingId: "इस अनुशंसा पर आवेदन नहीं किया जा सकता क्योंकि इसमें posting id नहीं है।",
    applyAction: "आवेदन करें",
    applyingAction: "आवेदन किया जा रहा है...",
    appliedAction: "आवेदन किया",
    selectedAction: "चयनित",
    applySuccess: "आवेदन सफलतापूर्वक भेज दिया गया।",
    applyFailure: "आपका आवेदन जमा नहीं हो सका।"
  },
  jobProviderDashboard: {
    title: "नियोक्ता डैशबोर्ड",
    body: "अपनी नौकरी पोस्ट प्रबंधित करें, अनुशंसित उम्मीदवारों की समीक्षा करें और भर्ती को व्यवस्थित रखें।",
    hubTitle: "नियोक्ता डैशबोर्ड",
    welcomeNew: "चुनें कि आप आगे क्या करना चाहते हैं।",
    welcomeBack: "वापसी पर स्वागत है। अपना अगला कदम चुनें।",
    createTitle: "नौकरी पोस्ट बनाएं",
    updateTitle: "नौकरी पोस्ट अपडेट करें",
    createBody: "एक भूमिका प्रकाशित करें और उन उम्मीदवारों तक पहुँचें जिनकी प्रोफ़ाइल आपकी आवश्यकताओं से मेल खाती है।",
    updateBody: "बेहतर मिलान आकर्षित करने के लिए अपनी वर्तमान सूची को परिष्कृत करें।",
    viewTitle: "अपनी नौकरी पोस्ट देखें",
    viewBody: "अपनी सक्रिय भूमिका के वर्तमान दृश्य विवरण देखें।",
    applicationsTitle: "अनुशंसित उम्मीदवार",
    applicationsBody: "अपनी सक्रिय नौकरी पोस्ट के लिए अनुशंसित उम्मीदवारों की समीक्षा करें।",
    noPosting: "आपने अभी तक कोई नौकरी पोस्ट नहीं की है। कृपया पहले एक बनाएं।",
    candidatesTitle: "अनुशंसित उम्मीदवार",
    candidatesCount: ({ count }) => `आपकी आवश्यकताओं से मेल खाने वाले ${count} उम्मीदवार मिले`,
    noCandidates: "अभी तक कोई उपयुक्त उम्मीदवार नहीं मिला।",
    loadingCandidates: "मिलान वाले उम्मीदवार लोड हो रहे हैं...",
    couldNotLoadCandidates: "मिलान वाले उम्मीदवार लोड नहीं हो सके। कृपया फिर से प्रयास करें।",
    clickProfile: "उम्मीदवार प्रोफ़ाइल खोलें",
    appliedCandidatesTitle: "आवेदन करने वाले उम्मीदवार",
    appliedCandidatesCount: ({ count }) => `इस भूमिका के लिए ${count} उम्मीदवारों ने आवेदन किया है और उनकी रैंकिंग की गई है।`,
    statusLabel: "स्थिति",
    selectCandidate: "उम्मीदवार चुनें",
    selectingCandidate: "चयन किया जा रहा है...",
    selectCandidateSuccess: "उम्मीदवार सफलतापूर्वक चुना गया।",
    selectCandidateFailure: "उम्मीदवार का चयन नहीं हो सका।",
    missingCandidateIdentifiers: "उम्मीदवार या posting id नहीं मिली।"
  },
  viewPages: {
    seekerTitle: "जॉब सीकर प्रोफ़ाइल",
    seekerBody: "आगे बढ़ने से पहले पूरा उम्मीदवार प्रोफ़ाइल देखें।",
    jobTitle: "नौकरी पोस्ट विवरण",
    jobBody: "इस अवसर का पूरा विवरण देखें।",
    matchScore: ({ score }) => `मिलान स्कोर: ${score}%`,
    profileNotFound: "प्रोफ़ाइल नहीं मिला",
    jobNotFound: "नौकरी नहीं मिली",
    loadingProfile: "प्रोफ़ाइल लोड हो रहा है...",
    loadingJob: "नौकरी विवरण लोड हो रहा है...",
    couldNotLoadProfile: "यह उम्मीदवार प्रोफ़ाइल लोड नहीं हो सका।",
    couldNotLoadJob: "यह नौकरी पोस्ट लोड नहीं हो सकी।",
    retryProfile: "प्रोफ़ाइल लोड करने में विफल। कृपया फिर से प्रयास करें।",
    retryJob: "नौकरी विवरण लोड करने में विफल। कृपया फिर से प्रयास करें।",
    companyInformation: "कंपनी जानकारी",
    personalInformation: "व्यक्तिगत जानकारी",
    educationExperience: "शिक्षा और अनुभव",
    preferenceSection: "प्राथमिकताएँ और बाधाएँ",
    jobDetailsSection: "नौकरी विवरण",
    salaryRange: "वेतन सीमा",
    contactEmail: "संपर्क ईमेल",
    contactPhone: "संपर्क फोन",
    contactName: "संपर्क नाम"
  }
};
export default hi;
