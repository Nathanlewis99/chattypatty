"use client";

import Select from "react-select";

const darkStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#1f2937",   // gray-800
    borderColor: "#4b5563",       // gray-600
    color: "#ffffff",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#ffffff",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#1f2937",
    color: "#ffffff",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#374151" : "#1f2937", // gray-700 on hover
    color: "#ffffff",
    cursor: "pointer",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#d1d5db",  // gray-300
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "#4b5563",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",  // gray-400
  }),
};

export default function LanguageSelector({
  label,
  options = [],        // ← default to empty array
  value,
  onChange,
  disabled = false,    // ← accept disabled
}) {
  const selected = options.find((opt) => opt.value === value) || null;

  return (
    <div className="flex flex-col">
      <span className="mb-1 font-medium text-white">{label}</span>
      <Select
        styles={darkStyles}
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt?.value)}
        isSearchable
        isDisabled={disabled}
        placeholder={`Select ${label.toLowerCase()}…`}
        className="w-full"
        theme={(theme) => ({
          ...theme,
          borderRadius: 4,
          colors: {
            ...theme.colors,
            primary25: "#374151",  // option hover bg
            primary: "#3b82f6",    // selected border/indicator
          },
        })}
      />
    </div>
  );
}
