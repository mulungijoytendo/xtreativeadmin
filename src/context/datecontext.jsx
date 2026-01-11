import React, { createContext, useState, useMemo } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  endOfMonth,
  eachMonthOfInterval,
  startOfYear,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";

export const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const today = useMemo(() => new Date(), []);

  // Date range state
  const [range, setRange] = useState("today");
  const [customDate, setCustomDate] = useState(today);
  const [customRangeStart, setCustomRangeStart] = useState(today);
  const [customRangeEnd, setCustomRangeEnd] = useState(today);

  // Date range label
  const rangeLabel = useMemo(() => {
    switch (range) {
      case "today": return "Today";
      case "thisWeek": return "This Week";
      case "thisMonth": return "This Month";
      case "thisYear": return "This Year";
      case "custom": return format(customDate, "do MMMM, yyyy");
      case "customRange": return `${format(customRangeStart, "do MMM")} - ${format(customRangeEnd, "do MMM, yyyy")}`;
      default: return "";
    }
  }, [range, customDate, customRangeStart, customRangeEnd]);

  // Get date range boundaries
  const getDateRange = useMemo(() => {
    switch (range) {
      case "today":
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
      case "thisWeek":
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        };
      case "thisMonth":
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      case "thisYear":
        return {
          start: startOfYear(today),
          end: endOfMonth(today)
        };
      case "custom":
        return {
          start: startOfDay(customDate),
          end: endOfDay(customDate)
        };
      case "customRange":
        return {
          start: startOfDay(customRangeStart),
          end: endOfDay(customRangeEnd)
        };
      default:
        return {
          start: startOfDay(today),
          end: endOfDay(today)
        };
    }
  }, [range, customDate, customRangeStart, customRangeEnd, today]);

  // Enhanced helper function to check if date is in selected range
  const inRange = (dateString) => {
    if (!dateString) return false;

    try {
      // Try to parse the date
      let date = parseISO(dateString);

      // If parsing fails, try creating a new Date object
      if (isNaN(date.getTime())) {
        date = new Date(dateString);
      }

      // If still invalid, return false
      if (isNaN(date.getTime())) {
        return false;
      }

      // Check if date is within the range
      return isWithinInterval(date, {
        start: getDateRange.start,
        end: getDateRange.end
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return false;
    }
  };

  const value = {
    range,
    setRange,
    customDate,
    setCustomDate,
    customRangeStart,
    setCustomRangeStart,
    customRangeEnd,
    setCustomRangeEnd,
    rangeLabel,
    getDateRange,
    inRange,
    today
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};