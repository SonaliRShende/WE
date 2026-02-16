import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from "../components/Navbar";

// Component to view job seeker profile
function ViewApplicationData({ data, onBack, matchScore }) {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-8 text-gray-600 hover:text-gray-800 font-medium flex items-center text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Job Seekers
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-4">Job Seeker Profile</h2>
      {matchScore && (
        <p className="text-lg text-blue-600 font-semibold mb-6">Match Score: {matchScore}%</p>
      )}
          {/* Profile photo if available */}
          {data.profile_pic && (
            <div className="mb-6 flex items-center">
              <img src={data.profile_pic} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-pink-200 mr-4" />
              <div>
                <h3 className="text-xl font-semibold">{data.name}</h3>
                <p className="text-gray-600">{data.email}</p>
              </div>
            </div>
          )}
      
      <div className="space-y-8">
        {/* Personal Information */}
        <section className="bg-gradient-to-r from-pink-50 to-transparent p-6 rounded-xl border-2 border-pink-200">
          <h3 className="text-2xl font-bold text-pink-600 mb-6">👤 Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Name" value={data.name} />
            <InfoField label="Email" value={data.email} />
            <InfoField label="Contact" value={data.contact} />
            <InfoField label="Location" value={data.location} />
          </div>
        </section>

        {/* Education & Experience */}
        <section className="bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-600 mb-6">🎓 Education & Experience</h3>
          <div className="space-y-5">
            <InfoField label="Highest Qualification" value={data.qualification} />
            <InfoField label="Skills" value={data.skills} />
            <InfoField label="Previous Job / Internship" value={data.previousJob} />
            <InfoField label="Roles / Responsibilities" value={data.roles} />
            <InfoField label="Skills Applied" value={data.skillsApplied} />
            <InfoField label="Certifications / Achievements" value={data.certifications} />
            <InfoField label="Portfolio / Resume Link" value={data.portfolio} />
          </div>
        </section>

        {/* Preferences */}
        {data.preferences && (
          <section className="bg-gradient-to-r from-purple-50 to-transparent p-6 rounded-xl border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-purple-600 mb-6">⚙️ Preferences & Constraints</h3>
            <InfoField label="Your Preferences" value={data.preferences} />
          </section>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-lg">
      <label className="text-sm font-semibold text-gray-600 block mb-2">{label}</label>
      <p className="text-gray-800 text-lg whitespace-pre-wrap">{value || <span className="text-gray-400 italic">Not provided</span>}</p>
    </div>
  );
}

// Component for unavailable data
function UnavailableData({ message, onBack }) {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-8 text-gray-600 hover:text-gray-800 font-medium flex items-center text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Job Seekers
      </button>

      <div className="text-center mt-12 py-16">
        <div className="text-6xl mb-6">📭</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Job Seekers
        </button>
      </div>
    </div>
  );
}

export default function ViewJobSeekerProfilePage() {
  const navigate = useNavigate();
  const { seekerId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSeekerProfile();
  }, [seekerId]);

  const fetchSeekerProfile = async () => {
    try {
      setLoading(true);
      // Fetch the seeker's profile using their ID
      const response = await fetch(
        `http://127.0.0.1:5000/api/get-job-seeker-application/${seekerId}`
      );
      const data = await response.json();
      
      if (data.application) {
        setProfileData(data.application);
      } else {
        setError('Could not load this job seeker\'s profile.');
      }
    } catch (err) {
      console.error('Error fetching seeker profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/job-provider-dashboard');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Seeker Profile</h1>
            <p className="text-gray-600">View the complete profile to understand the candidate better</p>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            {loading && (
              <div className="text-center mt-8 text-lg text-gray-600">Loading profile...</div>
            )}
            {error && (
              <UnavailableData 
                message={error}
                onBack={handleBack}
              />
            )}
            {profileData && !loading && (
              <ViewApplicationData 
                data={profileData}
                onBack={handleBack}
                matchScore={matchScore}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
