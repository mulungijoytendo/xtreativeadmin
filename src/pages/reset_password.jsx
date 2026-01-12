// src/components/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { IoLockClosed } from "react-icons/io5";
import resetImage from "../assets/reset_pass.jpeg";
import OTPVerification from "../components/otp_verification";
import SetNewPassword from "../components/set_new_password";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [showSetNew, setShowSetNew] = useState(false);
  const [resetToken, setResetToken] = useState("");

  // On mount, check sessionStorage for existing token
  useEffect(() => {
    const storedToken = sessionStorage.getItem("resetToken");
    if (storedToken) {
      setResetToken(storedToken);
      setShowSetNew(true);
    }
  }, []);

  // Validation schema for email
  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email address").required("Email is required"),
  });

  // 1) Request OTP
  const handleReset = async (values, { setSubmitting }) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/accounts/auth/password-reset/request/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        }
      );

      if (res.ok) {
        setMessage("OTP sent to your email.");
        setOtpStep(true);
        setError("");
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 2) Verify OTP and get token
  const handleOtpSuccess = (token) => {
    setResetToken(token);
    sessionStorage.setItem("resetToken", token);
    setShowSetNew(true);
  };

  // 3) Set new password
  const handleSetNewPassword = async (values, { setSubmitting }) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/accounts/auth/admin-password-reset/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: resetToken,
            new_password: values.password,
            confirm_password: values.confirmPassword,
          }),
        }
      );

      if (res.ok) {
        setMessage("Password reset successful. You can now log in.");
        setError("");
        // Clear token from sessionStorage
        sessionStorage.removeItem("resetToken");
        // Redirect to login after a short delay
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={resetImage} alt="Reset Password" className="h-16 w-16" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Reset Password
        </h2>
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        {!otpStep && !showSetNew && (
          <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={handleReset}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email && touched.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send OTP"}
                </button>
              </form>
            )}
          </Formik>
        )}
        {otpStep && !showSetNew && (
          <OTPVerification onSuccess={handleOtpSuccess} />
        )}
        {showSetNew && (
          <SetNewPassword
            token={resetToken}
            onSuccess={() => {
              setMessage("Password reset successful. You can now log in.");
              setTimeout(() => navigate("/login"), 2000);
            }}
            onError={(err) => setError(err)}
          />
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
