import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, Plus } from 'lucide-react';
import Navbar from "../components/Navbar";
import JobProviderApplication from './JobProviderApplication';

// Component to view existing job posting
function ViewJobPosting({ data, onBack }) {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-800 font-medium flex items-center"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back
      </button>

      <div className="space-y-8">
        {/* Company logo if present */}
        {data.company_logo && (
          <div className="mb-4">
            <img src={data.company_logo} alt="Company Logo" className="w-40 h-20 object-contain rounded-lg shadow-sm" />
          </div>
        )}
        {/* Personal Information */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField label="Name" value={data.name} />
            <InfoField label="Email" value={data.email} />
            <InfoField label="Phone Number" value={data.phoneNumber} />
            <InfoField label="Company Name" value={data.companyName} />
          </div>
        </section>

        {/* Job Details */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
            Job Details
          </h3>
          <div className="space-y-4">
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
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className="text-gray-800 mt-1">{value || 'Not provided'}</p>
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
        Back to Options
      </button>

      <div className="text-center mt-12 py-16">
        <div className="text-6xl mb-6">📭</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Data Not Available</h2>
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Options
        </button>
      </div>
    </div>
  );
}

// Component to view job applications received
function ViewJobApplications({ userId, onBack, hasJobPosting }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const perPage = 10;

  // If no job posting, show unavailable message
  if (!hasJobPosting) {
    return (
      <UnavailableData 
        message="Please post a job first to see applications from candidates."
        onBack={onBack}
      />
    );
  }

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/matching-job-seekers/${userId}`
      );
      const data = await response.json();
      
      if (data.matches) {
        setApplications(data.matches);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Error fetching matching seekers:', err);
      setError('Could not load matching candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-8 text-lg text-gray-600">Loading applications...</div>;
  if (error) return <div className="text-center mt-8 text-lg text-red-600">{error}</div>;
  if (!applications.length) return (
    <div className="text-center mt-8">
      <p className="text-lg text-gray-600 mb-4">No matching seekers found yet.</p>
      <button
        onClick={onBack}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Options
      </button>
    </div>
  );

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-800 font-medium flex items-center"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">Matching Job Seekers</h2>
      <p className="text-gray-600 mb-8">Found {applications.length} seeker(s) matching your job requirements</p>
      <div className="space-y-5">
        {applications.slice(page * perPage, (page + 1) * perPage).map((seeker, idx) => (
          <div key={idx} className="border-3 border-gradient rounded-xl overflow-hidden hover:shadow-lg transition bg-white">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b-3 border-blue-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{seeker.seeker_name}</h3>
                  <p className="text-lg text-gray-600 mt-1">📧 {seeker.seeker_email}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-600">{seeker.match_score}%</div>
                  <p className="text-sm text-gray-600 mt-1">Match Score</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <p className="text-sm font-semibold text-purple-600 mb-2">Skills Matched</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-600">{seeker.skills_count}</span>
                    <span className="text-gray-600">skills</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm font-semibold text-green-600 mb-2">Status</p>
                  <p className="text-lg font-bold text-green-600">Available</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls for provider */}
      {applications.length > perPage && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-lg border ${page === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Showing {(page * perPage) + 1} - {Math.min((page + 1) * perPage, applications.length)} of {applications.length}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(Math.floor((applications.length - 1) / perPage), p + 1))}
            disabled={(page + 1) * perPage >= applications.length}
            className={`px-4 py-2 rounded-lg border ${(page + 1) * perPage >= applications.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function JobProviderDashboard() {
  const navigate = useNavigate();
  const [jobPostingData, setJobPostingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('options'); // 'options', 'form', 'applications', 'view'
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userFromStorage = JSON.parse(localStorage.getItem('user'));
    if (!userFromStorage?.id) {
      alert('User session not found. Please login again.');
      navigate('/login');
      return;
    }
    setUser(userFromStorage);
    
    // Fetch user's existing job posting if any
    fetchJobPostingData(userFromStorage.id);
  }, [navigate]);

  const fetchJobPostingData = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/get-job-posting/${userId}`);
      const result = await response.json();
      if (result.posting) {
        setJobPostingData(result.posting);
      }
    } catch (error) {
      console.error('Error fetching job posting:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="text-center mt-20 text-lg text-gray-600">Loading...</div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/home')}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
          </div>

          {/* Header */}
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Provider Profile</h1>
            <p className="text-gray-600">Manage your job postings and view applications</p>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            
            {/* Tab Navigation */}
            {activeTab === 'options' && (
              <div className="space-y-5">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Job Provider Hub</h2>
                
                <div className="space-y-5">
                  {!jobPostingData ? (
                    <p className="text-gray-600 text-center text-lg mb-8">Welcome! Choose what you'd like to do:</p>
                  ) : (
                    <p className="text-gray-600 text-center text-lg mb-8">Welcome back! Choose what you'd like to do:</p>
                  )}
                  
                  {/* Post/Update Job Button */}
                  <button
                    onClick={() => navigate('/job-provider-form')}
                    className="w-full p-7 border-3 border-blue-400 rounded-xl hover:bg-blue-50 hover:border-blue-600 transition flex items-center justify-between group bg-gradient-to-r from-blue-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 mb-2">
                        {jobPostingData ? '✏️ Update Your Job Posting' : '📝 Post a Job Opening'}
                      </h3>
                      <p className="text-gray-600">
                        {jobPostingData ? 'Edit and improve your job listing' : 'Create a job posting and reach talented candidates'}
                      </p>
                    </div>
                  </button>

                  {/* View Job Posting Button */}
                  <button
                    onClick={() => setActiveTab('view')}
                    className="w-full p-7 border-3 border-green-400 rounded-xl hover:bg-green-50 hover:border-green-600 transition flex items-center justify-between group bg-gradient-to-r from-green-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-green-600 mb-2">
                        👁️ View Your Job Posting
                      </h3>
                      <p className="text-gray-600">Review your active job listing</p>
                    </div>
                  </button>

                  {/* View Applications Button */}
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="w-full p-7 border-3 border-purple-400 rounded-xl hover:bg-purple-50 hover:border-purple-600 transition flex items-center justify-between group bg-gradient-to-r from-purple-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 mb-2">
                        📬 View Job Applications
                      </h3>
                      <p className="text-gray-600">See applications from interested candidates</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Form View - Removed, opens in separate page */}

            {/* View Existing Job Posting */}
            {activeTab === 'view' && (
              jobPostingData ? (
                <ViewJobPosting 
                  data={jobPostingData}
                  onBack={() => setActiveTab('options')}
                />
              ) : (
                <UnavailableData 
                  message="You haven't posted a job yet. Please post one first to view your information."
                  onBack={() => setActiveTab('options')}
                />
              )
            )}

            {/* View Applications */}
            {activeTab === 'applications' && user && (
              <ViewJobApplications 
                userId={user.id}
                onBack={() => setActiveTab('options')}
                hasJobPosting={!!jobPostingData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
