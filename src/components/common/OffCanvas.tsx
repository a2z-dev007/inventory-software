import React, { useEffect } from 'react';

const OffCanvas = ({
  isOpen,
  onClose,
  position = 'right', // 'left' | 'right' | 'bottom'
  size = 'md', // 'sm' | 'md' | 'lg' | or Tailwind class
  title = '',
  children,
  showClose = true,
  footer = null,
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: position === 'bottom' ? 'h-64' : 'w-64',
    md: position === 'bottom' ? 'h-96' : 'w-96',
    lg: position === 'bottom' ? 'h-[600px]' : 'w-[600px]',
  }[size] || size;

  const positionClass = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 w-full',
  }[position];

  const transitionClass = {
    left: 'translate-x-[-100%]',
    right: 'translate-x-full',
    bottom: 'translate-y-full',
  }[position];

  const activeTransform = 'translate-x-0 translate-y-0';

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed bg-white shadow-lg transition-transform duration-300 ease-in-out
          ${positionClass} ${sizeClass}
          ${isOpen ? activeTransform : transitionClass}
        `}
        style={{ willChange: 'transform' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            {showClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-black">
                ✕
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4">{children}</div>

          {/* Footer */}
          {footer && <div className="p-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default OffCanvas;
