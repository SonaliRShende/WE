import React from "react";
import { useNavigate } from "react-router-dom";
import jobSeekerImg from "../assets/job-seeker.jpg";
import jobProviderImg from "../assets/job-provider.jpg";
import Navbar from "../components/Navbar";

export default function Home() {
  const navigate = useNavigate();

  const handleJobSeekerClick = () => {
    navigate('/job-seeker-dashboard');
  };

  const handleJobProviderClick = () => {
    navigate('/job-provider-dashboard');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 px-4 py-8">
        
        {/* Header Section */}
        <div className="text-center mb-16 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Step Into Your Power
          </h1>
          <p className="text-slate-600 text-xl md:text-2xl leading-relaxed">
            Choose your path forward and elevate your journey with opportunities that matter
          </p>
        </div>

        {/* Cards Container */}
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
          
          {/* Job Seeker Card */}
          <button 
            onClick={handleJobSeekerClick}
            className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer text-left w-full"
          >
            <div className="absolute inset-0 bg-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
            
            <div className="relative p-12 md:p-16 flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-48 h-48 md:w-64 md:h-64 mb-8 rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={jobSeekerImg} 
                  alt="Find Job" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Unlock Opportunities
                </h2>
                <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-md">
                  Discover flexible jobs tailored for your lifestyle and skills. Start your journey today.
                </p>
                
                <div className="pt-6">
                  <span className="inline-flex items-center text-pink-600 font-semibold text-lg group-hover:gap-3 gap-2 transition-all duration-300">
                    Explore Jobs
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Job Provider Card */}
          <button 
            onClick={handleJobProviderClick}
            className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 cursor-pointer text-left w-full"
          >
            <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
            
            <div className="relative p-12 md:p-16 flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-48 h-48 md:w-64 md:h-64 mb-8 rounded-2xl overflow-hidden shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                <img 
                  src={jobProviderImg} 
                  alt="Give Job" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  Empower Through Employment
                </h2>
                <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-md">
                  Post job openings and uplift women by offering real-world roles that make a difference.
                </p>
                
                <div className="pt-6">
                  <span className="inline-flex items-center text-blue-600 font-semibold text-lg group-hover:gap-3 gap-2 transition-all duration-300">
                    Post a Job
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </button>

        </div>

        {/* Optional Footer Text */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Join thousands of empowered individuals shaping their future
          </p>
        </div>

      </div>
    </>
  );
}