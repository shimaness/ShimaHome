"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Fade out after 3 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Navigate after fade completes
      setTimeout(() => {
        // Get role from cookie
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(c => c.trim().startsWith('userRole='));
        const role = roleCookie?.split('=')[1];
        
        if (role === "LANDLORD") {
          router.push("/landlord/dashboard");
        } else {
          router.push("/discover");
        }
      }, 800);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center space-y-6 px-6">
        {/* Animated Logo */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <svg
              className="w-24 h-24 mx-auto text-white animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg animate-fade-in">
            Welcome to ShimaHome
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light animate-fade-in-delay">
            Your trusted home discovery platform
          </p>
        </div>

        {/* Animated Features */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-up">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-white text-sm font-medium">Secure & Verified</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-up delay-100">
            <div className="text-3xl mb-2">🏠</div>
            <div className="text-white text-sm font-medium">Quality Homes</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-slide-up delay-200">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-white text-sm font-medium">Instant Matching</div>
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s both;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
