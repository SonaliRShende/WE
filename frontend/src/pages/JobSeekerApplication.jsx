import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Upload, X, ArrowLeft, Loader, Globe, CheckCircle } from 'lucide-react';
import Navbar from "../components/Navbar";

const initialFormData = {
  name: '', email: '', contact: '', location: '', profilePic: null,
  qualification: '', skills: '', previousJob: '', roles: '',
  skillsApplied: '', certifications: '', portfolio: '', preferences: ''
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

const SubmissionModal = ({ isSubmitting, isSuccess }) => {
  if (!isSubmitting && !isSuccess) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white p-12 rounded-2xl shadow-2xl text-center w-96">
        {isSuccess ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle size={64} className="text-green-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Success! 🎉</h2>
            <p className="text-gray-600 text-lg mb-8">
              Your application has been submitted successfully!
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-spin"></div>
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <Loader size={32} className="text-pink-500 animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Submitting...</h2>
            <p className="text-gray-600">
              Please wait while we process your application
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, field, value, placeholder, type = "text", rows, mandatory = false, handleInputChange, toggleVoiceInput }) => (
  <div className="mb-6">
    <label className="block text-gray-700 font-medium mb-2">
      {label} {mandatory && <span className="text-pink-500">*</span>}
    </label>
    <div className="relative">
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          rows={rows || 4}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
        />
      )}
      <button
        type="button"
        onClick={() => toggleVoiceInput(field)}
        className="absolute right-3 top-3 p-2 rounded-full transition bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
        title="Click to Speak"
      >
        <Mic size={18} />
      </button>
    </div>
  </div>
);

export default function JobSeekerApplication({ existingData = null, onSuccess = null }) {
  // If existingData provided, pre-fill the form
  const [formData, setFormData] = useState(existingData ? {
    name: existingData.name || '',
    email: existingData.email || '',
    contact: existingData.contact || '',
    location: existingData.location || '',
    profilePic: null,
    qualification: existingData.qualification || '',
    skills: existingData.skills || '',
    previousJob: existingData.previousJob || '',
    roles: existingData.roles || '',
    skillsApplied: existingData.skillsApplied || '',
    certifications: existingData.certifications || '',
    portfolio: existingData.portfolio || '',
    preferences: existingData.preferences || ''
  } : initialFormData);
  
  const [profilePreview, setProfilePreview] = useState(null);
  const [voiceState, setVoiceState] = useState({ state: 'idle', field: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const processingRef = useRef(false); 
  const recognitionRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePic: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profilePic: null }));
    setProfilePreview(null);
  };
  
  // ... in JobSeekerApplication.jsx

const handleSubmit = async (e) => {
    e.preventDefault();
    if (voiceState.state !== 'idle') {
        alert("Please wait for voice input to finish processing or click 'Stop Recording' in the modal.");
        return;
    }
    
    if (!formData.name || !formData.email || !formData.location) {
        alert('Please fill all mandatory fields (Name, Email, Location)');
        return;
    }

    // Get user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) {
        alert('User session not found. Please login again.');
        return;
    }

    // Show loading modal
    setIsSubmitting(true);
    setIsSuccess(false);

    const { profilePic, ...dataToSend } = formData; 
    // include base64 preview if available so backend can persist image
    const dataWithUserId = { ...dataToSend, user_id: user.id, profile_pic: profilePreview || null };
    
    try {
        const response = await fetch('http://127.0.0.1:5000/api/submit-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataWithUserId), // Send the form data with user_id
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Server Response:', result);
            
            // NEW: Generate embeddings after successful submission
            try {
                const embeddingResponse = await fetch(
                    `http://127.0.0.1:5000/api/generate-embeddings/${user.id}`,
                    { method: 'POST' }
                );
                const embeddingResult = await embeddingResponse.json();
                console.log('✅ Embeddings generated:', embeddingResult);
            } catch (embError) {
                console.error('Embedding generation warning:', embError);
            }
            
            // Show success modal
            setIsSuccess(true);
            
            // Reset form
            setFormData(initialFormData);
            setProfilePreview(null);
            
            // Call onSuccess callback if provided (for dashboard)
            if (onSuccess) {
              onSuccess();
            }
            
            // Redirect to dashboard after brief delay
            setTimeout(() => {
                window.location.href = '/job-seeker-dashboard';
            }, 2500);
            
        } else {
            // Handle server-side validation or errors
            console.error('Submission failed:', result.error);
            setIsSubmitting(false);
            alert(`❌ Application submission failed: ${result.error || 'Server error'}`);
        }
    } catch (error) {
        console.error('Network or unexpected error:', error);
        setIsSubmitting(false);
        alert('Could not connect to the backend server. Is app.py running?');
    }
};

