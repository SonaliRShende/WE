import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, Plus } from 'lucide-react';
import Navbar from "../components/Navbar";
import JobSeekerApplication from './JobSeekerApplication';

// Component to view existing application
function ViewApplicationData({ data, onBack }) {
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-8 text-gray-600 hover:text-gray-800 font-medium flex items-center text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Options
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Job Seeker Profile</h2>
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
        Back to Options
      </button>

      <div className="text-center mt-12 py-16">
        <div className="text-6xl mb-6">📭</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Data Not Available</h2>
        <p className="text-lg text-gray-600 mb-8">{message}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium text-lg hover:underline"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Options
        </button>
      </div>
    </div>
  );
}

// Component to view job recommendations
function ViewJobRecommendations({ userId, onBack, hasApplicationData }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const perPage = 10;

  // If no application data, show unavailable message
  if (!hasApplicationData) {
    return (
      <UnavailableData 
        message="Please fill out your profile first to see job recommendations tailored for you."
        onBack={onBack}
      />
    );
  }

  useEffect(() => {
    fetchJobRecommendations();
  }, [userId]);

  const fetchJobRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://127.0.0.1:5000/api/job-recommendations/${userId}`
      );
      const data = await response.json();
      
      if (data.ranked_jobs) {
        setRecommendations(data.ranked_jobs);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Could not load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-8 text-lg text-gray-600">🔄 Loading recommendations...</div>;
  if (error) return <div className="text-center mt-8 text-lg text-red-600">❌ {error}</div>;
  if (!recommendations.length) return (
    <div className="text-center mt-12">
      <p className="text-lg text-gray-600 mb-6">No job matches found yet.</p>
      <p className="text-gray-500 mb-8">Try filling out your profile with more details to get better matches!</p>
      <button
        onClick={onBack}
        className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Options
      </button>
    </div>
  );

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-8 text-gray-600 hover:text-gray-800 font-medium flex items-center text-lg"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Options
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Your Matched Job Opportunities</h2>
      <p className="text-gray-600 mb-8 text-lg">Found {recommendations.length} job(s) matching your profile</p>
      
      <div className="space-y-5">
        {recommendations.slice(page * perPage, (page + 1) * perPage).map((job, idx) => (
          <div key={idx} className="border-3 border-gradient rounded-xl overflow-hidden hover:shadow-lg transition bg-white">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-3 border-purple-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{job.job_title}</h3>
                  <p className="text-lg text-gray-600 mt-1">🏢 {job.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-600">{(job.job_score * 100).toFixed(0)}%</div>
                  <p className="text-sm text-gray-600 mt-1">Overall Match</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm font-semibold text-blue-600 mb-2">Skills Match</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">{(job.skill_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <p className="text-sm font-semibold text-green-600 mb-2">Constraints Match</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-600">{(job.constraint_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {recommendations.length > perPage && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-lg border ${page === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Showing {(page * perPage) + 1} - {Math.min((page + 1) * perPage, recommendations.length)} of {recommendations.length}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(Math.floor((recommendations.length - 1) / perPage), p + 1))}
            disabled={(page + 1) * perPage >= recommendations.length}
            className={`px-4 py-2 rounded-lg border ${(page + 1) * perPage >= recommendations.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function JobSeekerDashboard() {
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('options'); // 'options', 'form', 'results', 'view'
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
    
    // Fetch user's existing job seeker application if any
    fetchApplicationData(userFromStorage.id);
  }, [navigate]);

  const fetchApplicationData = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/get-job-seeker-application/${userId}`);
      const result = await response.json();
      if (result.application) {
        setApplicationData(result.application);
      }
    } catch (error) {
      console.error('Error fetching application:', error);
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
              className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
          </div>

          {/* Header */}
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Job Seeker Profile</h1>
            <p className="text-gray-600">Manage your job applications and explore opportunities</p>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow-xl rounded-2xl p-8">
            
            {/* Tab Navigation */}
            {activeTab === 'options' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Job Seeker Hub</h2>
                
                <div className="space-y-5">
                  {!applicationData ? (
                    <p className="text-gray-600 text-center text-lg mb-8">Welcome! Choose what you'd like to do:</p>
                  ) : (
                    <p className="text-gray-600 text-center text-lg mb-8">Welcome back! Choose what you'd like to do:</p>
                  )}
                  
                  {/* Fill/Update Profile Button */}
                  <button
                    onClick={() => navigate('/job-seeker-form')}
                    className="w-full p-7 border-3 border-pink-400 rounded-xl hover:bg-pink-50 hover:border-pink-600 transition flex items-center justify-between group bg-gradient-to-r from-pink-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-pink-600 mb-2">
                        {applicationData ? ' Update Your Profile' : ' Fill Your Job Seeker Profile'}
                      </h3>
                      <p className="text-gray-600">
                        {applicationData ? 'Edit and improve your job seeker profile' : 'Create your profile with your skills, experience, and preferences'}
                      </p>
                    </div>
                  </button>

                  {/* View Profile Button */}
                  <button
                    onClick={() => setActiveTab('view')}
                    className="w-full p-7 border-3 border-green-400 rounded-xl hover:bg-green-50 hover:border-green-600 transition flex items-center justify-between group bg-gradient-to-r from-green-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-green-600 mb-2">
                        View Your Profile
                      </h3>
                      <p className="text-gray-600">Review your saved job seeker profile</p>
                    </div>
                  </button>

                  {/* View Matched Jobs Button */}
                  <button
                    onClick={() => setActiveTab('results')}
                    className="w-full p-7 border-3 border-purple-400 rounded-xl hover:bg-purple-50 hover:border-purple-600 transition flex items-center justify-between group bg-gradient-to-r from-purple-50 to-transparent"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 mb-2">
                        View Matched Jobs
                      </h3>
                      <p className="text-gray-600">See jobs recommended based on your profile</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Form View - Removed, opens in separate page */}

            {/* View Existing Application */}
            {activeTab === 'view' && (
              applicationData ? (
                <ViewApplicationData 
                  data={applicationData}
                  onBack={() => setActiveTab('options')}
                />
              ) : (
                <UnavailableData 
                  message="You haven't filled out your profile yet. Please fill it first to view your information."
                  onBack={() => setActiveTab('options')}
                />
              )
            )}

            {/* Results View */}
            {activeTab === 'results' && user && (
              <ViewJobRecommendations 
                userId={user.id}
                onBack={() => setActiveTab('options')}
                hasApplicationData={!!applicationData}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
