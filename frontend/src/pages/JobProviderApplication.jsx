import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Upload, X, ArrowLeft, Loader, Globe } from 'lucide-react';
import Navbar from "../components/Navbar";

const initialFormData = {
  // Personal Information
  name: '',
  age: '',
  phoneNumber: '',
  email: '',
  companyName: '',
  companyLogo: null,
  
  // Job Details
  jobTitle: '',
  jobCategory: '',
  jobDescription: '',
  experienceRequired: '',
  salaryMin: '',
  salaryMax: '',
  salaryType: 'yearly',
  jobLocation: '',
  jobType: 'full-time',
  benefits: '',
  applicationDeadline: '',
  requiredQualifications: ''
};

const VoiceFeedbackModal = ({ voiceState, toggleVoiceInput }) => {
  const { state, field } = voiceState;
  
  if (state === 'idle') return null;

  let title, icon, colorClass, buttonText;
  const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  switch (state) {
    case 'starting':
      title = 'Activating Microphone...';
      icon = <Mic size={48} className="text-yellow-500" />;
      colorClass = 'border-yellow-500';
      buttonText = 'Cancel';
      break;
    case 'listening':
      title = 'Listening... Please Speak Now!';
      icon = <MicOff size={48} className="text-red-500 animate-pulse" />;
      colorClass = 'border-red-500';
      buttonText = 'Stop Recording';
      break;
    case 'processing':
      title = 'Transcribing Voice...';
      icon = <Loader size={48} className="text-blue-500 animate-spin" />;
      colorClass = 'border-blue-500';
      buttonText = 'Wait...';
      break;
    default:
      return null;
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm"> 
      <div className={`bg-white p-10 rounded-xl shadow-2xl text-center border-4 ${colorClass} w-80`}>
        {icon}
        <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">For Field: <strong>{fieldLabel}</strong></p>
        
        <button
          onClick={() => toggleVoiceInput(field)} 
          className={`px-6 py-2 rounded-full font-medium transition duration-200 ${
            state === 'listening' 
              ? 'bg-red-500 text-white hover:bg-red-600'
              : state === 'starting' 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-blue-100 text-blue-500 cursor-not-allowed'
          }`}
          disabled={state === 'processing'}
        >
          {buttonText}
        </button>
        {state === 'listening' && (
          <p className="text-xs text-gray-500 mt-2">
            (Recording will stop automatically after a pause)
          </p>
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, field, value, placeholder, type = "text", rows, mandatory = false, handleInputChange, toggleVoiceInput, options = null }) => (
  <div className="mb-6">
    <label className="block text-gray-700 font-medium mb-2">
      {label} {mandatory && <span className="text-blue-500">*</span>}
    </label>
    <div className="relative">
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          rows={rows || 4}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        >
          <option value="">Select {label}</option>
          {options && options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        />
      )}
      {type !== "select" && (
        <button
          type="button"
          onClick={() => toggleVoiceInput(field)}
          className="absolute right-3 top-3 p-2 rounded-full transition bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
          title="Click to Speak"
        >
          <Mic size={18} />
        </button>
      )}
    </div>
  </div>
);

export default function JobProviderApplication({ existingData = null, onSuccess = null }) {
  const [formData, setFormData] = useState(existingData ? {
    name: existingData.name ?? '',
    age: existingData.age ?? '',
    phoneNumber: existingData.phoneNumber ?? existingData.phone_number ?? '',
    email: existingData.email ?? '',
    companyName: existingData.companyName ?? existingData.company_name ?? '',
    companyLogo: null,
    jobTitle: existingData.jobTitle ?? existingData.job_title ?? '',
    jobCategory: existingData.jobCategory ?? existingData.job_category ?? '',
    jobDescription: existingData.jobDescription ?? existingData.job_description ?? '',
    experienceRequired: existingData.experienceRequired ?? existingData.experience_required ?? '',
    salaryMin: existingData.salaryMin ?? existingData.salary_min ?? '',
    salaryMax: existingData.salaryMax ?? existingData.salary_max ?? '',
    salaryType: existingData.salaryType ?? existingData.salary_type ?? 'yearly',
    jobLocation: existingData.jobLocation ?? existingData.job_location ?? '',
    jobType: existingData.jobType ?? existingData.job_type ?? 'full-time',
    benefits: existingData.benefits ?? '',
    applicationDeadline: existingData.applicationDeadline ?? existingData.application_deadline ?? '',
    requiredQualifications: existingData.requiredQualifications ?? existingData.required_qualifications ?? ''
  } : initialFormData);

  const [logoPreview, setLogoPreview] = useState(
    existingData && (existingData.company_logo || existingData.companyLogo) ? (existingData.company_logo || existingData.companyLogo) : null
  );
  const [voiceState, setVoiceState] = useState({ state: 'idle', field: null });
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const processingRef = useRef(false); 
  const recognitionRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, companyLogo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, companyLogo: null }));
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (voiceState.state !== 'idle') {
      alert("Please wait for voice input to finish processing or click 'Stop Recording' in the modal.");
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.jobTitle || !formData.jobDescription) {
      alert('Please fill all mandatory fields (Name, Email, Phone Number, Job Title, Job Description)');
      return;
    }

    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
      alert('User session not found. Please login again.');
      return;
    }

    const { companyLogo, ...dataToSend } = formData; 
    // include base64 preview if available so backend can persist image
    const dataWithUserId = { ...dataToSend, user_id: user.id, company_logo: logoPreview || null };
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/submit-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithUserId),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Server Response:', result);
        alert('✅ Job posting submitted successfully!');
        setFormData(initialFormData);
        setLogoPreview(null);
        
        // Redirect to provider dashboard after brief delay
        setTimeout(() => {
            window.location.href = '/job-provider-dashboard';
        }, 1500);
      } else {
        console.error('Submission failed:', result.error);
        alert(`❌ Job posting submission failed: ${result.error || 'Server error'}`);
      }
    } catch (error) {
      console.error('Network or unexpected error:', error);
      alert('Could not connect to the backend server. Is app.py running?');
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        console.log('Recognition started');
        setVoiceState(prev => ({ ...prev, state: 'listening' }));
        processingRef.current = false;
      };

      recognition.onresult = (event) => {
        if (processingRef.current) {
          console.log('Already processing, skipping duplicate');
          return;
        }
        
        processingRef.current = true;
        
        const speechResult = event.results[0][0].transcript;
        console.log('Voice Transcription:', speechResult);
        
        setVoiceState(prev => {
          if (!prev.field) {
            processingRef.current = false;
            return prev;
          }
          
          const currentField = prev.field;
          
          setFormData(prevForm => {
            const existingText = prevForm[currentField] || '';
            const newText = speechResult.trim();
            
            return {
              ...prevForm,
              [currentField]: existingText ? `${existingText} ${newText}` : newText
            };
          });
          
          return { ...prev, state: 'processing' };
        });
        
        setTimeout(() => {
          processingRef.current = false;
        }, 1000);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert(`Voice Input Error: ${event.error}. Try Chrome/Edge.`);
        setVoiceState({ state: 'idle', field: null });
        processingRef.current = false;
      };
      
      recognition.onend = () => {
        console.log('Recognition ended');
        setTimeout(() => {
          setVoiceState({ state: 'idle', field: null });
          processingRef.current = false;
        }, 500);
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn("Web Speech API not fully supported in this browser.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('Recognition cleanup (safe to ignore):', e);
        }
        recognitionRef.current = null;
      }
      processingRef.current = false;
    };
  }, [selectedLanguage]);

  const toggleVoiceInput = (field) => {
    console.log('Toggle voice called for field:', field, 'Current state:', voiceState);
    
    const isActive = voiceState.field === field && voiceState.state !== 'idle';
    
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported by your browser or requires a secure connection (HTTPS). Try Chrome or Edge.");
      return;
    }

    if (isActive) {
      console.log('Stopping recognition');
      recognitionRef.current.stop();
      processingRef.current = false;
    } else {
      if (voiceState.state !== 'idle') {
        recognitionRef.current.stop();
        processingRef.current = false;
      }
      
      setVoiceState({ state: 'starting', field: field });
      
      setTimeout(() => {
        try {
          console.log('Starting recognition for field:', field);
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start recognition:", e);
          setVoiceState({ state: 'idle', field: null });
          alert("Error starting microphone. The microphone might already be in use. Try again.");
        }
      }, 200);
    }
  };

  const jobCategories = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' }
  ];

  const jobTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const salaryTypes = [
    { value: 'yearly', label: 'Yearly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'hourly', label: 'Hourly' }
  ];

  return (
    <>
      <Navbar />
      
      <VoiceFeedbackModal voiceState={voiceState} toggleVoiceInput={toggleVoiceInput} />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-slate-50 to-cyan-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </a>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Post a Job Opportunity
              </h1>
              <p className="text-gray-600 text-lg">
                Help us find the perfect candidate for your organization by sharing job details.
              </p>
            </div>

            {/* Language Selector */}
            <div className="mb-8 flex justify-center">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3 rounded-full shadow-md border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Globe className="text-blue-600" size={20} />
                  <label className="font-medium text-gray-700">Voice Language:</label>
                  <select 
                    value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-4 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white font-medium text-gray-700 cursor-pointer"
                  >
                    <option value="en-IN">🇮🇳 English (India)</option>
                    <option value="hi-IN">🇮🇳 हिंदी (Hindi)</option>
                    <option value="en-US">🇺🇸 English (US)</option>
                    <option value="en-GB">🇬🇧 English (UK)</option>
                    <option value="mr-IN">🇮🇳 मराठी (Marathi)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              {/* Personal Information Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-blue-600 mb-6 border-b-2 border-blue-200 pb-2">Personal Information</h2>
                
                <InputField label="Full Name" field="name" value={formData.name} placeholder="Enter your full name" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <InputField label="Age" field="age" value={formData.age} placeholder="Enter your age" type="number" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                  <InputField label="Phone Number" field="phoneNumber" value={formData.phoneNumber} placeholder="+91 98765 43210" type="tel" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                </div>

                <InputField label="Email Address" field="email" value={formData.email} placeholder="your.email@example.com" type="email" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <InputField label="Company Name" field="companyName" value={formData.companyName} placeholder="Enter your company name" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Company Logo <span className="text-gray-500 text-sm">(Optional)</span>
                  </label>
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img src={logoPreview} alt="Company Logo" className="w-32 h-32 rounded-lg object-cover border-4 border-blue-200" />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                        <span className="text-gray-600">Click to upload</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Job Details Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-cyan-600 mb-6 border-b-2 border-cyan-200 pb-2">Job Details</h2>
                
                <InputField label="Job Title" field="jobTitle" value={formData.jobTitle} placeholder="e.g., Senior Software Engineer, Marketing Manager" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <InputField label="Job Category" field="jobCategory" value={formData.jobCategory} type="select" options={jobCategories} mandatory handleInputChange={handleInputChange}/>

                <InputField label="Job Description" field="jobDescription" value={formData.jobDescription} placeholder="Provide a detailed description of the job role, responsibilities, and expectations..." type="textarea" rows={6} mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <InputField label="Required Qualifications" field="requiredQualifications" value={formData.requiredQualifications} placeholder="List education, certifications, and required qualifications" type="textarea" rows={4} handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <InputField label="Experience Required" field="experienceRequired" value={formData.experienceRequired} placeholder="e.g., 3-5 years in software development" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <InputField label="Minimum Salary" field="salaryMin" value={formData.salaryMin} placeholder="Enter amount" type="number" handleInputChange={handleInputChange}/>
                  <InputField label="Maximum Salary" field="salaryMax" value={formData.salaryMax} placeholder="Enter amount" type="number" handleInputChange={handleInputChange}/>
                  <InputField label="Salary Type" field="salaryType" value={formData.salaryType} type="select" options={salaryTypes} handleInputChange={handleInputChange}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <InputField label="Job Location" field="jobLocation" value={formData.jobLocation} placeholder="e.g., New York, Remote, Bangalore" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                  <InputField label="Job Type" field="jobType" value={formData.jobType} type="select" options={jobTypes} handleInputChange={handleInputChange}/>
                </div>

                <InputField label="Benefits & Perks" field="benefits" value={formData.benefits} placeholder="List benefits such as health insurance, flexible hours, work from home, etc." type="textarea" rows={4} handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <InputField label="Application Deadline" field="applicationDeadline" value={formData.applicationDeadline} type="date" handleInputChange={handleInputChange}/>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
                  disabled={voiceState.state !== 'idle'}
                >
                  Post Job Opening
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
