// src/context/PayoutsContext.js
import React, { createContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';

export const PayoutsContext = createContext();

export const PayoutsProvider = ({ children }) => {
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [settledPayouts, setSettledPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/admins/payouts/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(`Payouts API Error ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setPendingPayouts(data.pending_payouts);
        setSettledPayouts(data.settled_payouts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayouts();
  }, []);

  // derive blocks for table
  const blocks = [
    // pending payouts
    ...pendingPayouts.map(p => ({
      id: p.id,
      date: '-',
      time: '-',
      vendor: p.vendor__shop_name || '-',
      orderid: p.product__name || '-',
      sales: p.amount != null ? p.amount : '-',
      commissionAmount: '-',
      netPayout: p.amount != null ? p.amount : '-',
      status: 'Pending',
      action: 'Manage',
    })),
    // settled payouts
    ...settledPayouts.map(p => {
      const dt = dayjs(p.settlement_date);
      return {
        id: p.id,
        date: dt.isValid() ? dt.format('YYYY-MM-DD') : '-',
        // format as 12-hour clock with am/pm, then lowercase
        time: dt.isValid() ? dt.format('hh:mm A').toLowerCase() : '-',
        vendor: p.vendor__shop_name || '-',
        orderid: p.product__name || '-',
        sales: p.amount != null ? p.amount : '-',
        commissionAmount: '-',
        netPayout: p.amount != null ? p.amount : '-',
        status: 'Paid',
        action: '-',
      };
    }),
  ];

  return (
    <PayoutsContext.Provider value={{ blocks, loading, error }}>
      {children}
    </PayoutsContext.Provider>
  );
};
