import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: number,
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  register,
  error,
  min,
  disabled = false,
  required = false,
  className = '',
  inputProps = {},
}) => {
  const registerOptions =
    type === 'number'
      ? { valueAsNumber: true }
      : type === 'file'
        ? {}
        : undefined;

  const commonProps = {
    id: name,
    placeholder,
    disabled,
    className: `w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-300' : 'border-gray-300'
      }`,
    ...register(name, registerOptions),
    ...inputProps,
  };

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea rows={4} {...commonProps} />
      ) : (
        <input min={min} type={type} {...commonProps} />
      )}
      {
        type === "radio" ?
          <input type="radio" {...commonProps} className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={inputProps.value} />
          : null

      }

      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
};
