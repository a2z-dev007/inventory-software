// ControlledFormField.tsx
import React from 'react';
import { FieldError } from 'react-hook-form';

interface ControlledFormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ControlledFormField: React.FC<ControlledFormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  value,
  onChange,
}) => {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};