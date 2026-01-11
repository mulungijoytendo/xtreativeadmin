import React, { useState, useMemo, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  format,
  parseISO,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
} from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  Wallet,
  CreditCard,
  MessageCircle,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import RecentTransactions from "../components/transactions";
import { UserContext } from "../context/usercontext";
import { ClaimsContext } from "../context/claimscontext";
import { OrdersContext } from "../context/orderscontext";
// Import API functions for dashboard data fetching
import {
  getTransactions, // API to fetch all payment transactions for recent activity
  getAdminPayouts, // API to fetch pending payouts for admin dashboard
  getLoansList, // API to fetch loan applications list
  getVendorsList, // API to fetch vendors list for total count
  getCustomersList, // API to fetch customers list for total count
} from "../api.js";

const AdminDashboard = () => {
  const today = useMemo(() => new Date(), []);
  const [range, setRange] = useState("today");
  const [customDate, setCustomDate] = useState(format(today, "yyyy-MM-dd"));

  // API-fetched states
  const [revenueData, setRevenueData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // From UserContext - for new registrations
  const { users = [], loadingUsers } = useContext(UserContext);

  // From ClaimsContext - for returns
  const { claims = [], isLoading: loadingClaims } = useContext(ClaimsContext);

  // From OrdersContext - for orders and sales calculation
  const { orders = [], loading: loadingOrders } = useContext(OrdersContext);

  // Calculate totals from context data when they change
  useEffect(() => {
    if (orders.length > 0) {
      setTotalOrders(orders.length);
      const totalSales = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
      setTotalSalesAmount(totalSales);
    }
  }, [orders]);

  // Fetch all dashboard data on mount with parallel error handling
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      // Initialize with fallback data
      const fallbackRevenueData = [
        { date: "2025-01", revenue: 4000 },
        { date: "2025-02", revenue: 3000 },
        { date: "2025-03", revenue: 5000 },
        { date: "2025-04", revenue: 7000 },
        { date: "2025-05", revenue: 6000 },
        { date: "2025-06", revenue: 8000 },
        { date: "2025-07", revenue: 6500 },
        { date: "2025-08", revenue: 7200 },
        { date: "2025-09", revenue: 7800 },
        { date: "2025-10", revenue: 8200 },
        { date: "2025-11", revenue: 9000 },
        { date: "2025-12", revenue: 9500 },
      ];
      const fallbackSalesData = [
        { date: "2025-01", salesVolume: 10000 },
        { date: "2025-02", salesVolume: 8000 },
        { date: "2025-03", salesVolume: 12000 },
        { date: "2025-04", salesVolume: 18000 },
        { date: "2025-05", salesVolume: 13000 },
        { date: "2025-06", salesVolume: 17000 },
        { date: "2025-07", salesVolume: 16000 },
        { date: "2025-08", salesVolume: 18000 },
        { date: "2025-09", salesVolume: 19000 },
        { date: "2025-10", salesVolume: 20000 },
        { date: "2025-11", salesVolume: 21000 },
        { date: "2025-12", salesVolume: 22000 },
      ];

      setRevenueData(fallbackRevenueData);
      setSalesData(fallbackSalesData);

      // Set loading to false to render dashboard immediately with fallback data
      setLoading(false);

      // Fetch data in parallel with error handling using imported API functions
      try {
        const results = await Promise.allSettled([
          getTransactions(),
          getAdminPayouts(),
          getLoansList(),
          getVendorsList(),
          getCustomersList(),
        ]);

        // Handle transactions
        if (results[0].status === 'fulfilled') {
          const transactionsData = results[0].value;
          const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.results || []);
          setTransactions(transactions);
        } else {
          console.warn("Failed to fetch transactions:", results[0].reason.message);
          setTransactions([]);
        }

        // Handle payouts
        if (results[1].status === 'fulfilled') {
          const payoutsData = results[1].value;
          const payouts = Array.isArray(payoutsData) ? payoutsData : (payoutsData?.results || []);
          setPendingPayouts(payouts);
        } else {
          console.warn("Failed to fetch payouts:", results[1].reason.message);
          setPendingPayouts([]);
        }

        // Handle loans
        if (results[2].status === 'fulfilled') {
          const loansData = results[2].value;
          const loans = Array.isArray(loansData) ? loansData : (loansData?.results || []);
          setLoans(loans);
        } else {
          console.warn("Failed to fetch loans:", results[2].reason.message);
          setLoans([]);
        }

        // Handle vendors
        if (results[3].status === 'fulfilled') {
          const vendorsData = results[3].value;
          setTotalVendors(vendorsData.count || vendorsData.results?.length || 0);
        } else {
          console.warn("Failed to fetch vendors:", results[3].reason.message);
          setTotalVendors(0);
        }

        // Handle customers
        if (results[4].status === 'fulfilled') {
          const customersData = results[4].value;
          setTotalCustomers(customersData.count || customersData.results?.length || 0);
        } else {
          console.warn("Failed to fetch customers:", results[4].reason.message);
          setTotalCustomers(0);
        }

      } catch (err) {
        console.error("Critical error in dashboard data fetching:", err);
        // Don't set error state - use fallback data instead
      }
    };

    fetchDashboardData();
  }, []);

  const parseDateSafe = (value) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const inRange = (date) => {
    if (!date) return false;
    const parsed = parseDateSafe(date);
    if (!parsed) return false;
    switch (range) {
      case "today":
        return isSameDay(parsed, today);
      case "thisWeek":
        return isSameWeek(parsed, today);
      case "thisMonth":
        return isSameMonth(parsed, today);
      case "thisYear":
        return isSameYear(parsed, today);
      case "custom":
        return isSameDay(parsed, parseISO(customDate));
      default:
        return false;
    }
  };

  const formattedDate = useMemo(() => {
    switch (range) {
      case "today":
        return format(today, "MMMM d, yyyy");
      case "thisWeek":
        return "this week";
      case "thisMonth":
        return format(today, "MMMM yyyy");
      case "thisYear":
        return format(today, "yyyy");
      case "custom":
        return format(parseISO(customDate), "MMMM d, yyyy");
      default:
        return "today";
    }
  }, [range, customDate]);

  const filteredTransactions = useMemo(
    () => (Array.isArray(transactions) ? transactions : []).filter((t) => inRange(t.created_at || t.timestamp || t.date)),
    [transactions, range, customDate]
  );

  const filteredLoans = useMemo(
    () => (Array.isArray(loans) ? loans : []).filter((l) => inRange(l.created_at || l.applied_at || l.date)),
    [loans, range, customDate]
  );

  const filteredPendingPayouts = useMemo(
    () => (Array.isArray(pendingPayouts) ? pendingPayouts : []).filter((p) => inRange(p.settlement_date || p.created_at || p.date)),
    [pendingPayouts, range, customDate]
  );

  const filteredClaims = useMemo(
    () => (Array.isArray(claims) ? claims : []).filter((c) => inRange(c.created_at)),
    [claims, range, customDate]
  );

  const filteredOrders = useMemo(
    () => orders.filter((o) => {
      const parsed = parseISO(o.created_at);
      const dateObj = isNaN(parsed) ? new Date(o.created_at) : parsed;
      return inRange(dateObj);
    }),
    [orders, range, today, customDate]
  );

  const totalRevenueThisPeriod = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filteredTransactions]
  );

  const totalSalesThisPeriod = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0),
    [filteredOrders]
  );

  const loanApplicationsCount = filteredLoans.length;
  const pendingPayoutsCount = filteredPendingPayouts.length;
  const pendingReturnsCount = filteredClaims.filter(
    c => c.status?.toLowerCase() === "requested" || c.status?.toLowerCase() === "pending"
  ).length;

  const newVendors = useMemo(() => {
    if (loadingUsers || !users.length) return 0;
    return users.filter((u) => u.role === "Vendor" && inRange(u.date_joined)).length;
  }, [users, loadingUsers, range, customDate, today]);

  const newCustomers = useMemo(() => {
    if (loadingUsers || !users.length) return 0;
    return users.filter((u) => u.role === "Customer" && inRange(u.date_joined)).length;
  }, [users, loadingUsers, range, customDate, today]);

  const dashboardCards = [
    {
      title: "New Vendors",
      value: newVendors.toLocaleString(),
      icon: TrendingUp,
      gradient: "from-indigo-500 to-blue-500",
      iconBg: "from-indigo-100 to-blue-100",
      iconColor: "text-indigo-600",
      change: "+12%",
      subtitle: "this period",
    },
    {
      title: "New Customers",
      value: newCustomers.toLocaleString(),
      icon: TrendingUp,
      gradient: "from-pink-500 to-rose-500",
      iconBg: "from-pink-100 to-rose-100",
      iconColor: "text-pink-600",
      change: "+18%",
      subtitle: "this period",
    },
    {
      title: "Total Sales",
      value: `UGX ${totalSalesThisPeriod.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-violet-500 to-purple-500",
      iconBg: "from-violet-100 to-purple-100",
      iconColor: "text-violet-600",
      change: "+12.5%",
    },
    {
      title: "Total Orders",
      value: filteredOrders.length.toString(),
      icon: Activity,
      gradient: "from-green-500 to-emerald-500",
      iconBg: "from-green-100 to-emerald-100",
      iconColor: "text-green-600",
      change: "+8.2%",
    },
    {
      title: "Earnings This Period",
      value: `UGX ${totalRevenueThisPeriod.toLocaleString()}`,
      icon: Activity,
      gradient: "from-orange-500 to-amber-500",
      iconBg: "from-orange-100 to-amber-100",
      iconColor: "text-orange-600",
      change: "+15.3%",
    },
    {
      title: "Pending Payouts",
      value: pendingPayoutsCount.toString(),
      icon: Wallet,
      gradient: "from-red-500 to-pink-500",
      iconBg: "from-red-100 to-pink-100",
      iconColor: "text-red-600",
      change: null,
    },
    {
      title: "Loan Applications",
      value: loanApplicationsCount.toString(),
      icon: CreditCard,
      gradient: "from-purple-500 to-indigo-500",
      iconBg: "from-purple-100 to-indigo-100",
      iconColor: "text-purple-600",
      change: null,
    },
    {
      title: "Pending Returns",
      value: pendingReturnsCount.toString(),
      icon: RotateCcw,
      gradient: "from-orange-500 to-red-500",
      iconBg: "from-orange-100 to-red-100",
      iconColor: "text-orange-600",
      change: null,
    },
  ];

  const dummyNotifications = [
    { title: "New vendor registered", time: "5 mins ago" },
    { title: "Customer placed an order", time: "10 mins ago" },
    { title: "New loan application", time: "30 mins ago" },
  ];

  if (loading || loadingOrders) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-medium text-red-600 mb-4">Error loading dashboard</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen font-poppins flex flex-col bg-gray-50">
      <Header
        notifications={dummyNotifications}
        currentDate={formattedDate}
        range={range}
        onRangeChange={setRange}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ml-[80px]">
          <div className="p-8">
            {/* Header Section */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Welcome back, Admin! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening with your platform for {formattedDate}.</p>
              </div>
              <div className="relative">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="appearance-none bg-white border-2 border-blue-500 rounded-lg px-6 py-3 pr-10 text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                >
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Date</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none" />
              </div>
            </div>

            {/* Custom Date Picker */}
            {range === "custom" && (
              <div className="mb-6 flex justify-end">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="border-2 border-blue-500 rounded-lg px-4 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                />
              </div>
            )}

            {/* Dashboard Cards Grid - Improved Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              {dashboardCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="relative group">
                    {/* Glow effect */}
                    <div
                      className={`absolute -inset-0.5 bg-gradient-to-r ${card.gradient} rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500`}
                    ></div>
                    
                    {/* Card content */}
                    <div className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-5 border border-gray-100 h-full">
                      {/* Top section with icon and change indicator */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${card.iconBg} shadow-sm`}>
                          <Icon className={`w-6 h-6 ${card.iconColor}`} />
                        </div>
                        {card.change && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-bold text-green-600">{card.change}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-gray-600 text-sm font-semibold mb-2">{card.title}</h3>
                      
                      {/* Value */}
                      <p className="text-2xl font-extrabold text-gray-900 mb-1 truncate">{card.value}</p>
                      
                      {/* Subtitle */}
                      {card.subtitle && (
                        <p className="text-xs text-gray-500">{card.subtitle}</p>
                      )}
                      {card.title.includes("Earnings") && (
                        <p className="text-xs text-gray-500 mt-1">for {formattedDate}</p>
                      )}

                      {/* Bottom gradient accent */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Sales Volume Chart */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-gray-200/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Sales Volume</h2>
                <p className="text-gray-500 text-sm mb-6">Track your sales performance</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={salesData}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickFormatter={(tick) => tick.split("-")[1]} stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip formatter={(v) => `UGX ${Number(v).toLocaleString()}`} />
                    <Bar dataKey="salesVolume" fill="url(#colorBar)" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-gray-200/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Revenue</h2>
                <p className="text-gray-500 text-sm mb-6">Revenue performance overview</p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickFormatter={(tick) => tick.split("-")[1]} stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip formatter={(v) => `UGX ${Number(v).toLocaleString()}`} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <RecentTransactions transactions={filteredTransactions} />
              </div>
            </div>
          </div>

          {/* Floating Chat Button */}
          <div className="fixed bottom-8 right-8 z-50">
            <Link to="/chat" className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full shadow-2xl hover:shadow-orange-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group">
              <MessageCircle className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;