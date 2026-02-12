import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobSeekerApplication from './JobSeekerApplication';

export default function JobSeekerFormPage() {
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
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
    <div className="text-center mt-20 text-lg text-gray-600">Loading...</div>
  );

  return (
    <JobSeekerApplication 
      existingData={applicationData}
      onSuccess={() => {
        // Show success and navigate back to dashboard
        setTimeout(() => {
          navigate('/job-seeker-dashboard');
        }, 1500);
      }}
    />
  );
}
