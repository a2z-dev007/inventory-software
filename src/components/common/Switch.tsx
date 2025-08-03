import React from 'react';

const Switch = ({
  name,
  label = 'Toggle me',
  checked = false,
  disabled = false,
  title = '',
  onChange = () => {},
}) => {
  return (
    <label
      htmlFor={name}
      className={`inline-flex items-center cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-checked={checked}
        aria-label={label}
        title={title || label}
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500"></div>
      <span className="ms-3 text-sm font-medium text-gray-900 ">
        {label}
      </span>
    </label>
  );
};

export default Switch;
