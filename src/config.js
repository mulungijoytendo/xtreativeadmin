// src/config.js

// Define the base URL for your API
// src/config.js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api-xtreative.onrender.com";
export const POLLING_INTERVAL = 5000;

// Optional: Add other configuration variables if needed
export const APP_NAME = "Admin Panel";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
