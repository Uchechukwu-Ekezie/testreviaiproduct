"use client";

import { useState, useEffect } from "react";

interface PriceRangeInputProps {
  value: string;
  onChange: (priceRange: string) => void;
  placeholder?: string;
  className?: string;
}

const PriceRangeInput = ({
  value,
  onChange,
  placeholder = "Enter price range...",
  className = "",
}: PriceRangeInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Predefined price range suggestions
  const priceSuggestions = [
    "₦50,000 - ₦100,000",
    "₦100,000 - ₦250,000",
    "₦250,000 - ₦500,000",
    "₦500,000 - ₦1,000,000",
    "₦1,000,000 - ₦2,000,000",
    "₦2,000,000 - ₦5,000,000",
    "₦5,000,000+",
  ];

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Price input changed

    // Always show suggestions when typing, even if empty
    setShowSuggestions(true);
    // console.log("Showing suggestions");
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    // console.log("Price suggestion selected:", suggestion);
    setInputValue(suggestion);
    setShowSuggestions(false);
    onChange(suggestion);
  };

  // Handle input blur
  const handleInputBlur = () => {
    // console.log("Price input blurred");
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 300); // Increased delay to allow suggestion click
  };

  // Handle input focus
  const handleInputFocus = () => {
    // console.log("Price input focused");
    setShowSuggestions(true);
  };

  // Format number with commas
  const formatNumber = (num: string) => {
    // Remove all non-digits
    const digits = num.replace(/\D/g, "");
    if (!digits) return "";

    // Add commas for thousands
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle special formatting for Nigerian Naira
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;

    // Auto-format as user types numbers
    if (/^\d/.test(value) && !value.includes("₦")) {
      const formatted = formatNumber(value);
      if (formatted) {
        const newValue = `₦${formatted}`;
        setInputValue(newValue);
        onChange(newValue);
      }
    }
  };

  // Filter suggestions based on input
  const filteredSuggestions = priceSuggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) ||
      inputValue.length === 0
  );

  // console.log(
  //   "Filtered suggestions:",
  //   filteredSuggestions,
  //   "Show suggestions:",
  //   showSuggestions
  // );

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className="w-full bg-transparent text-white border rounded-[15px] border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 placeholder:text-white/50"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent the input from losing focus
                handleSuggestionSelect(suggestion);
              }}
              className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#FFD700] text-sm">₦</span>
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}

          {/* Custom input hint */}
          {inputValue &&
            !filteredSuggestions.some(
              (s) => s.toLowerCase() === inputValue.toLowerCase()
            ) && (
              <div className="px-4 py-2 text-xs text-white/50 border-t border-white/10">
                💡 Tip: You can type custom amounts (e.g. &ldquo;50000&rdquo;
                becomes &ldquo;₦50,000&rdquo;)
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PriceRangeInput;
