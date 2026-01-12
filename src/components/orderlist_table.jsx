import React, { useState, useMemo, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaCar } from "react-icons/fa";
import { UserContext } from "../context/usercontext";
import { OrdersContext } from "../context/orderscontext";
import { API_BASE_URL, authFetch } from "../api";

// Map statuses to bg/text colors using yellow ↔ orange ↔ green blends
const getOrderStatusClasses = (status) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-orange-100 text-orange-800";
    case "packaging":
      return "bg-amber-100 text-amber-800";
    case "shipped":
      return "bg-green-100 text-green-800";
    case "sent to warehouse":
      return "bg-gray-100 text-yellow-700";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "delivered":
      return "bg-teal-100 text-teal-800";
    case "canceled":
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Capitalize the first letter of each word
const capitalize = (str) =>
  str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

// Compute time since creation (using fixed current date: September 22, 2025)
const getDuration = (isoDateString) => {
  const then = new Date(isoDateString).getTime();
  const now = new Date("2025-09-22").getTime(); // Fixed current date
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Base API endpoint pattern
const API_STATUS_ENDPOINT = API_BASE_URL + "/orders/{order_id}/status/";

const OrderListTable = () => {
  const { orders, loadingOrders, errorOrders } = useContext(OrdersContext);
  const { users, loadingUsers, errorUsers } = useContext(UserContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Memoized user lookup
  const userLookup = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    let filtered = orders || [];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(term) ||
          order.customer_name.toLowerCase().includes(term) ||
          order.customer_email.toLowerCase().includes(term) ||
          order.customer_phone.toLowerCase().includes(term) ||
          order.product_name.toLowerCase().includes(term) ||
          order.product_category.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((order) => order.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "date") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortBy === "amount") {
        aVal = a.total_amount;
        bVal = b.total_amount;
      } else if (sortBy === "customer") {
        aVal = a.customer_name.toLowerCase();
        bVal = b.customer_name.toLowerCase();
      } else if (sortBy === "status") {
        aVal = a.status.toLowerCase();
        bVal = b.status.toLowerCase();
      } else {
        aVal = a.id;
        bVal = b.id;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  // Status options for filter dropdown
  const statusOptions = useMemo(() => {
    const statuses = new Set(orders?.map((o) => o.status.toLowerCase()) || []);
    return ["All", ...Array.from(statuses).sort()];
  }, [orders]);

  // Handlers
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleStatusChange = (e) => setStatusFilter(e.target.value);
  const handleSortChange = (e) => setSortBy(e.target.value);
  const toggleSortOrder = () => setSortOrder(sortOrder === "asc" ? "desc" : "asc");

  // Loading and error states
  if (loadingOrders || loadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorOrders || errorUsers) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading data: {errorOrders || errorUsers}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filters and Controls */}
      <div className="p-4 border-b flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders (ID, customer, product, category, phone)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All Statuses" : capitalize(status)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="customer">Sort by Customer</option>
            <option value="status">Sort by Status</option>
            <option value="id">Sort by ID</option>
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {sortOrder === "asc" ? "▲ Asc" : "▼ Desc"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-gray-400">{order.customer_email}</div>
                    <div className="text-xs text-gray-400">{order.customer_phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{order.product_name}</div>
                    <div className="text-xs text-gray-400">{order.product_category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusClasses(order.status)}`}>
                    {capitalize(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{new Date(order.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">{getDuration(order.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link
                    to={`/order-order-details/${order.id}`}
                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                  >
                    <FaEye />
                    View
                  </Link>
                  {order.status.toLowerCase() !== "delivered" && (
                    <Link
                      to={`/order-order-details/${order.id}`}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1"
                    >
                      <FaCar />
                      Track
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredOrders.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No orders found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default OrderListTable;