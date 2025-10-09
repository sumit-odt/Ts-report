import React, { useState, useRef, useEffect } from "react";

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  editable = true, // Allow typing custom values
  searchable = true, // Allow searching through options
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [dropdownPosition, setDropdownPosition] = useState("bottom"); // "bottom" or "top"
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const filteredOptions =
    searchable && editable
      ? options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (editable || searchable) {
      setSearchTerm(newValue);
      if (editable) {
        onChange(newValue);
      }
      setIsOpen(true);
    }
  };

  const handleSelectOption = (option) => {
    setSearchTerm(option.label);
    onChange(option.value);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const calculateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240; // Approximate max height

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  };

  const getDisplayValue = () => {
    if (!editable) {
      const selected = options.find((opt) => opt.value === value);
      return selected ? selected.label : placeholder || "Select...";
    }
    return searchTerm;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {editable ? (
        <input
          ref={inputRef}
          type="text"
          className="input w-full"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            calculateDropdownPosition();
            setIsOpen(true);
          }}
          placeholder={placeholder || "Select or type..."}
        />
      ) : (
        <button
          type="button"
          className="input w-full text-left flex items-center justify-between"
          onClick={handleButtonClick}
        >
          <span className={value ? "" : "text-slate-400"}>
            {getDisplayValue()}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {isOpen && filteredOptions.length > 0 && (
        <div
          className={`absolute z-50 w-full bg-white rounded-lg shadow-lg border border-slate-200 ${
            dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
          style={{
            maxHeight: filteredOptions.length > 8 ? "288px" : "auto",
            overflowY: filteredOptions.length > 8 ? "auto" : "visible",
          }}
        >
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
              onClick={() => handleSelectOption(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {isOpen && editable && searchTerm && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
          No matching fields found
        </div>
      )}
    </div>
  );
}
