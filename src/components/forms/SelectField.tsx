import React from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface Option {
  value: string | number;
  label: string;
}

export interface SelectFieldProps<T = Record<string, unknown>> {
  label: string;
  name: string;
  options: Option[];
  placeholder?: string;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  className?: string;
  valueAsNumber?: boolean;
}

export function SelectField<T = Record<string, unknown>>({
  label,
  name,
  options,
  placeholder = 'Select an option',
  register,
  error,
  required = false,
  className = '',
  valueAsNumber = false,
}: SelectFieldProps<T>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...register(name, valueAsNumber ? { valueAsNumber: true } : {})}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}