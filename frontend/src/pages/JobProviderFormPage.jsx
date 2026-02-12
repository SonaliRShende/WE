import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobProviderApplication from './JobProviderApplication';

export default function JobProviderFormPage() {
  const navigate = useNavigate();
  const [jobPostingData, setJobPostingData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <div className="text-center mt-20 text-lg text-gray-600">Loading...</div>
  );

  return (
    <JobProviderApplication 
      existingData={jobPostingData}
      onSuccess={() => {
        // Show success and navigate back to dashboard
        setTimeout(() => {
          navigate('/job-provider-dashboard');
        }, 1500);
      }}
    />
  );
}
