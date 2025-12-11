import { Download, FileSpreadsheet } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export const LoadingModal = ({
  isOpen,
  title = 'Generating Report',
  message = 'Please wait while we prepare your Excel report...',
}: LoadingModalProps) => {
  useBodyScrollLock(isOpen);
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fadeIn" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-md pointer-events-auto transform transition-all duration-300 ease-out animate-scaleIn">
          {/* Main modal container */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className="h-2 bg-gradient-to-r from-blue-500 to-emerald-500" />
            
            {/* Content */}
            <div className="px-8 py-8 text-center">
              {/* Animated loading icon */}
              <div className="relative mx-auto w-20 h-20 mb-6">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                
                {/* Inner icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-blue-50 rounded-full p-3">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {title}
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-sm mx-auto">
                {message}
              </p>

              {/* Animated progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 animate-bounce" />
                  <span className="font-medium">Preparing your download...</span>
                </div>
              </div>

              {/* Dots animation */}
              <div className="flex justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        .animate-fadeIn { 
          animation: fadeIn 0.3s ease-out; 
        }
        @keyframes scaleIn { 
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(-10px); 
          } 
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          } 
        }
        .animate-scaleIn { 
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};