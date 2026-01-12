// src/context/loanscontext.jsx - Minimal Non-Crashing Version
import React, { createContext, useState, useEffect } from 'react';

export const LoansContext = createContext();

export const LoansProvider = ({ children }) => {
  const [loans, setLoans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('No token - please log in');
          setLoading(false);
          return;
        }

        // Fetch loans
        const loansRes = await fetch(`${API_BASE_URL}/loan_app/loans/list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (loansRes.ok) {
          const data = await loansRes.json();
          setLoans(Array.isArray(data) ? data : []);
        } else {
          setError('Loans fetch failed');
        }

        // Fetch vendors
        const vendorsRes = await fetch(`${API_BASE_URL}/vendors/list/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (vendorsRes.ok) {
          const data = await vendorsRes.json();
          setVendors(Array.isArray(data) ? data : []);
        } else {
          setError('Vendors fetch failed');
        }
      } catch (err) {
        setError('Fetch error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const value = {
    loans,
    vendors,
    loading,
    error,
    approveLoan: async (id) => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/${id}/approve/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLoans(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
          return data;
        }
      } catch (err) {
        setError('Approve failed: ' + err.message);
      }
    },
    rejectLoan: async (id, reason) => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/loan_app/${id}/reject/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rejection_reason: reason }),
        });
        if (res.ok) {
          const data = await res.json();
          setLoans(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
          return data;
        }
      } catch (err) {
        setError('Reject failed: ' + err.message);
      }
    },
    // Derived data (no dayjs dependency to avoid crashes)
    repaymentBlocks: loans.filter(l => ['Active', 'Approved'].includes(l.status)).map(l => ({
      id: l.id,
      vendor_username: l.vendor_username,
      vendor_balance: l.current_balance,
      loanId: l.id,
      dueDate: l.next_payment_date ? l.next_payment_date.split('T')[0] : '-',
      daysUntilDue: 0, // Simplified
      amountDue: l.monthly_payment || l.weekly_payment || 0,
      amountPaid: '-',
      status: 'Upcoming',
      adminAction: 'Manage',
      originalLoan: l,
    })),
    repaymentHistory: loans.filter(l => l.status === 'Completed').map(l => ({
      id: l.id,
      vendor_username: l.vendor_username,
      loanId: l.id,
      paidDate: l.updated_at.split('T')[0],
      amountPaid: l.monthly_payment || l.weekly_payment || 0,
      paymentMethod: l.payment_frequency,
      status: 'Paid',
    })),
  };

  return (
    <LoansContext.Provider value={value}>
      {children}
    </LoansContext.Provider>
  );
};
