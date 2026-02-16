import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from "../components/Navbar";

// Component to view job posting details
function ViewJobPostingDetail({ data, onBack, matchScore }) {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-8 text-gray-600 hover:text-gray-800 font-medium flex items-center text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Recommendations
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-4">Job Details</h2>
      {matchScore && (
        <p className="text-lg text-purple-600 font-semibold mb-6">Match Score: {matchScore}%</p>
      )}

      <div className="space-y-8">
        {/* Company logo if present */}
        {data.company_logo && (
          <div className="mb-4">
            <img src={data.company_logo} alt="Company Logo" className="w-40 h-20 object-contain rounded-lg shadow-sm" />
          </div>
        )}

        {/* Company Information */}
        <section className="bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-xl border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-600 mb-6">🏢 Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Company Name" value={data.companyName} />
            <InfoField label="Contact Email" value={data.email} />
            <InfoField label="Contact Phone" value={data.phoneNumber} />
            <InfoField label="Contact Name" value={data.name} />
          </div>
        </section>

        {/* Job Details */}
        <section className="bg-gradient-to-r from-purple-50 to-transparent p-6 rounded-xl border-2 border-purple-200">
          <h3 className="text-2xl font-bold text-purple-600 mb-6">💼 Job Details</h3>
          <div className="space-y-5">
            <InfoField label="Job Title" value={data.jobTitle} />
            <InfoField label="Job Category" value={data.jobCategory} />
            <InfoField label="Job Type" value={data.jobType} />
            <InfoField label="Location" value={data.jobLocation} />
            <InfoField label="Description" value={data.jobDescription} />
            <InfoField label="Experience Required" value={data.experienceRequired} />
            <InfoField label="Salary Range" value={`${data.salaryMin} - ${data.salaryMax} (${data.salaryType})`} />
            <InfoField label="Benefits" value={data.benefits} />
            <InfoField label="Required Qualifications" value={data.requiredQualifications} />
          </div>
        </section>
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
        Back to Recommendations
      </button>

      <div className="text-center mt-12 py-16">
        <div className="text-6xl mb-6">📭</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Job Not Found</h2>
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium text-lg hover:underline"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Recommendations
        </button>
      </div>
    </div>
  );
}

export default function ViewJobPostingPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [postingData, setPostingData] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobPosting();
    // Get match score from location state if available
    const state = navigate.location?.state;
    if (state?.matchScore) {
      setMatchScore(state.matchScore);
    }
  }, [jobId]);

  const fetchJobPosting = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/get-job-posting-by-id/${jobId}`
      );
      const data = await response.json();
      
      if (data.posting) {
        setPostingData(data.posting);
      } else {
        setError('Could not load this job posting details.');
      }
    } catch (err) {
      console.error('Error fetching job posting:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/job-seeker-dashboard');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Posting Details</h1>
            <p className="text-gray-600">Review this job opportunity that matches your profile</p>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            {loading && (
              <div className="text-center mt-8 text-lg text-gray-600">Loading job details...</div>
            )}
            {error && (
              <UnavailableData 
                message={error}
                onBack={handleBack}
              />
            )}
            {postingData && !loading && (
              <ViewJobPostingDetail 
                data={postingData}
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
