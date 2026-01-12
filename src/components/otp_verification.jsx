// src/components/OTPVerification.jsx
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Lock } from "lucide-react";

const OTPVerification = ({ isOpen, onClose, onSuccess }) => {
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setPinDigits(["", "", "", "", "", ""]);
      setPinError("");
      setApiError("");
      // focus first input when component mounts
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleDigitChange = (idx, val) => {
    if (/^[0-9]?$/.test(val)) {
      const newDigits = [...pinDigits];
      newDigits[idx] = val;
      setPinDigits(newDigits);
      if (val && idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = pinDigits.join("");
    if (otpCode.length < 6) {
      setPinError("Please enter a valid 6-digit OTP code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/accounts/auth/password-reset/admin-reset-verify-otp/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: otpCode }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const token = data.token;
        if (token) {
          setApiError("");
          onSuccess(token);
        } else {
          setApiError("Invalid OTP. Please try again.");
        }
      } else {
        const data = await res.json();
        setApiError(data.detail || "Failed to verify OTP.");
      }
    } catch (err) {
      console.error(err);
      setApiError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-center mb-4">
          <Lock className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">Verify OTP</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please enter the 6-digit OTP code sent to your email.
        </p>

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-2 mb-4">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  pinError ? "border-red-500" : "border-gray-300"
                }`}
                pattern="[0-9]"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            ))}
          </div>
          {pinError && <p className="text-red-500 text-sm text-center mb-4">{pinError}</p>}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

OTPVerification.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default OTPVerification;
