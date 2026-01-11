import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import {
  CreditCard,
  Archive,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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
} from 'date-fns';
import { OrdersContext } from '../context/orderscontext';
import { ClaimsContext } from '../context/claimscontext';
import { DateContext } from '../context/datecontext';
import {
  getAdminPayouts,
  getProductStock,
} from '../api.js';

const FinanceOverview = () => {
  const { orders: contextOrders, loading: ordersLoading } = useContext(OrdersContext);
  const { claims: contextClaims, isLoading: claimsLoading } = useContext(ClaimsContext);
  const {
    range,
    setRange,
    customDate,
    setCustomDate,
    rangeLabel,
    inRange,
    today,
  } = useContext(DateContext);

  // UI State
  const [showAmount, setShowAmount] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [chartView, setChartView] = useState('both');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const payoutsTableRef = useRef(null);

  // Data States
  const [payoutsData, setPayoutsData] = useState({ settled: 0, pending: 0, all: [] });
  const [totalSalesAllTime, setTotalSalesAllTime] = useState(0);
  const [totalOrdersAllTime, setTotalOrdersAllTime] = useState(0);
  const [totalSalesThisPeriod, setTotalSalesThisPeriod] = useState(0);
  const [totalOrdersThisPeriod, setTotalOrdersThisPeriod] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [refundsTotal, setRefundsTotal] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  // Calculate ALL-TIME totals
  useEffect(() => {
    const ordersToUse = contextOrders || [];
    if (ordersToUse.length > 0) {
      setTotalOrdersAllTime(ordersToUse.length);
      const totalSales = ordersToUse.reduce((sum, order) => {
        return sum + parseFloat(order.total_price || order.amount || 0);
      }, 0);
      setTotalSalesAllTime(totalSales);
    } else {
      setTotalOrdersAllTime(0);
      setTotalSalesAllTime(0);
    }
  }, [contextOrders]);

  // Calculate PERIOD-specific orders data
  const calculatePeriodOrdersData = useMemo(() => {
    const ordersToUse = contextOrders || [];
    if (!Array.isArray(ordersToUse)) {
      return { filteredOrders: [], totalSalesAmount: 0 };
    }

    const filteredOrders = ordersToUse.filter((order) => {
      if (!order) return false;
      const dateStr = order.created_at || order.date;
      return inRange(dateStr);
    });

    const totalSalesAmount = filteredOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || order.amount || 0);
    }, 0);

    return { filteredOrders, totalSalesAmount };
  }, [contextOrders, inRange]);

  useEffect(() => {
    setTotalSalesThisPeriod(calculatePeriodOrdersData.totalSalesAmount);
    setTotalOrdersThisPeriod(calculatePeriodOrdersData.filteredOrders.length);
  }, [calculatePeriodOrdersData]);

  // Fetch payouts
  const fetchPayouts = async () => {
    try {
      const payouts = await getAdminPayouts();
      const filteredPayouts = payouts.filter((payout) => {
        const dateStr = payout.created_at || payout.date;
        return inRange(dateStr);
      });

      const settled = filteredPayouts
        .filter((p) => ['settled', 'completed', 'paid'].includes(p.status?.toLowerCase()))
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const pending = filteredPayouts
        .filter((p) => ['pending', 'processing'].includes(p.status?.toLowerCase()))
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const commission = filteredPayouts
        .filter((p) => ['settled', 'completed', 'paid'].includes(p.status?.toLowerCase()))
        .reduce((sum, p) => sum + parseFloat(p.amount || 0) * 0.144, 0);

      setPayoutsData({ settled, pending, all: filteredPayouts });
      setTotalCommission(commission);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setPayoutsData({ settled: 0, pending: 0, all: [] });
      setTotalCommission(0);
    }
  };

  // Fetch inventory value
  const fetchInventoryValue = async () => {
    try {
      const stockData = await getProductStock();
      const totalValue = stockData.reduce((sum, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || item.stock_quantity || 0);
        return sum + price * quantity;
      }, 0);
      setInventoryValue(totalValue);
    } catch (error) {
      console.error('Error fetching inventory value:', error);
      setInventoryValue(0);
    }
  };

  // Calculate refunds
  const calculateRefunds = useMemo(() => {
    const returns = contextClaims || [];
    const filteredReturns = returns.filter((returnItem) => {
      const dateStr = returnItem.created_at || returnItem.date;
      const isRefunded = ['approved', 'completed', 'refunded'].includes(
        returnItem.status?.toLowerCase()
      );
      return inRange(dateStr) && isRefunded;
    });

    return filteredReturns.reduce(
      (sum, r) => sum + parseFloat(r.refund_amount || r.amount || 0),
      0
    );
  }, [contextClaims, inRange]);

  useEffect(() => {
    setRefundsTotal(calculateRefunds);
  }, [calculateRefunds]);

  // Generate monthly trends (yearly view)
  const generateMonthlyTrends = async () => {
    try {
      const payouts = await getAdminPayouts();
      const returns = contextClaims || [];
      const months = eachMonthOfInterval({
        start: startOfYear(today),
        end: endOfMonth(today),
      });

      const trends = months.map((month) => {
        const monthPayouts = payouts.filter((p) => {
          const dateStr = p.created_at || p.date;
          if (!dateStr) return false;
          let payoutDate;
          try {
            payoutDate = parseISO(dateStr);
            if (isNaN(payoutDate.getTime())) payoutDate = new Date(dateStr);
          } catch {
            return false;
          }
          return (
            isSameMonth(payoutDate, month) &&
            isSameYear(payoutDate, month) &&
            ['settled', 'completed', 'paid'].includes(p.status?.toLowerCase())
          );
        });

        const commission = monthPayouts.reduce(
          (sum, p) => sum + parseFloat(p.amount || 0) * 0.144,
          0
        );

        const monthReturns = returns.filter((r) => {
          const dateStr = r.created_at || r.date;
          if (!dateStr) return false;
          let returnDate;
          try {
            returnDate = parseISO(dateStr);
            if (isNaN(returnDate.getTime())) returnDate = new Date(dateStr);
          } catch {
            return false;
          }
          return (
            isSameMonth(returnDate, month) &&
            isSameYear(returnDate, month) &&
            ['approved', 'completed', 'refunded'].includes(r.status?.toLowerCase())
          );
        });

        const refunds = monthReturns.reduce(
          (sum, r) => sum + parseFloat(r.refund_amount || r.amount || 0),
          0
        );

        return {
          month: format(month, 'MMM'),
          commission: Math.round(commission),
          refunds: Math.round(refunds),
        };
      });

      setMonthlyTrends(trends);
    } catch (error) {
      console.error('Error generating monthly trends:', error);
    }
  };

  // Load all data
  useEffect(() => {
    const fetchAllData = async () => {
      setDataLoading(true);
      await Promise.all([fetchPayouts(), fetchInventoryValue(), generateMonthlyTrends()]);
      setDataLoading(false);
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customDate, contextOrders, contextClaims]);

  // Distribution data for pie chart (period-specific)
  const distributionData = useMemo(() => {
    const data = [
      { name: 'Sales', value: totalSalesThisPeriod, color: '#f97316' },
      { name: 'Commission', value: totalCommission, color: '#10b981' },
      { name: 'Payouts', value: payoutsData.settled, color: '#3b82f6' },
      { name: 'Refunds', value: refundsTotal, color: '#ef4444' },
    ];
    return data.filter((item) => item.value > 0);
  }, [totalSalesThisPeriod, totalCommission, payoutsData.settled, refundsTotal]);

  const totalRevenue = useMemo(() => {
    return totalSalesThisPeriod + totalCommission + payoutsData.settled + refundsTotal;
  }, [totalSalesThisPeriod, totalCommission, payoutsData.settled, refundsTotal]);

  // PIN & Balance handlers
  const handleEyeClick = () => {
    if (showAmount) {
      setShowAmount(false);
    } else {
      setModalOpen(true);
      setPinError('');
      setApiError('');
      setPinDigits(['', '', '', '']);
      setTimeout(() => inputRefs[0].current?.focus(), 0);
    }
  };

  const handleDigitChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newDigits = [...pinDigits];
      newDigits[index] = value;
      setPinDigits(newDigits);
      if (value && index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    const pin = pinDigits.join('');
    if (pin.length !== 4) {
      setPinError('Please enter a 4-digit PIN.');
      return;
    }

    setLoading(true);
    setPinError('');
    setApiError('');

    try {
      // Using the correct endpoint: /wallets/business-wallet/balance/
      const response = await fetch('/wallets/business-wallet/balance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Incorrect PIN');
        }
        throw new Error('Failed to fetch balance');
      }

      const balanceResponse = await response.json();
      const fetchedBalance = balanceResponse.balance;
      setBalance(`UGX ${fetchedBalance.toLocaleString()}`);
      setShowAmount(true);
      setModalOpen(false);
    } catch (error) {
      if (error.message?.includes('401') || error.message?.includes('Incorrect')) {
        setPinError('Incorrect PIN or invalid credentials.');
      } else {
        setApiError('Failed to fetch balance. Please try again later.');
      }
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayout = (payout) => {
    setSelectedPayout(payout);
    setPayoutModalOpen(true);
  };

  const scrollToPayouts = () => {
    payoutsTableRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        * {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .mono {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #d1d5db;
        }
        
        .stat-icon {
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover .stat-icon {
          transform: scale(1.1);
        }
        
        .btn-primary {
          transition: all 0.2s ease;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.4);
        }
        
        .btn-secondary {
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          background-color: #f3f4f6;
        }
        
        .modal-overlay {
          animation: fadeIn 0.2s ease;
        }
        
        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .pin-input {
          transition: all 0.2s ease;
        }
        
        .pin-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
          transform: scale(1.05);
        }
        
        .table-row {
          transition: background-color 0.15s ease;
        }
        
        .table-row:hover {
          background-color: #f9fafb;
        }
        
        .loading-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .chart-toggle {
          position: relative;
          transition: all 0.2s ease;
        }
        
        .chart-toggle::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #f97316, #ea580c);
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }
        
        .chart-toggle.active::after {
          transform: scaleX(1);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
          letter-spacing: 0.025em;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                Finance Overview
              </h1>
              <p className="text-slate-600 text-lg">
                Comprehensive financial analytics and insights
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={scrollToPayouts}
                className="btn-primary px-6 py-3 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <DollarSign className="w-5 h-5" />
                Finance Payouts
              </button>
              <div className="text-right">
                <div className="text-sm text-slate-500 mb-1">Current Date</div>
                <div className="text-lg font-semibold text-slate-900 mono">
                  {format(today, 'do MMMM, yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Period
                </label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-900 font-medium transition-all"
                >
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>
              
              {range === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={format(customDate, 'yyyy-MM-dd')}
                    onChange={(e) => setCustomDate(new Date(e.target.value))}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white mono transition-all"
                  />
                </div>
              )}
              
              <div className="flex-1 flex items-end">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-3 rounded-xl border border-orange-200">
                  <div className="text-sm text-orange-700 font-medium">
                    Viewing data for <span className="font-bold">{rangeLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {(dataLoading || ordersLoading || claimsLoading) && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="loading-pulse">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-1">Loading Financial Data</div>
                <div className="text-sm text-blue-700">Fetching latest information...</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Admin Wallet Card */}
          <div className="stat-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-xl stat-icon">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Admin Wallet
                  </h3>
                </div>
              </div>
              <button
                onClick={handleEyeClick}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                aria-label={showAmount ? 'Hide balance' : 'Show balance'}
              >
                {showAmount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 mono tracking-tight mb-6">
                {showAmount && balance ? balance : '••••••••••'}
              </p>
            </div>
            
            {/* All Time Total Sales */}
            <div className="mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Sales (All Time)</p>
                  <p className="text-xl font-bold text-slate-900 mono">
                    {dataLoading || ordersLoading
                      ? 'Loading...'
                      : `UGX ${Math.round(totalSalesAllTime).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Period Sales and Commission */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-orange-700 font-medium mb-1">{rangeLabel} Sales</p>
                  <p className="text-lg font-bold text-orange-600 mono">
                    {dataLoading || ordersLoading
                      ? 'Loading...'
                      : `UGX ${Math.round(totalSalesThisPeriod).toLocaleString()}`}
                  </p>
                  {!dataLoading && !ordersLoading && totalSalesAllTime > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      {((totalSalesThisPeriod / totalSalesAllTime) * 100).toFixed(1)}% of total
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium mb-1">Commission</p>
                  <p className="text-lg font-bold text-green-600 mono">
                    {dataLoading
                      ? 'Loading...'
                      : `UGX ${Math.round(totalCommission).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-green-600 mt-1">14.4% rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Settled & Pending Payouts */}
          <div className="space-y-6">
            {/* Settled Payouts */}
            <div className="stat-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2.5 rounded-xl stat-icon">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Settled Payouts ({rangeLabel})
                  </h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mono">
                {dataLoading
                  ? 'Loading...'
                  : `UGX ${Math.round(payoutsData.settled).toLocaleString()}`}
              </p>
            </div>

            {/* Pending Payouts */}
            <div className="stat-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-100 p-2.5 rounded-xl stat-icon">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pending Payouts ({rangeLabel})
                  </h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mono">
                {dataLoading
                  ? 'Loading...'
                  : `UGX ${Math.round(payoutsData.pending).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Right Column - Inventory & Refunds */}
          <div className="space-y-6">
            {/* Inventory Value */}
            <div className="stat-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2.5 rounded-xl stat-icon">
                  <Archive className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Inventory Value
                  </h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mono">
                {dataLoading
                  ? 'Loading...'
                  : `UGX ${Math.round(inventoryValue).toLocaleString()}`}
              </p>
            </div>

            {/* Refunds */}
            <div className="stat-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-100 p-2.5 rounded-xl stat-icon">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Refunds ({rangeLabel})
                  </h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mono">
                {dataLoading || claimsLoading
                  ? 'Loading...'
                  : `UGX ${Math.round(refundsTotal).toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Financial Trends Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Financial Trends
              </h3>
              <p className="text-slate-600">
                Monthly commission and refunds overview
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setChartView('both')}
                className={`chart-toggle px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  chartView === 'both'
                    ? 'active bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setChartView('balance')}
                className={`chart-toggle px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  chartView === 'balance'
                    ? 'active bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Commission
              </button>
              <button
                onClick={() => setChartView('payouts')}
                className={`chart-toggle px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  chartView === 'payouts'
                    ? 'active bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Refunds
              </button>
            </div>

            {dataLoading ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500">
                <TrendingUp className="w-12 h-12 mb-4 loading-pulse text-orange-500" />
                <p className="font-medium">Loading chart data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '13px', fontWeight: '500' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `${value / 1000}k`}
                    hide={chartView === 'payouts'}
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value / 1000}k`}
                    hide={chartView === 'balance'}
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl">
                            <p className="font-bold text-slate-900 mb-3 text-base">
                              {payload[0].payload.month}
                            </p>
                            {(chartView === 'both' || chartView === 'balance') &&
                              payload.find((p) => p.dataKey === 'commission') && (
                                <p className="text-sm text-slate-700 mb-1 flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                                  <span className="font-medium">Commission:</span>
                                  <span className="mono font-semibold">
                                    UGX {payload.find((p) => p.dataKey === 'commission').value.toLocaleString()}
                                  </span>
                                </p>
                              )}
                            {(chartView === 'both' || chartView === 'payouts') &&
                              payload.find((p) => p.dataKey === 'refunds') && (
                                <p className="text-sm text-slate-700 flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-red-400"></span>
                                  <span className="font-medium">Refunds:</span>
                                  <span className="mono font-semibold">
                                    UGX {payload.find((p) => p.dataKey === 'refunds').value.toLocaleString()}
                                  </span>
                                </p>
                              )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {(chartView === 'both' || chartView === 'balance') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="commission"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  )}
                  {(chartView === 'both' || chartView === 'payouts') && (
                    <Bar 
                      yAxisId="right" 
                      dataKey="refunds" 
                      fill="#ef4444"
                      radius={[8, 8, 0, 0]}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-gray-100">
              {(chartView === 'both' || chartView === 'balance') && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-slate-700">Commission</span>
                </div>
              )}
              {(chartView === 'both' || chartView === 'payouts') && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-400 rounded-full shadow-sm"></div>
                  <span className="text-sm font-medium text-slate-700">Refunds</span>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Financial Distribution
              </h3>
              <p className="text-slate-600">
                Breakdown for {rangeLabel}
              </p>
            </div>

            {dataLoading || ordersLoading ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500">
                <TrendingUp className="w-12 h-12 mb-4 loading-pulse text-orange-500" />
                <p className="font-medium">Loading distribution...</p>
              </div>
            ) : totalRevenue === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 text-slate-400" />
                <p className="font-medium text-slate-600">No data for selected period</p>
                <p className="text-sm text-slate-500 mt-2">Try selecting a different time range</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `UGX ${value.toLocaleString()}`}
                      strokeWidth={3}
                      stroke="#fff"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `UGX ${value.toLocaleString()}`}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-lg shadow-sm"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-600">
                            {totalRevenue > 0
                              ? ((item.value / totalRevenue) * 100).toFixed(1)
                              : 0}%
                          </p>
                          <p className="text-xs text-slate-500 mono">
                            {item.value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payouts Table */}
        <div ref={payoutsTableRef} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 scroll-mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                Finance Payouts
              </h3>
              <p className="text-slate-600">{rangeLabel}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-2.5 rounded-xl border border-orange-200">
              <span className="text-sm font-semibold text-orange-700">
                Commission Rate: 14.4%
              </span>
            </div>
          </div>

          {dataLoading ? (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 loading-pulse text-orange-500" />
              <p className="font-medium text-slate-600">Loading payouts...</p>
            </div>
          ) : payoutsData.all.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="font-medium text-slate-600 mb-2">No payouts found</p>
              <p className="text-sm text-slate-500">No payouts found for the selected period</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Net Payout
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payoutsData.all.map((payout) => {
                      const amount = parseFloat(payout.amount || 0);
                      const commission = amount * 0.144;
                      const netPayout = amount - commission;
                      return (
                        <tr key={payout.id} className="table-row">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900 mono">
                              #{payout.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700 mono">
                              {payout.created_at
                                ? format(parseISO(payout.created_at), 'MMM dd, yyyy')
                                : payout.date
                                ? format(parseISO(payout.date), 'MMM dd, yyyy')
                                : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-900">
                              {payout.vendor_name || payout.vendor || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-900 mono">
                              UGX {amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-orange-600 mono">
                              UGX {Math.round(commission).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-emerald-600 mono">
                              UGX {Math.round(netPayout).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`status-badge px-3 py-1.5 rounded-lg text-xs ${
                                ['settled', 'completed', 'paid'].includes(
                                  payout.status?.toLowerCase()
                                )
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewPayout(payout)}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 px-2">
                <span className="text-sm text-slate-600 font-medium">
                  Showing <span className="font-bold text-slate-900">{payoutsData.all.length}</span> result(s)
                </span>
                <span className="text-sm text-slate-600 font-medium">Page 1 of 1</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payout Details Modal */}
      {payoutModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto modal-content">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Payout Details</h2>
                <button
                  onClick={() => setPayoutModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg">Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Payout ID</span>
                      <span className="font-semibold text-slate-900 mono">#{selectedPayout.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Status</span>
                      <span
                        className={`status-badge px-3 py-1.5 rounded-lg text-xs ${
                          ['settled', 'completed', 'paid'].includes(
                            selectedPayout.status?.toLowerCase()
                          )
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedPayout.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Date Created</span>
                      <span className="font-semibold text-slate-900 mono">
                        {format(
                          parseISO(selectedPayout.created_at || selectedPayout.date),
                          'MMM dd, yyyy'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">Vendor</span>
                      <span className="font-semibold text-slate-900">
                        {selectedPayout.vendor_name || selectedPayout.vendor || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200">
                  <h3 className="font-bold text-slate-900 mb-4 text-lg">Financial Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700 font-medium">Gross Amount</span>
                      <span className="font-semibold text-slate-900 mono">
                        UGX {parseFloat(selectedPayout.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700 font-medium">Commission (14.4%)</span>
                      <span className="font-semibold text-orange-600 mono">
                        - UGX{' '}
                        {Math.round(
                          parseFloat(selectedPayout.amount || 0) * 0.144
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-orange-300">
                      <span className="text-base text-slate-900 font-bold">Net Payout</span>
                      <span className="text-lg font-bold text-emerald-600 mono">
                        UGX{' '}
                        {Math.round(
                          parseFloat(selectedPayout.amount || 0) * 0.856
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 modal-content">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Enter PIN</h2>
              <p className="text-slate-600">Enter your 4-digit PIN to view balance</p>
            </div>

            <form onSubmit={handlePinSubmit}>
              <div className="flex justify-center gap-3 mb-6">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={digit}
                    ref={inputRefs[idx]}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    className="pin-input w-14 h-14 border-2 border-gray-300 rounded-xl text-center text-xl font-bold focus:border-orange-500 focus:outline-none mono"
                    disabled={loading}
                  />
                ))}
              </div>

              {pinError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {pinError}
                </div>
              )}
              {apiError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? 'Verifying...' : 'Submit PIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceOverview;