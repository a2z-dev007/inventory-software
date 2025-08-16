import { useEffect, useState } from "react";

const WelcomeLoader = ({ onLoadingComplete, showLoader = true }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(showLoader);

  const loadingSteps = [
    "Initializing system...",
    "Loading inventory data...",
    "Setting up dashboard...",
    "Preparing workspace...",
    "Almost ready..."
  ];

  useEffect(() => {
    if (!showLoader) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5;
        
        // Update current step based on progress
        const stepIndex = Math.min(
          Math.floor((newProgress / 100) * loadingSteps.length),
          loadingSteps.length - 1
        );
        setCurrentStep(stepIndex);

        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          }, 800);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [showLoader, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        {/* Logo/Brand area */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm mb-6 border border-white border-opacity-20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l3 3 3-3" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Wings Procurement
          </h1>
          <h2 className="text-2xl md:text-3xl font-light text-blue-200 mb-2">
            Management
          </h2>
          <p className="text-lg text-blue-100 opacity-80">
            Inventory Management System
          </p>
        </div>

        {/* Lottie Animation Container */}
        <div className="mb-8">
          <div className="w-48 h-48 mx-auto bg-white bg-opacity-5 rounded-3xl backdrop-blur-sm border border-white border-opacity-10 flex items-center justify-center">
            {/* Placeholder for Lottie animation - replace this div with your Lottie component */}
            <div className="animate-spin">
              <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading progress */}
        <div className="mb-8">
          <div className="bg-white bg-opacity-10 rounded-full h-2 backdrop-blur-sm border border-white border-opacity-20 overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm text-blue-200 mb-3">
            <span>{Math.round(progress)}%</span>
            <span className="font-medium">Loading...</span>
          </div>
          
          <p className="text-white font-medium text-lg min-h-[28px] transition-all duration-500">
            {loadingSteps[currentStep]}
          </p>
        </div>

        {/* Welcome message */}
        <div className="text-center">
          <p className="text-blue-100 text-lg opacity-90">
            Welcome to your inventory management dashboard
          </p>
          <p className="text-blue-200 text-sm mt-2 opacity-70">
            Setting up everything for you...
          </p>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animation: `float 6s ease-in-out infinite`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-40px) rotate(180deg); }
          75% { transform: translateY(-20px) rotate(270deg); }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
export default WelcomeLoader