// ...


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
      processingRef.current = false; // Reset processing flag
    };

    recognition.onresult = (event) => {
      // Prevent duplicate processing
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
      
      // Reset processing flag after a delay
      setTimeout(() => {
        processingRef.current = false;
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert(`Voice Input Error: ${event.error}. Try Chrome/Edge.`);
      setVoiceState({ state: 'idle', field: null });
      processingRef.current = false; // Reset on error
    };
    
    recognition.onend = () => {
      console.log('Recognition ended');
      setTimeout(() => {
        setVoiceState({ state: 'idle', field: null });
        processingRef.current = false; // Reset when ended
      }, 500);
    };
    
    recognitionRef.current = recognition;
  } else {
    console.warn("Web Speech API not fully supported in this browser.");
  }

  return () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Use abort instead of stop
      } catch (e) {
        console.log('Recognition cleanup (safe to ignore):', e);
      }
      recognitionRef.current = null; // Clear the reference
    }
    processingRef.current = false; // Reset flag on cleanup
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
    processingRef.current = false; // Reset flag when manually stopped
  } else {
    if (voiceState.state !== 'idle') {
      recognitionRef.current.stop();
      processingRef.current = false; // Reset flag
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
  return (
    <>
      <Navbar />
      
      <VoiceFeedbackModal voiceState={voiceState} toggleVoiceInput={toggleVoiceInput} />
      <SubmissionModal isSubmitting={isSubmitting} isSuccess={isSuccess} />
      
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium">
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </a>
          </div>

          <div className="bg-white shadow-xl rounded-2xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Unlock Your Dream Opportunity
              </h1>
              <p className="text-gray-600 text-lg">
                Share your story with us — we'll help you find the perfect match.
              </p>
            </div>

            {/* Language Selector */}
            <div className="mb-8 flex justify-center">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-3 rounded-full shadow-md border border-pink-200">
                <div className="flex items-center space-x-3">
                  <Globe className="text-pink-600" size={20} />
                  <label className="font-medium text-gray-700">Voice Language:</label>
                  <select 
                    value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-4 py-1.5 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-400 bg-white font-medium text-gray-700 cursor-pointer"
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
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-pink-600 mb-6 border-b-2 border-pink-200 pb-2">Personal Information</h2>
                
                <InputField label="Full Name" field="name" value={formData.name} placeholder="Enter your full name" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <InputField label="Email Address" field="email" value={formData.email} placeholder="your.email@example.com" type="email" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                  <InputField label="Contact Number" field="contact" value={formData.contact} placeholder="+91 98765 43210" type="tel" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                </div>
                <InputField label="Location / City" field="location" value={formData.location} placeholder="Enter your city" mandatory handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Profile Picture <span className="text-gray-500 text-sm">(Optional)</span>
                  </label>
                  {profilePreview ? (
                    <div className="relative inline-block">
                      <img src={profilePreview} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-pink-200" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition">
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                        <span className="text-gray-600">Click to upload</span>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-blue-600 mb-6 border-b-2 border-blue-200 pb-2">Educational & Work Experience</h2>
                <InputField label="Highest Qualification" field="qualification" value={formData.qualification} placeholder="e.g., B.E. IT, Diploma in Computer Science, MBA" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Skills" field="skills" value={formData.skills} placeholder="List all your skills in detail (e.g., React, JavaScript, Communication, Project Management, etc.)" type="textarea" rows={6} handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Previous Job / Internship" field="previousJob" value={formData.previousJob} placeholder="e.g., Software Developer at XYZ Company, Marketing Intern at ABC Corp" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Roles / Responsibilities" field="roles" value={formData.roles} placeholder="Brief description of tasks you handled in your previous role" type="textarea" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Skills Applied" field="skillsApplied" value={formData.skillsApplied} placeholder="Which skills did you use in your past work?" type="textarea" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Certifications / Achievements" field="certifications" value={formData.certifications} placeholder="Any certifications, awards, or achievements (Optional)" type="textarea" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
                <InputField label="Portfolio / Resume Link" field="portfolio" value={formData.portfolio} placeholder="https://yourportfolio.com or link to your resume" type="url" handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
              </div>

              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-purple-600 mb-6 border-b-2 border-purple-200 pb-2">Preferences & Constraints</h2>
                <InputField label="Your Preferences" field="preferences" value={formData.preferences} placeholder="Tell us about your availability, work preferences, constraints, or any special requirements (e.g., remote work only, flexible hours, part-time, etc.)" type="textarea" rows={5} handleInputChange={handleInputChange} toggleVoiceInput={toggleVoiceInput}/>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={voiceState.state !== 'idle' || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}