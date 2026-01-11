import React, { useState, useMemo, useContext } from "react";
import {
  Users,
  Percent,
  TrendingUp,
  RefreshCw,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import LoansModal from "../modals/loan_details";
import LoanDetails from "../components/loan_details_Tab";
import { LoansContext } from "../context/loanscontext";

const formatUGX = (value) =>
  value != null ? `UGX ${value.toLocaleString("en-UG")}` : "UGX 0";

const TABS = [
  { key: "applications", label: "Applications" },
  { key: "due", label: "Due & Overdue Loans" },
  { key: "history", label: "Repayment History" },
  { key: "overview", label: "Summary & Leaderboard" },
  { key: "details", label: "Loan Details" },
];

const COLUMN_CONFIG = {
  applications: [
    { header: "Application ID", accessor: (row) => row.id },
    { header: "Vendor Name", accessor: (row) => row.vendor_username },
    { header: "Wallet Balance", accessor: (row) => formatUGX(row.vendor_balance) },
    {
      header: "Guarantor",
      accessor: (row, vendors) =>
        (row.guarantors || [])
          .map((id) => vendors.find((v) => v.id === id)?.username)
          .join(", "),
    },
    { header: "Status", accessor: (row) => row.status },
    { header: "Applied Date", accessor: (row) => row.created_at.split("T")[0] },
    { header: "Loan Purpose", accessor: (row) => row.purpose },
    { header: "Duration", accessor: (row) => `${row.duration} mo` },
    { header: "Payment Plan", accessor: (row) => row.payment_frequency },
    { header: "Weekly Payable", accessor: (row) => formatUGX(row.weekly_payment) },
    { header: "Monthly Payable", accessor: (row) => formatUGX(row.monthly_payment) },
    { header: "NIN Number", accessor: (row) => row.national_id_number },
    { header: "Total Repayable", accessor: (row) => formatUGX(row.total_repayable) },
  ],
  due: [
    { header: "ID", accessor: (row) => row.id },
    {
      header: "Vendor (Bal)",
      accessor: (row) => `${row.vendor_username} (${formatUGX(row.vendor_balance)})`,
    },
    { header: "Loan ID", accessor: (row) => row.loanId || row.applicationId },
    { header: "Due Date", accessor: (row) => row.dueDate },
    { header: "Amt Paid", accessor: (row) => formatUGX(row.amountPaid) },
    {
      header: "Days Until Due",
      accessor: (row) => (row.daysUntilDue > 0 ? row.daysUntilDue : "-"),
    },
    {
      header: "Days Overdue",
      accessor: (row) => (row.daysUntilDue < 0 ? Math.abs(row.daysUntilDue) : "-"),
    },
    { header: "Amt Due", accessor: (row) => formatUGX(row.amountDue) },
  ],
  history: [
    { header: "ID", accessor: (row) => row.id },
    { header: "Vendor", accessor: (row) => row.vendor_username },
    { header: "Loan ID", accessor: (row) => row.loanId || row.applicationId },
    { header: "Date Paid", accessor: (row) => row.paidDate },
    { header: "Amt Paid", accessor: (row) => formatUGX(row.amountPaid) },
    { header: "Method", accessor: (row) => row.paymentMethod || "-" },
    { header: "Status", accessor: (row) => row.status },
  ],
};

export default function LoanReport({ isGeneratingPDF, searchTerm, onTabChange }) {
  const { loans, repaymentBlocks, repaymentHistory, vendors, loading, error } =
    useContext(LoansContext);
  const [activeTab, setActiveTab] = useState("applications");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Notify parent of tab change
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  // Filter data based on searchTerm
  const filteredLoans = useMemo(() => {
    if (!searchTerm) return loans;
    const term = searchTerm.toLowerCase();
    return loans.filter(
      (loan) =>
        loan.id.toString().toLowerCase().includes(term) ||
        loan.vendor_username.toLowerCase().includes(term) ||
        loan.purpose.toLowerCase().includes(term) ||
        loan.status.toLowerCase().includes(term) ||
        loan.national_id_number.toLowerCase().includes(term)
    );
  }, [loans, searchTerm]);

  const filteredRepaymentBlocks = useMemo(() => {
    if (!searchTerm) return repaymentBlocks;
    const term = searchTerm.toLowerCase();
    return repaymentBlocks.filter(
      (block) =>
        block.id.toString().toLowerCase().includes(term) ||
        block.vendor_username.toLowerCase().includes(term) ||
        (block.loanId || block.applicationId)?.toString().toLowerCase().includes(term)
    );
  }, [repaymentBlocks, searchTerm]);

  const filteredRepaymentHistory = useMemo(() => {
    if (!searchTerm) return repaymentHistory;
    const term = searchTerm.toLowerCase();
    return repaymentHistory.filter(
      (history) =>
        history.id.toString().toLowerCase().includes(term) ||
        history.vendor_username.toLowerCase().includes(term) ||
        (history.loanId || history.applicationId)?.toString().toLowerCase().includes(term)
    );
  }, [repaymentHistory, searchTerm]);

  // Combined summary & leaderboard stats
  const stats = useMemo(() => {
    const overdue = filteredRepaymentBlocks.filter((r) => r.status === "Overdue");
    return {
      outstandingBalance: filteredLoans.reduce(
        (sum, l) => sum + (l.amount - (l.repaidAmount || 0)),
        0
      ),
      activeLoans: filteredLoans.filter((l) => l.status === "Active").length,
      principalDisbursed: filteredLoans.reduce((sum, l) => sum + l.amount, 0),
      interestEarned: filteredRepaymentHistory.reduce(
        (sum, r) => sum + (r.interest || 0),
        0
      ),
      totalRepayable: filteredLoans.reduce(
        (sum, l) => sum + (l.totalRepayable || 0),
        0
      ),
      totalRepaid: filteredRepaymentHistory.reduce((sum, r) => sum + r.amountPaid, 0),
      pendingApprovals: filteredLoans.filter((l) => l.status === "Pending").length,
      overdueLoans: overdue.length,
      overdueAmount: overdue.reduce((sum, r) => sum + (r.amountDue || 0), 0),
    };
  }, [filteredLoans, filteredRepaymentBlocks, filteredRepaymentHistory]);

  const summaryCards = [
    { label: "Total Active Loans", icon: Users, value: stats.activeLoans },
    { label: "Interest Earned", icon: Percent, value: stats.interestEarned, isMoney: true },
    { label: "Outstanding Balance", icon: TrendingUp, value: stats.outstandingBalance, isMoney: true },
    { label: "Total Repaid", icon: RefreshCw, value: stats.totalRepaid, isMoney: true },
    { label: "Pending Approvals", icon: Clock, value: stats.pendingApprovals },
    { label: "Overdue Loans", icon: Clock, value: stats.overdueLoans },
    { label: "Overdue Amount", icon: DollarSign, value: stats.overdueAmount, isMoney: true },
  ];

  // Rankings: sum per vendor
  const getRanking = (items, field) => {
    const map = {};
    items.forEach((item) => {
      map[item.vendor_username] = (map[item.vendor_username] || 0) + (item[field] || 0);
    });
    return Object.entries(map)
      .map(([vendor, amt]) => ({ vendor, amt }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
  };
  const disbursedRanking = useMemo(() => getRanking(filteredLoans, "amount"), [filteredLoans]);
  const repaidRanking = useMemo(() => getRanking(filteredRepaymentHistory, "amountPaid"), [
    filteredRepaymentHistory,
  ]);
  const topDisburser = disbursedRanking[0] || { vendor: "", amt: 0 };
  const topRepayer = repaidRanking[0] || { vendor: "", amt: 0 };

  // Data for tables
  const dataMap = {
    applications: filteredLoans,
    due: filteredRepaymentBlocks.filter((r) => r.status === "Upcoming" || r.status === "Overdue"),
    history: filteredRepaymentHistory,
  };

  if (loading) return <p className="p-4 text-[11px]">Loading...</p>;
  if (error) return <p className="p-4 text-red-600 text-[11px]">Error: {error}</p>;

  const renderTable = () => {
    const cols = COLUMN_CONFIG[activeTab] || [];
    const data = dataMap[activeTab] || [];
    return (
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-[10px]">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c, i) => (
                <th
                  key={i}
                  className="px-2 py-1 border text-left break-words"
                  style={{ maxWidth: i < 2 ? "120px" : "auto" }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-100">
                {cols.map((c, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-1 border text-left break-words"
                    style={{ maxWidth: ci < 2 ? "120px" : "auto" }}
                  >
                    {c.accessor(row, vendors)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {!isGeneratingPDF && (
        <div className="flex border-b bg-gray-50">
          {TABS.map((tab) => (
            <div
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 text-center py-2 cursor-pointer text-[11px] ${
                activeTab === tab.key
                  ? "bg-white border-t border-l border-r text-gray-800"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </div>
          ))}
        </div>
      )}
      <div className="p-6 flex-1 overflow-auto">
        {activeTab === "details" ? (
          <LoanDetails />
        ) : activeTab === "overview" ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
              {summaryCards.map((c, i) => (
                <div key={i} className="border rounded bg-white p-4 flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full"><c.icon size={20} /></div>
                  <div>
                    <p className="text-[11px] text-gray-500">{c.label}</p>
                    <p className="font-semibold">{c.isMoney ? formatUGX(c.value) : c.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard charts */}
            <div className="grid md:grid-cols-2 gap-8 mb-4">
              <div className="h-64">
                <h3 className="font-medium mb-2">Top 5 Disbursers</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disbursedRanking} margin={{ top:20,right:20,left:0,bottom:20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendor" tick={{ fontSize:10 }} />
                    <YAxis />
                    <Tooltip formatter={(v) => formatUGX(v)} />
                    <Bar dataKey="amt" name="Disbursed (UGX)" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <h3 className="font-medium mb-2">Top 5 Repayers</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repaidRanking} margin={{ top:20,right:20,left:0,bottom:20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vendor" tick={{ fontSize:10 }} />
                    <YAxis />
                    <Tooltip formatter={(v) => formatUGX(v)} />
                    <Bar dataKey="amt" name="Repaid (UGX)" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Separator */}
            <hr className="my-4 border-gray-300" />

            {/* Top-level highlights */}
            <div className="flex justify-between text-[11px] font-medium">
              <div>
                #1 Top Disburser: <strong>{topDisburser.vendor}</strong> – <strong>{formatUGX(topDisburser.amt)}</strong>
              </div>
              <div>
                #1 Top Repayer: <strong>{topRepayer.vendor}</strong> – <strong>{formatUGX(topRepayer.amt)}</strong>
              </div>
            </div>
          </>
        ) : (
          renderTable()
        )}
      </div>

      {isModalOpen && <LoansModal loan={selectedLoan} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}