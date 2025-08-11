import React from 'react';
import Select from 'react-select';
import { Controller, FieldError, Control, FieldValues } from 'react-hook-form';

interface Option {
  value: string | number;
  label: string;
}

export interface SelectFieldProps<T extends FieldValues = FieldValues> {
  label: string;
  name: string;
  options: Option[];
  placeholder?: string;
  control: Control<T>;
  error?: FieldError;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectField<T extends FieldValues = FieldValues>({
  label,
  name,
  options,
  placeholder = 'Select an option',
  control,
  error,
  disabled,
  required = false,
  className = '',
}: SelectFieldProps<T>) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            inputId={name}
            options={options}
            placeholder={placeholder}
            isDisabled={disabled}
            classNamePrefix="react-select"
            value={options.find(option => option.value === field.value) || null}
            onChange={option => field.onChange((option as Option)?.value)}
            isClearable={!required}
            styles={{
              control: (base, state) => ({
                ...base,
                borderColor: error ? '#fca5a5' : base.borderColor,
                boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : base.boxShadow,
                '&:hover': { borderColor: '#3b82f6' },
                minHeight: '38px',
              }),
            }}
          />
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      )}
    </div>
  );
}