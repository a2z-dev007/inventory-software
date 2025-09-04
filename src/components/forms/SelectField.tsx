import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Controller, FieldError, Control, FieldValues } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api';


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
  isCreatable?: boolean;
}

export function SelectField<T extends FieldValues = FieldValues>({
  label,
  name,
  options: initialOptions,
  placeholder = 'Select an option',
  control,
  error,
  disabled,
  required = false,
  className = '',
  isCreatable = false,
}: SelectFieldProps<T>) {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const queryClient = useQueryClient();

  // keep options in sync with parent
  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  // mutation for creating new item
  const createMutation = useMutation({
    mutationFn: (payload: { title: string }) => apiService.createPurpose(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purposes"] });
    },
  });

  const handleCreate = async (inputValue: string, onChange: (value: string | number) => void) => {
    const newOption: Option = { value: inputValue, label: inputValue };
    setOptions(prev => [...prev, newOption]);

    // immediately set field value to the new one
    onChange(newOption.value);

    // call API to persist
    createMutation.mutate({ title: inputValue });
  };

  const SelectComponent = isCreatable ? CreatableSelect : Select;

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
          <SelectComponent
            {...field}
            inputId={name}
            options={options}
            placeholder={placeholder}
            isDisabled={disabled || createMutation.isPending}
            classNamePrefix="react-select"
            value={options.find(option => option.value === field.value) || null}
            onChange={option => field.onChange((option as Option)?.value)}
            onCreateOption={
              isCreatable
                ? (inputValue) => handleCreate(inputValue, field.onChange)
                : undefined
            }
            isClearable={!required}
            styles={{
              control: (base, state) => ({
                ...base,
                borderColor: error ? '#fca5a5' : base.borderColor,
                boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : base.boxShadow,
                '&:hover': { borderColor: '#3b82f6' },
                minHeight: '38px',
                opacity: createMutation.isPending ? 0.7 : 1, // UI feedback while saving
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
