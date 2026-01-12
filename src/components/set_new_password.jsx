// src/components/SetNewPassword.jsx
import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkDoneCircle, IoEye, IoEyeOff } from "react-icons/io5";
import Loader from "../pages/Loader";

const SetNewPassword = ({ resetToken, onCancel }) => {
  const navigate = useNavigate();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => setToastVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const payload = {
      new_password: values.newPassword,
      confirm_password: values.confirmPassword,
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/accounts/auth/admin-password-reset/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setToastMessage("Password reset successful!");
        setToastType("success");
        setToastVisible(true);
        setShowLoader(true);
        setTimeout(() => {
          setShowLoader(false);
          navigate("/login");
        }, 2000);
      } else {
        const data = await res.json();
        setToastMessage(data.detail || "Failed to reset password.");
        setToastType("error");
        setToastVisible(true);
      }
    } catch (err) {
      console.error(err);
      setToastMessage("An error occurred. Please try again.");
      setToastType("error");
      setToastVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-center mb-4">
          <IoCheckmarkDoneCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2">Set New Password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Please enter your new password.
        </p>

        <Formik
          initialValues={{ newPassword: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
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
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.newPassword && touched.newPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? (
                      <IoEyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <IoEye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.newPassword && touched.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword && touched.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <IoEyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <IoEye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Setting..." : "Set Password"}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50">
          <p>{toastMessage}</p>
        </div>
      )}

      {/* Loader */}
      {showLoader && <Loader />}
    </div>
  );
};

export default SetNewPassword;
