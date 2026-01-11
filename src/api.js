// src/api.js
const API_BASE_URL = "https://api-xtreative.onrender.com";

// Generic authenticated fetch helper
export const authFetch = async (path, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!token) {
    throw new Error("No auth token found. Please log in.");
  }

  headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
};

/* ============================
   DASHBOARD API FUNCTIONS
============================ */

// Transactions
export const getTransactions = () =>
  authFetch("/payments/transactions/");

// Admin payouts
export const getAdminPayouts = () =>
  authFetch("/payouts/admin/");

// Loans
export const getLoansList = () =>
  authFetch("/loans/");

// Vendors
export const getVendorsList = () =>
  authFetch("/vendors/");

// Customers
export const getCustomersList = () =>
  authFetch("/customers/");

// Business Wallet Balance (with PIN verification)
export const getBusinessWalletBalance = ({ pin }) =>
  authFetch("/wallet/business/balance/", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });

// Product Stock/Inventory
export const getProductStock = () =>
  authFetch("/products/stock/");

export { API_BASE_URL };