import React, { useState, useContext, useMemo } from "react";
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { OrdersContext } from "../context/orderscontext";
import { ProductsContext } from "../context/allproductscontext";
import { PayoutsContext } from "../context/payoutscontext";

const ITEMS_PER_PAGE = 20;

const Reports = () => {
  const { orders, loading: ordersLoading } = useContext(OrdersContext);
  const { products, loading: productsLoading } = useContext(ProductsContext);
  const { blocks: payouts, loading: payoutsLoading } = useContext(PayoutsContext);

  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique vendors from orders and products
  const vendors = useMemo(() => {
    const vendorSet = new Set();
    
    // From orders
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.vendor_username) vendorSet.add(item.vendor_username);
      });
    });
    
    // From products
    products.forEach(product => {
      if (product.vendor_username) vendorSet.add(product.vendor_username);
    });
    
    return Array.from(vendorSet).sort();
  }, [orders, products]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let data = [];

    switch (reportType) {
      case "sales":
        // Sales Report: Show all orders with details including vendor names
        data = orders.map(order => {
          // Extract vendor names from order items
          const vendors = order.items
            .map(item => item.vendor_username)
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates
            .join(', ') || 'N/A';
          
          return {
            date: new Date(order.created_at).toLocaleDateString(),
            orderId: `ORD${order.id + 1000}`,
            customer: order.customer,
            vendor: vendors,
            total: Number(order.total_price),
            status: order.status,
            itemCount: order.items.length,
          };
        });
        
        // Apply date filter for sales
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          
          data = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= fromDate && itemDate <= toDate;
          });
        }
        
        // Apply vendor filter for sales
        if (selectedVendor !== "all") {
          data = data.filter(item => 
            item.vendor.includes(selectedVendor)
          );
        }
        
        // Apply status filter for sales
        if (selectedStatus !== "all") {
          data = data.filter(item => 
            item.status?.toLowerCase() === selectedStatus.toLowerCase()
          );
        }
        break;

      case "products":
        // Products Report: Show all products with vendor info
        data = products.map(product => ({
          name: product.name,
          vendor: product.vendor_username || 'N/A',
          category: product.category || 'N/A',
          price: Number(product.price),
          quantity: Number(product.quantity),
          created: new Date(product.created_at).toLocaleDateString(),
        }));
        
        // Apply date filter for products
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          
          data = data.filter(item => {
            const itemDate = new Date(item.created);
            return itemDate >= fromDate && itemDate <= toDate;
          });
        }
        
        // Apply vendor filter for products
        if (selectedVendor !== "all") {
          data = data.filter(item => item.vendor === selectedVendor);
        }
        break;

      case "financial":
        // Financial Report: Show payouts and commissions
        data = payouts.map(payout => ({
          date: payout.date,
          vendor: payout.vendor,
          orderId: payout.orderid,
          sales: Number(payout.sales || 0),
          commission: Number(payout.commissionAmount || 0),
          netPayout: Number(payout.netPayout || 0),
          status: payout.status,
        }));
        
        // Apply vendor filter for financial
        if (selectedVendor !== "all") {
          data = data.filter(item => item.vendor === selectedVendor);
        }
        
        // Apply status filter for financial
        if (selectedStatus !== "all") {
          data = data.filter(item => 
            item.status?.toLowerCase() === selectedStatus.toLowerCase()
          );
        }
        break;

      case "inventory":
        // Inventory Report: Show products with stock status
        data = products.map(product => ({
          name: product.name,
          vendor: product.vendor_username || 'N/A',
          quantity: Number(product.quantity),
          price: Number(product.price),
          value: Number(product.quantity) * Number(product.price),
          status: product.quantity > 10 ? "In Stock" : product.quantity > 0 ? "Low Stock" : "Out of Stock",
        }));
        
        // Apply vendor filter for inventory
        if (selectedVendor !== "all") {
          data = data.filter(item => item.vendor === selectedVendor);
        }
        
        // Apply stock status filter for inventory
        if (selectedStatus !== "all") {
          // Map common status filters to inventory statuses
          const statusMap = {
            'pending': 'Low Stock',
            'completed': 'In Stock',
            'delivered': 'In Stock',
            'cancelled': 'Out of Stock'
          };
          const mappedStatus = statusMap[selectedStatus.toLowerCase()] || selectedStatus;
          data = data.filter(item => 
            item.status?.toLowerCase().includes(mappedStatus.toLowerCase())
          );
        }
        break;

      default:
        data = [];
    }

    return data;
  }, [reportType, orders, products, payouts, dateRange, selectedVendor, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [reportType, dateRange, selectedVendor, selectedStatus]);

  // Calculate summary statistics
  const statistics = useMemo(() => {
    switch (reportType) {
      case "sales":
        const totalRevenue = filteredData.reduce((sum, item) => sum + Number(item.total || 0), 0);
        const avgOrderValue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0;
        return {
          totalOrders: filteredData.length,
          totalRevenue: totalRevenue,
          avgOrderValue: avgOrderValue,
          pendingOrders: filteredData.filter(o => o.status?.toLowerCase() === "pending").length,
        };

      case "products":
        const totalProducts = filteredData.length;
        const totalValue = filteredData.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const avgPrice = totalProducts > 0 ? filteredData.reduce((sum, p) => sum + Number(p.price), 0) / totalProducts : 0;
        return {
          totalProducts,
          totalValue: totalValue,
          avgPrice: avgPrice,
          lowStock: filteredData.filter(p => Number(p.quantity) < 10 && Number(p.quantity) > 0).length,
        };

      case "financial":
        return {
          totalSales: filteredData.reduce((sum, item) => sum + Number(item.sales || 0), 0),
          totalCommission: filteredData.reduce((sum, item) => sum + Number(item.commission || 0), 0),
          totalPayouts: filteredData.reduce((sum, item) => sum + Number(item.netPayout || 0), 0),
          pendingPayouts: filteredData.filter(p => p.status?.toLowerCase() === "pending").length,
        };

      case "inventory":
        return {
          totalItems: filteredData.reduce((sum, item) => sum + Number(item.quantity), 0),
          totalValue: filteredData.reduce((sum, item) => sum + Number(item.value), 0),
          inStock: filteredData.filter(i => i.status === "In Stock").length,
          outOfStock: filteredData.filter(i => i.status === "Out of Stock").length,
        };

      default:
        return {};
    }
  }, [reportType, filteredData]);

  // Export to Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType.charAt(0).toUpperCase() + reportType.slice(1));
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    saveAs(file, `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`${reportType.toUpperCase()} Report`, 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Prepare table data
    const headers = Object.keys(filteredData[0] || {});
    const rows = filteredData.map(item => headers.map(key => item[key]));
    
    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 98, 44] },
    });
    
    doc.save(`${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const loading = ordersLoading || productsLoading || payoutsLoading;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-[80px] overflow-auto">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Generate comprehensive reports and export data</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportExcel}
                  disabled={filteredData.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                >
                  <Download size={18} />
                  Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={filteredData.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                >
                  <Download size={18} />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      setSelectedVendor("all");
                      setSelectedStatus("all");
                      setDateRange({ from: "", to: "" });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="sales">Sales Report</option>
                    <option value="products">Products Report</option>
                    <option value="financial">Financial Report</option>
                    <option value="inventory">Inventory Report</option>
                  </select>
                </div>

                {/* Date From - Only for Sales and Products */}
                {(reportType === "sales" || reportType === "products") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Date To - Only for Sales and Products */}
                {(reportType === "sales" || reportType === "products") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Vendor Filter - For all report types */}
                {(reportType === "sales" || reportType === "products" || reportType === "financial" || reportType === "inventory") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor
                    </label>
                    <select
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="all">All Vendors</option>
                      {vendors.map(vendor => (
                        <option key={vendor} value={vendor}>{vendor}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Filter - For Sales and Financial */}
                {(reportType === "sales" || reportType === "financial") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="all">All Statuses</option>
                      {reportType === "sales" && (
                        <>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      )}
                      {reportType === "financial" && (
                        <>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="refunded">Refunded</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Stock Status Filter - For Inventory Only */}
                {reportType === "inventory" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="in stock">In Stock</option>
                      <option value="low stock">Low Stock</option>
                      <option value="out of stock">Out of Stock</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {reportType === "sales" && (
                <>
                  <StatCard
                    icon={<ShoppingCart size={24} />}
                    label="Total Orders"
                    value={statistics.totalOrders}
                    color="blue"
                  />
                  <StatCard
                    icon={<DollarSign size={24} />}
                    label="Total Revenue"
                    value={`UGX ${statistics.totalRevenue.toLocaleString()}`}
                    color="green"
                  />
                  <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Avg Order Value"
                    value={`UGX ${statistics.avgOrderValue.toFixed(2)}`}
                    color="purple"
                  />
                  <StatCard
                    icon={<AlertCircle size={24} />}
                    label="Pending Orders"
                    value={statistics.pendingOrders}
                    color="orange"
                  />
                </>
              )}

              {reportType === "products" && (
                <>
                  <StatCard
                    icon={<Package size={24} />}
                    label="Total Products"
                    value={statistics.totalProducts}
                    color="blue"
                  />
                  <StatCard
                    icon={<DollarSign size={24} />}
                    label="Total Value"
                    value={`UGX ${statistics.totalValue.toLocaleString()}`}
                    color="green"
                  />
                  <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Avg Price"
                    value={`UGX ${statistics.avgPrice.toFixed(2)}`}
                    color="purple"
                  />
                  <StatCard
                    icon={<AlertCircle size={24} />}
                    label="Low Stock"
                    value={statistics.lowStock}
                    color="orange"
                  />
                </>
              )}

              {reportType === "financial" && (
                <>
                  <StatCard
                    icon={<DollarSign size={24} />}
                    label="Total Sales"
                    value={`UGX ${statistics.totalSales.toLocaleString()}`}
                    color="blue"
                  />
                  <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Commission"
                    value={`UGX ${statistics.totalCommission.toLocaleString()}`}
                    color="green"
                  />
                  <StatCard
                    icon={<Users size={24} />}
                    label="Net Payouts"
                    value={`UGX ${statistics.totalPayouts.toLocaleString()}`}
                    color="purple"
                  />
                  <StatCard
                    icon={<AlertCircle size={24} />}
                    label="Pending Payouts"
                    value={statistics.pendingPayouts}
                    color="orange"
                  />
                </>
              )}

              {reportType === "inventory" && (
                <>
                  <StatCard
                    icon={<Package size={24} />}
                    label="Total Items"
                    value={statistics.totalItems}
                    color="blue"
                  />
                  <StatCard
                    icon={<DollarSign size={24} />}
                    label="Total Value"
                    value={`UGX ${statistics.totalValue.toLocaleString()}`}
                    color="green"
                  />
                  <StatCard
                    icon={<TrendingUp size={24} />}
                    label="In Stock"
                    value={statistics.inStock}
                    color="purple"
                  />
                  <StatCard
                    icon={<AlertCircle size={24} />}
                    label="Out of Stock"
                    value={statistics.outOfStock}
                    color="red"
                  />
                </>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Data
                    </h2>
                  </div>
                  <span className="text-sm text-gray-600">
                    {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
              </div>

              {filteredData.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No data available</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filters to see results</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(filteredData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                            >
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {paginatedData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                {typeof value === 'number' && value > 1000 
                                  ? value.toLocaleString() 
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`min-w-[40px] h-[40px] flex items-center justify-center text-sm font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default Reports;