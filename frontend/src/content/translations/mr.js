const mr = {
  brand: {
    shortName: "Shaurya",
    name: "Shaurya JobSphere",
    tagline: "प्रतिभेला जोडणारे. भविष्य घडवणारे.",
    footerSummary: "महिलांना करिअर घडवण्यासाठी, आत्मविश्वासाने नेतृत्व करण्यासाठी आणि मर्यादांशिवाय पुढे जाण्यासाठी सक्षम करणारे व्यासपीठ."
  },
  nav: {
    home: "मुख्यपृष्ठ",
    features: "वैशिष्ट्ये",
    about: "आमच्याबद्दल",
    contact: "संपर्क",
    dashboard: "डॅशबोर्ड",
    login: "लॉग इन",
    register: "नोंदणी",
    getStarted: "खाते तयार करा",
    logout: "लॉग आउट",
    language: "भाषा",
    signedInAs: "लॉग इन केलेला वापरकर्ता",
    menu: "मेन्यू"
  },
  common: {
    loading: "लोड होत आहे...",
    optional: "ऐच्छिक",
    notProvided: "दिलेली नाही",
    clickToUpload: "अपलोड करण्यासाठी क्लिक करा",
    backToHome: "मुख्यपृष्ठावर परत जा",
    backToOptions: "पर्यायांकडे परत जा",
    backToRecommendations: "शिफारसींकडे परत जा",
    backToJobSeekers: "नोकरी शोधणाऱ्यांकडे परत जा",
    previous: "मागील",
    next: "पुढील",
    showingRange: ({ start, end, total }) => `${total} पैकी ${start} - ${end} दाखवत आहे`,
    selectField: ({ field }) => `${field} निवडा`,
    browserVoiceUnsupported: "तुमचा ब्राउझर आवाज ओळखण्यास समर्थन देत नाही किंवा सुरक्षित कनेक्शन आवश्यक आहे. कृपया Chrome किंवा Edge वापरा.",
    backendUnavailable: "बॅकएंड सर्व्हरशी कनेक्ट होऊ शकले नाही. कृपया बॅकएंड सुरू आहे याची खात्री करा.",
    sessionMissing: "वापरकर्ता सत्र सापडले नाही. कृपया पुन्हा लॉग इन करा.",
    voiceStartError: "मायक्रोफोन सुरू करता आला नाही. तो कदाचित आधीपासून वापरात असेल. कृपया पुन्हा प्रयत्न करा.",
    voiceWait: "कृपया आवाज इनपुट प्रक्रिया पूर्ण होईपर्यंत थांबा किंवा सध्याचे रेकॉर्डिंग आधी थांबवा.",
    fieldPrefix: "फील्ड"
  },
  footer: {
    quickLinks: "जलद दुवे",
    accessTitle: "भाषा",
    accessBody: "Shaurya JobSphere इंग्रजी, हिंदी किंवा मराठीत प्रत्येक उमेदवार आणि नियोक्ता प्रक्रियेत वापरा.",
    copyright: ({ year }) => `© ${year} Shaurya JobSphere. सर्व हक्क राखीव.`
  },
  landing: {
    badge: "व्यावसायिक नोकरी शोध आणि भरती",
    titleLine1: "योग्य संधी शोधा.",
    titleLine2: "योग्य प्रतिभेशी जोडा.",
    titleLine3: "भरतीला गती द्या.",
    description: "Shaurya JobSphere हे प्रतिभा शोधणे, संधींचा शोध घेणे आणि यशस्वी करिअर घडवणे यासाठी तुमचे सर्वसमावेशक व्यासपीठ आहे.",
    primaryCta: "नोकऱ्या शोधा",
    secondaryCta: "नोकरी पोस्ट करा",
    roleCards: {
      seekerTitle: "उमेदवारांसाठी",
      seekerBody: "पूर्ण प्रोफाइल तयार करा, संबंधित नोकऱ्या पाहा आणि तुमचा नोकरी शोध व्यवस्थित ठेवा.",
      seekerAction: "उमेदवार म्हणून पुढे जा",
      providerTitle: "नियोक्त्यांसाठी",
      providerBody: "स्पष्ट नोकरी जाहिराती प्रकाशित करा, संबंधित उमेदवारांचे पुनरावलोकन करा आणि भरती एकाच ठिकाणी व्यवस्थापित करा.",
      providerAction: "नियोक्ता म्हणून पुढे जा"
    },

    stats: [],
    aboutTitle: "अर्थपूर्ण करिअर आणि आत्मविश्वासपूर्ण भरतीसाठी तयार",
    aboutBody: "हे व्यासपीठ प्रतिभा, संधी आणि भरतीचे निर्णय एका स्पष्ट जागेत एकत्र आणते, ज्यामुळे उमेदवार आणि नियोक्ते आत्मविश्वासाने पुढे जाऊ शकतात.",
    contactTitle: "तुमच्या कार्यक्षेत्रात प्रवेश करा",
    contactBody: "उमेदवार किंवा नियोक्ता म्हणून पुढे जा आणि तुमच्या प्रवासासाठी तयार केलेला अनुभव अनुभवा."
  },
  home: {
    eyebrow: "कार्यस्थळ",
    title: "तुमचे नोकरी शोध किंवा भरती कार्यक्षेत्र निवडा",
    description: "तुमच्या भूमिकेला साजेसा अनुभव निवडा आणि स्पष्ट, व्यावसायिक प्रक्रियेत पुढे जा.",
    seekerTitle: "उमेदवारांसाठी",
    seekerBody: "तुमचे प्रोफाइल तयार करा, शिफारस केलेल्या भूमिका पाहा आणि तुमचा नोकरी शोध व्यवस्थित ठेवा.",
    seekerAction: "उमेदवार डॅशबोर्ड उघडा",
    providerTitle: "नियोक्त्यांसाठी",
    providerBody: "नोकऱ्या पोस्ट करा, शिफारस केलेले उमेदवार पाहा आणि एकाच डॅशबोर्डवरून भरती व्यवस्थापित करा.",
    providerAction: "नियोक्ता डॅशबोर्ड उघडा",
    footerNote: "व्यावसायिक प्रोफाइल्स, स्पष्ट नोकरी पोस्टिंग्स आणि संरचित भरती प्रक्रिया."
  },
  auth: {
    loginTitle: "पुन्हा स्वागत आहे",
    loginBody: "तुमच्या Shaurya JobSphere कार्यक्षेत्रात प्रवेश करण्यासाठी साइन इन करा.",
    registerTitle: "तुमचे खाते तयार करा",
    registerBody: "तुमचे प्रोफाइल तयार करण्यासाठी किंवा नोकऱ्या पोस्ट करण्यासाठी खाते तयार करा.",
    name: "पूर्ण नाव",
    email: "ईमेल पत्ता",
    password: "पासवर्ड",
    loginAction: "लॉग इन",
    loginLoading: "लॉग इन होत आहे...",
    registerAction: "खाते तयार करा",
    registerLoading: "खाते तयार होत आहे...",
    alreadyMember: "आधीच खाते आहे का?",
    signIn: "साइन इन",
    needAccount: "खाते हवे आहे का?",
    signUp: "साइन अप",
  },
  voice: {
    starting: "मायक्रोफोन सक्रिय करत आहे...",
    listening: "ऐकत आहे. कृपया आता बोला.",
    processing: "आवाज इनपुट लिप्यंतरित करत आहे...",
    cancel: "रद्द करा",
    stop: "रेकॉर्डिंग थांबवा",
    wait: "कृपया थांबा",
    autoStop: "थोड्या विरामानंतर रेकॉर्डिंग आपोआप थांबेल.",
    speak: "बोलण्यासाठी क्लिक करा",
    error: ({ error }) => `आवाज इनपुट त्रुटी: ${error}. कृपया Chrome किंवा Edge वापरा.`
  },
  submission: {
    successTitle: "यशस्वी",
    seekerSuccessBody: "तुमचे प्रोफाइल यशस्वीरित्या सबमिट झाले आहे.",
    providerSuccessBody: "तुमची नोकरी पोस्ट यशस्वीरित्या सबमिट झाली आहे.",
    redirecting: "तुमच्या डॅशबोर्डकडे पुनर्निर्देशित करत आहे...",
    submitting: "सबमिट होत आहे...",
    seekerSubmittingBody: "कृपया थांबा, आम्ही तुमचे प्रोफाइल प्रक्रिया करत आहोत.",
    providerSubmittingBody: "कृपया थांबा, आम्ही तुमची नोकरी पोस्ट प्रक्रिया करत आहोत."
  },
  jobSeekerForm: {
    title: "तुमचे नोकरी शोधक प्रोफाइल तयार करा",
    body: "संबंधित नोकरी शिफारसी मिळवण्यासाठी तुमची पार्श्वभूमी, कौशल्ये आणि कामाच्या आवडी जोडा.",
    personal: "वैयक्तिक माहिती",
    experience: "शिक्षण आणि कामाचा अनुभव",
    preferences: "आवडी आणि अडचणी",
    submit: "प्रोफाइल सबमिट करा",
    update: "प्रोफाइल अद्यतनित करा",
    requiredAlert: "कृपया सर्व आवश्यक फील्ड भरा: नाव, लॉगिन ईमेल आणि स्थान.",
    invalidEmailAlert: "तुमचा लॉगिन ईमेल वैध नाही. कृपया पुन्हा लॉग इन करा.",
    invalidContactAlert: "कृपया वैध संपर्क क्रमांक टाका (अगदी 10 अंक).",
    uploadLabel: "प्रोफाइल फोटो",
    fields: {
      name: {
        label: "पूर्ण नाव",
        placeholder: "तुमचे पूर्ण नाव टाका"
      },
      email: {
        label: "ईमेल पत्ता",
        placeholder: "your.email@example.com"
      },
      contact: {
        label: "संपर्क क्रमांक",
        placeholder: "+91 98765 43210"
      },
      location: {
        label: "स्थान / शहर",
        placeholder: "तुमचे शहर टाका"
      },
      qualification: {
        label: "उच्चतम शैक्षणिक पात्रता",
        placeholder: "उदा.: B.E. IT, डिप्लोमा, MBA"
      },
      skills: {
        label: "कौशल्ये",
        placeholder: "तुमची तांत्रिक, संवाद आणि इतर कौशल्ये तपशीलवार लिहा."
      },
      previousJob: {
        label: "मागील नोकरी / इंटर्नशिप",
        placeholder: "तुमची सर्वात संबंधित भूमिका किंवा इंटर्नशिप सांगा"
      },
      roles: {
        label: "भूमिका / जबाबदाऱ्या",
        placeholder: "मागील कामात तुम्ही हाताळलेल्या कामांचे वर्णन करा"
      },
      skillsApplied: {
        label: "वापरलेली कौशल्ये",
        placeholder: "मागील कामात तुम्ही कोणती कौशल्ये वापरली?"
      },
      certifications: {
        label: "प्रमाणपत्रे / उपलब्धी",
        placeholder: "प्रमाणपत्रे, पुरस्कार किंवा उपलब्धी जोडा"
      },
      portfolio: {
        label: "पोर्टफोलिओ / रिझ्युमे लिंक",
        placeholder: "पोर्टफोलिओ, LinkedIn किंवा रिझ्युमे लिंक पेस्ट करा"
      },
      preferences: {
        label: "तुमच्या पसंती",
        placeholder: "उपलब्धता, कामाच्या पसंती, वेळेच्या अडचणी किंवा विशेष गरजांबद्दल सांगा."
      }
    }
  },
  jobProviderForm: {
    title: "तुमची नोकरी पोस्ट तयार करा",
    body: "स्पष्ट नोकरी पोस्ट तयार करा जेणेकरून प्लॅटफॉर्म संबंधित उमेदवार दाखवू शकेल.",
    personal: "नियोक्ता माहिती",
    details: "नोकरी तपशील",
    submit: "नोकरीची संधी पोस्ट करा",
    update: "नोकरी पोस्ट अद्यतनित करा",
    requiredAlert: "कृपया सर्व आवश्यक फील्ड भरा: नाव, लॉगिन ईमेल, फोन नंबर, नोकरीचे शीर्षक आणि नोकरीचे वर्णन.",
    invalidEmailAlert: "तुमचा लॉगिन ईमेल वैध नाही. कृपया पुन्हा लॉग इन करा.",
    invalidPhoneAlert: "कृपया वैध फोन नंबर टाका (अगदी 10 अंक).",
    uploadLabel: "कंपनी लोगो",
    fields: {
      name: {
        label: "पूर्ण नाव",
        placeholder: "तुमचे पूर्ण नाव टाका"
      },
      age: {
        label: "वय",
        placeholder: "तुमचे वय टाका"
      },
      phoneNumber: {
        label: "फोन नंबर",
        placeholder: "+91 98765 43210"
      },
      email: {
        label: "ईमेल पत्ता",
        placeholder: "your.email@example.com"
      },
      companyName: {
        label: "कंपनीचे नाव",
        placeholder: "तुमच्या कंपनीचे नाव टाका"
      },
      jobTitle: {
        label: "नोकरीचे शीर्षक",
        placeholder: "उदा.: Operations Associate, Marketing Manager"
      },
      jobCategory: {
        label: "नोकरी श्रेणी"
      },
      jobDescription: {
        label: "नोकरीचे वर्णन",
        placeholder: "जबाबदाऱ्या, अपेक्षा आणि भूमिकेची व्याप्ती वर्णन करा."
      },
      experienceRequired: {
        label: "आवश्यक अनुभव",
        placeholder: "उदा.: ग्राहक सहाय्य क्षेत्रात 2-4 वर्षे"
      },
      salaryMin: {
        label: "किमान वेतन",
        placeholder: "रक्कम टाका"
      },
      salaryMax: {
        label: "कमाल वेतन",
        placeholder: "रक्कम टाका"
      },
      salaryType: {
        label: "वेतन प्रकार"
      },
      jobLocation: {
        label: "नोकरीचे ठिकाण",
        placeholder: "उदा.: पुणे, Remote, बेंगळुरू"
      },
      jobType: {
        label: "नोकरीचा प्रकार"
      },
      benefits: {
        label: "फायदे आणि सुविधा",
        placeholder: "लवचिकता, विमा, रजा, प्रवास सहाय्य आणि इतर गोष्टी नमूद करा."
      },
      applicationDeadline: {
        label: "अर्जाची अंतिम तारीख"
      },
      requiredQualifications: {
        label: "आवश्यक पात्रता",
        placeholder: "शिक्षण, प्रमाणपत्रे किंवा आवश्यक पात्रता लिहा"
      }
    }
  },
  taxonomy: {
    jobCategories: {
      technology: "तंत्रज्ञान",
      healthcare: "आरोग्यसेवा",
      education: "शिक्षण",
      finance: "वित्त",
      sales: "विक्री आणि विपणन",
      operations: "कार्यप्रणाली",
      hospitality: "आतिथ्य सेवा",
      retail: "किरकोळ विक्री",
      manufacturing: "उत्पादन",
      other: "इतर"
    },
    jobTypes: {
      "full-time": "पूर्णवेळ",
      "part-time": "अर्धवेळ",
      contract: "कराराधारित",
      temporary: "तात्पुरते",
      freelance: "फ्रीलान्स"
    },
    salaryTypes: {
      yearly: "वार्षिक",
      monthly: "मासिक",
      hourly: "तासिक"
    }
  },
  jobSeekerDashboard: {
    title: "उमेदवार डॅशबोर्ड",
    body: "तुमचे प्रोफाइल व्यवस्थापित करा, शिफारस केलेल्या नोकऱ्या पाहा आणि माहिती अद्ययावत ठेवा.",
    hubTitle: "उमेदवार डॅशबोर्ड",
    welcomeNew: "तुम्हाला पुढे काय करायचे आहे ते निवडा.",
    welcomeBack: "पुन्हा स्वागत आहे. तुमचा पुढचा टप्पा निवडा.",
    fillTitle: "तुमचे प्रोफाइल तयार करा",
    updateTitle: "तुमचे प्रोफाइल अद्यतनित करा",
    fillBody: "नोकरी शिफारसी सुधारण्यासाठी तुमची कौशल्ये, अनुभव आणि आवडी जोडा.",
    updateBody: "जतन केलेल्या प्रोफाइल तपशीलांचे पुनरावलोकन करा आणि सुधारणा करा.",
    viewTitle: "तुमचे प्रोफाइल पाहा",
    viewBody: "तुमच्या नोकरी शोधक प्रोफाइलमध्ये सध्या जतन केलेले तपशील पहा.",
    matchesTitle: "शिफारस केलेल्या नोकऱ्या",
    matchesBody: "तुमच्या प्रोफाइलसाठी शिफारस केलेल्या नोकऱ्या पाहा.",
    noProfile: "तुम्ही अजून प्रोफाइल भरलेले नाही. कृपया आधी ते तयार करा.",
    recommendationTitle: "शिफारस केलेल्या नोकऱ्या",
    recommendationCount: ({ count }) => `तुमच्या प्रोफाइलसाठी ${count} भूमिका सापडल्या`,
    noMatchesTitle: "अजून शिफारस केलेल्या नोकऱ्या नाहीत.",
    noMatchesBody: "शिफारसी सुधारण्यासाठी अधिक संपूर्ण प्रोफाइल तपशील जोडा.",
    overallMatch: "एकूण जुळण",
    skillsMatch: "कौशल्य जुळण",
    constraintsMatch: "पसंती जुळण",
    explanation: "जुळणीविषयक माहिती",
    loadingRecommendations: "शिफारसी लोड होत आहेत...",
    couldNotLoadRecommendations: "शिफारसी लोड करता आल्या नाहीत. कृपया पुन्हा प्रयत्न करा."
  },
  jobProviderDashboard: {
    title: "नियोक्ता डॅशबोर्ड",
    body: "तुमची नोकरी पोस्ट व्यवस्थापित करा, शिफारस केलेले उमेदवार पाहा आणि भरती व्यवस्थित ठेवा.",
    hubTitle: "नियोक्ता डॅशबोर्ड",
    welcomeNew: "तुम्हाला पुढे काय करायचे आहे ते निवडा.",
    welcomeBack: "पुन्हा स्वागत आहे. तुमचा पुढचा टप्पा निवडा.",
    createTitle: "नोकरी पोस्ट तयार करा",
    updateTitle: "नोकरी पोस्ट अद्यतनित करा",
    createBody: "भूमिका प्रकाशित करा आणि तुमच्या गरजांशी जुळणाऱ्या उमेदवारांपर्यंत पोहोचा.",
    updateBody: "अधिक चांगले जुळणारे उमेदवार आकर्षित करण्यासाठी तुमची सध्याची यादी सुधारित करा.",
    viewTitle: "तुमची नोकरी पोस्ट पाहा",
    viewBody: "तुमच्या सक्रिय भूमिकेसाठी सध्या दिसत असलेले तपशील पाहा.",
    applicationsTitle: "शिफारस केलेले उमेदवार",
    applicationsBody: "तुमच्या सक्रिय नोकरी पोस्टसाठी शिफारस केलेल्या उमेदवारांचे पुनरावलोकन करा.",
    noPosting: "तुम्ही अजून नोकरी पोस्ट केलेली नाही. कृपया आधी एक तयार करा.",
    candidatesTitle: "शिफारस केलेले उमेदवार",
    candidatesCount: ({ count }) => `तुमच्या गरजांशी जुळणारे ${count} उमेदवार सापडले`,
    noCandidates: "अजून जुळणारे उमेदवार सापडले नाहीत.",
    loadingCandidates: "जुळणारे उमेदवार लोड होत आहेत...",
    couldNotLoadCandidates: "जुळणारे उमेदवार लोड करता आले नाहीत. कृपया पुन्हा प्रयत्न करा.",
    clickProfile: "उमेदवार प्रोफाइल उघडा"
  },
  viewPages: {
    seekerTitle: "नोकरी शोधक प्रोफाइल",
    seekerBody: "पुढे जाण्यापूर्वी संपूर्ण उमेदवार प्रोफाइल पाहा.",
    jobTitle: "नोकरी पोस्ट तपशील",
    jobBody: "या संधीचे संपूर्ण तपशील पाहा.",
    matchScore: ({ score }) => `जुळणी गुण: ${score}%`,
    profileNotFound: "प्रोफाइल सापडले नाही",
    jobNotFound: "नोकरी सापडली नाही",
    loadingProfile: "प्रोफाइल लोड होत आहे...",
    loadingJob: "नोकरी तपशील लोड होत आहेत...",
    couldNotLoadProfile: "हे उमेदवार प्रोफाइल लोड करता आले नाही.",
    couldNotLoadJob: "ही नोकरी पोस्ट लोड करता आली नाही.",
    retryProfile: "प्रोफाइल लोड करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    retryJob: "नोकरी तपशील लोड करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    companyInformation: "कंपनी माहिती",
    personalInformation: "वैयक्तिक माहिती",
    educationExperience: "शिक्षण आणि अनुभव",
    preferenceSection: "पसंती आणि अडचणी",
    jobDetailsSection: "नोकरी तपशील",
    salaryRange: "वेतन श्रेणी",
    contactEmail: "संपर्क ईमेल",
    contactPhone: "संपर्क फोन",
    contactName: "संपर्क नाव"
  }
};
export default mr;
