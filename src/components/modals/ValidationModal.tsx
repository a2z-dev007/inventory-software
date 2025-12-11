import { AlertTriangle, X, CheckCircle, Info, XCircle } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEffect } from 'react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const colorMap = {
  error: {
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    accent: 'bg-red-500',
  },
  warning: {
    gradient: 'from-yellow-500 to-orange-500',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    accent: 'bg-yellow-500',
  },
  success: {
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
    button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    accent: 'bg-green-500',
  },
  info: {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-gray-900',
    messageColor: 'text-gray-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    accent: 'bg-blue-500',
  },
};

export const ValidationModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}: ValidationModalProps) => {
  useBodyScrollLock(isOpen);
  
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-md pointer-events-auto transform transition-all duration-300 ease-out animate-scaleIn">
          {/* Main modal container */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Gradient header */}
            <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Icon and title section */}
              <div className="flex items-start gap-4 mb-4">
                {/* Icon container */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-full ${colors.iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className={`h-7 w-7 ${colors.iconColor}`} />
                </div>

                {/* Title and message */}
                <div className="flex-1 pt-1">
                  <h3 className={`text-xl font-bold ${colors.titleColor} mb-2 leading-tight`}>
                    {title}
                  </h3>
                  <p className={`text-sm ${colors.messageColor} leading-relaxed`}>
                    {message}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 mt-8">
                {onConfirm && (
                  <button
                    onClick={onClose}
                    className="px-5 btn-block py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm || onClose}
                  className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${colors.button}`}
                >
                  {confirmText}
                </button>
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
      `}</style>
    </>
  );
};