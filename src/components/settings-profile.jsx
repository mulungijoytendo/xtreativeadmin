import React, { useState, useRef, useEffect, useContext } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { IoMailOutline, IoLockClosed, IoCheckmarkCircle, IoGlobeOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CurrencyContext } from "../context/currencycontext";

const TABS = ["Wallet Security", "Localization"];

// Validation schemas
const emailSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

const pinSchema = Yup.object().shape({
  currentPin: Yup.string().length(4, "PIN must be 4 digits").required("Current PIN is required"),
  newPin: Yup.string().length(4, "PIN must be 4 digits").required("New PIN is required"),
  confirmPin: Yup.string()
    .oneOf([Yup.ref("newPin"), null], "PINs must match")
    .required("Please confirm your new PIN"),
});

const SettingsProfile = () => {
  const {
    currency,
    country,
    setManualCurrency,
    setManualCountry,
    resetToAutoCurrency,
    loading,
    error,
  } = useContext(CurrencyContext);

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [step, setStep] = useState("intro");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const inputRefs = useRef([]);

  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  const countryCurrencyMap = {
    Uganda: "UGX",
    Rwanda: "RWF",
    Kenya: "KES",
    "United States": "USD",
    Unknown: "USD",
  };

  const countries = Object.keys(countryCurrencyMap);
  const currencies = ["USD", "UGX", "RWF", "KES"];

  useEffect(() => {
    if (step === "otp") {
      setOtpDigits(Array(6).fill(""));
      setOtpError("");
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
  }, [step]);

  useEffect(() => {
    setSelectedCountry(country);
    setSelectedCurrency(currency);
  }, [country, currency]);

  const handleEmailSubmit = (values, { setSubmitting }) => {
    setTimeout(() => {
      setSubmitting(false);
      setStep("otp");
      toast.success("OTP sent to your email");
    }, 800);
  };

  const handleDigitChange = (idx, val) => {
    if (/^[0-9]?$/.test(val)) {
      const newDigits = [...otpDigits];
      newDigits[idx] = val;
      setOtpDigits(newDigits);
      if (val && idx < 5) {
        inputRefs.current[idx + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    setSettingsLoading(true);
    setTimeout(() => {
      setSettingsLoading(false);
      setStep("pin");
      toast.success("OTP verified successfully");
    }, 800);
  };

  const handlePinSubmit = (values, { setSubmitting, resetForm }) => {
    setTimeout(() => {
      setSubmitting(false);
      resetForm();
      setStep("intro");
      toast.success("Wallet PIN updated successfully!");
    }, 800);
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    setManualCountry(newCountry);
    toast.success(`Country set to ${newCountry}`);
  };

  const handleCurrencyChange = (e) => {
    const newCurr = e.target.value;
    setSelectedCurrency(newCurr);
    setManualCurrency(newCurr);
    toast.success(`Currency set to ${newCurr}`);
  };

  const handleReset = () => {
    resetToAutoCurrency();
    toast.info("Reset to GPS-detected currency");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account security and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setStep("intro");
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "text-[#f9622c] border-b-2 border-[#f9622c] bg-orange-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {idx === 0 ? <IoLockClosed size={18} /> : <IoGlobeOutline size={18} />}
                  {tab}
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Wallet Security Tab */}
            {activeTab === "Wallet Security" && (
              <div className="max-w-2xl mx-auto">
                {step === "intro" && (
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                      <IoLockClosed size={32} className="text-[#f9622c]" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Change Wallet PIN
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6 text-left">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Protect your business funds by updating your 4-digit wallet PIN. We'll verify 
                        your identity through email before allowing any changes. This ensures only you 
                        can modify your security settings.
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <IoCheckmarkCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
                          <span className="text-sm text-gray-600">Email verification required</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <IoCheckmarkCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
                          <span className="text-sm text-gray-600">Old PIN deactivated immediately</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <IoCheckmarkCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
                          <span className="text-sm text-gray-600">Secure transaction protection</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep("email")}
                      className="px-8 py-3 bg-[#f9622c] text-white text-sm font-medium rounded-lg hover:bg-[#e5531a] transition-colors duration-200 shadow-sm"
                    >
                      Continue to Verification
                    </button>
                  </div>
                )}

                {step === "email" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <IoMailOutline size={32} className="text-[#f9622c]" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Verify Your Email
                      </h2>
                      <p className="text-sm text-gray-600">
                        Enter your email address to receive a verification code
                      </p>
                    </div>
                    <Formik
                      initialValues={{ email: "" }}
                      validationSchema={emailSchema}
                      onSubmit={handleEmailSubmit}
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
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              name="email"
                              placeholder="your.email@company.com"
                              value={values.email}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all"
                            />
                            {touched.email && errors.email && (
                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <span>⚠</span> {errors.email}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setStep("intro")}
                              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm transition-colors"
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 py-3 bg-[#f9622c] text-white rounded-lg font-medium hover:bg-[#e5531a] text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSubmitting ? "Sending..." : "Send OTP"}
                            </button>
                          </div>
                        </form>
                      )}
                    </Formik>
                  </div>
                )}

                {step === "otp" && (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <IoLockClosed size={32} className="text-[#f9622c]" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Enter Verification Code
                      </h2>
                      <p className="text-sm text-gray-600">
                        We've sent a 6-digit code to your email
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-12 h-12 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:border-[#f9622c] focus:outline-none transition-colors"
                          disabled={settingsLoading}
                        />
                      ))}
                    </div>
                    
                    {otpError && (
                      <p className="text-sm text-red-600 text-center flex items-center justify-center gap-1">
                        <span>⚠</span> {otpError}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={settingsLoading}
                        className="w-full py-3 bg-[#f9622c] text-white rounded-lg font-medium hover:bg-[#e5531a] text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {settingsLoading ? "Verifying..." : "Verify Code"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        disabled={settingsLoading}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                      >
                        Resend code or change email
                      </button>
                    </div>
                  </form>
                )}

                {step === "pin" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <IoLockClosed size={32} className="text-[#f9622c]" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Set New PIN
                      </h2>
                      <p className="text-sm text-gray-600">
                        Choose a secure 4-digit PIN for your wallet
                      </p>
                    </div>
                    
                    <Formik
                      initialValues={{ currentPin: "", newPin: "", confirmPin: "" }}
                      validationSchema={pinSchema}
                      onSubmit={handlePinSubmit}
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
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current PIN
                            </label>
                            <input
                              type="password"
                              name="currentPin"
                              maxLength={4}
                              placeholder="••••"
                              value={values.currentPin}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all"
                            />
                            {touched.currentPin && errors.currentPin && (
                              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <span>⚠</span> {errors.currentPin}
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New PIN
                              </label>
                              <input
                                type="password"
                                name="newPin"
                                maxLength={4}
                                placeholder="••••"
                                value={values.newPin}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all"
                              />
                              {touched.newPin && errors.newPin && (
                                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                  <span>⚠</span> {errors.newPin}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm PIN
                              </label>
                              <input
                                type="password"
                                name="confirmPin"
                                maxLength={4}
                                placeholder="••••"
                                value={values.confirmPin}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all"
                              />
                              {touched.confirmPin && errors.confirmPin && (
                                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                  <span>⚠</span> {errors.confirmPin}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-[#f9622c] text-white rounded-lg font-medium hover:bg-[#e5531a] text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Updating..." : "Update PIN"}
                          </button>
                        </form>
                      )}
                    </Formik>
                  </div>
                )}
              </div>
            )}

            {/* Localization Tab */}
            {activeTab === "Localization" && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                    <IoGlobeOutline size={32} className="text-[#f9622c]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Localization Settings
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure your regional preferences and currency
                  </p>
                </div>

                {loading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">Loading settings...</p>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all bg-white"
                        disabled={loading || settingsLoading}
                      >
                        <option value="">Select a country</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Your country helps us provide localized content
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={selectedCurrency}
                        onChange={handleCurrencyChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9622c] focus:border-transparent text-sm transition-all bg-white"
                        disabled={loading || settingsLoading}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        All prices will be displayed in this currency
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <IoGlobeOutline className="text-[#f9622c] mt-0.5 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          Auto-Detection Available
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">
                          We can automatically detect your location and set the appropriate currency based on your GPS coordinates.
                        </p>
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 bg-white border border-[#f9622c] text-[#f9622c] rounded-lg font-medium hover:bg-orange-50 text-sm transition-colors"
                          disabled={loading || settingsLoading}
                        >
                          Reset to GPS-Detected Currency
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsProfile;