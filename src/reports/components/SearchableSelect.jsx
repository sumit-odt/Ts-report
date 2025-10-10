import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

const SearchableSelect = React.memo(function SearchableSelect({
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
  const [dropdownStyle, setDropdownStyle] = useState({});
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
    if (!editable) {
      // For non-editable, just store the value
      setSearchTerm(value || "");
    } else {
      // For editable, update only if significantly different
      if (value !== searchTerm) {
        setSearchTerm(value || "");
      }
    }
  }, [value, editable]);

  const filteredOptions = useMemo(
    () =>
      searchable && editable
        ? options.filter(
            (option) =>
              option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              option.value.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options,
    [options, searchTerm, searchable, editable]
  );

  const handleInputChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      if (editable || searchable) {
        setSearchTerm(newValue);
        if (editable) {
          onChange(newValue);
        }
        if (!isOpen) {
          setIsOpen(true);
        }
      }
    },
    [editable, searchable, onChange, isOpen]
  );

  const handleSelectOption = useCallback(
    (option) => {
      if (editable) {
        setSearchTerm(option.label);
      } else {
        setSearchTerm(option.value);
      }
      onChange(option.value);
      setIsOpen(false);
    },
    [onChange, editable]
  );

  const calculateDropdownPosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const estimatedHeight = Math.min(filteredOptions.length * 40, 288); // 40px per option

      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
        setDropdownStyle({
          position: "fixed",
          bottom: `${window.innerHeight - rect.top + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        });
      } else {
        setDropdownPosition("bottom");
        setDropdownStyle({
          position: "fixed",
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        });
      }
    }
  }, [filteredOptions.length]);

  const handleButtonClick = useCallback(() => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  }, [isOpen, calculateDropdownPosition]);

  const getDisplayValue = useCallback(() => {
    if (!editable) {
      const selected = options.find((opt) => opt.value === value);
      return selected ? selected.label : placeholder || "Select...";
    }
    return searchTerm;
  }, [editable, options, value, placeholder, searchTerm]);

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

      {isOpen &&
        filteredOptions.length > 0 &&
        createPortal(
          <div
            className="bg-white rounded-lg shadow-lg border border-slate-200"
            style={{
              ...dropdownStyle,
              zIndex: 9999,
              maxHeight: filteredOptions.length > 8 ? "288px" : "auto",
              overflowY: filteredOptions.length > 8 ? "auto" : "visible",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm block first:rounded-t-lg last:rounded-b-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectOption(option);
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}

      {isOpen && editable && searchTerm && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
          No matching fields found
        </div>
      )}
    </div>
  );
});

export default SearchableSelect;
