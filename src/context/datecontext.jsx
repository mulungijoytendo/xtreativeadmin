// src/context/datecontext.jsx
import React, { createContext, useState, useMemo } from 'react';
import {
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  parseISO,
  format,
} from 'date-fns';

export const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState('thisMonth');
  const [customDate, setCustomDate] = useState(today);

  // Generate range label
  const rangeLabel = useMemo(() => {
    switch (range) {
      case 'today':
        return 'Today';
      case 'thisWeek':
        return 'This Week';
      case 'thisMonth':
        return 'This Month';
      case 'thisYear':
        return 'This Year';
      case 'custom':
        return format(customDate, 'do MMMM, yyyy');
      default:
        return 'This Month';
    }
  }, [range, customDate]);

  // Helper function to check if a date string is in the selected range
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    
    let date;
    try {
      date = parseISO(dateStr);
      if (isNaN(date.getTime())) {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) {
        return false;
      }
    } catch {
      return false;
    }

    switch (range) {
      case 'today':
        return isSameDay(date, today);
      case 'thisWeek':
        return isSameWeek(date, today, { weekStartsOn: 1 });
      case 'thisMonth':
        return isSameMonth(date, today);
      case 'thisYear':
        return isSameYear(date, today);
      case 'custom':
        return isSameDay(date, customDate);
      default:
        return isSameMonth(date, today);
    }
  };

  const value = {
    range,
    setRange,
    customDate,
    setCustomDate,
    rangeLabel,
    inRange,
    today,
  };

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};