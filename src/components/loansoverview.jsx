import React, { useEffect, useState, useContext } from 'react';
import { Users, DollarSign, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import loanIcon from '../assets/money-icon.png';
import LoanRepayments from './loansvendors';
import { LoansContext } from '../context/loanscontext';

const formatUGX = (num) => (num != null ? `UGX ${num.toLocaleString('en-UG')}` : 'UGX 0');

export default function LoanOverview() {
  const { loans, loading, error } = useContext(LoansContext);
  const [stats, setStats] = useState({
    outstandingBalance: 0,
    activeLoans: 0,
    principalDisbursed: 0,
    interestEarned: 0,
    totalRepayable: 0,
    totalRepaid: 0,
    pendingApprovals: 0,
    overdueLoans: 0,
    totalSales: 0,
  });

  useEffect(() => {
    if (loading) return;

    const calculatedStats = {
      outstandingBalance: loans.reduce((sum, l) => sum + (parseFloat(l.current_balance) || 0), 0),
      activeLoans: loans.filter(l => l.status === 'Active').length,
      principalDisbursed: loans.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0),
      interestEarned: loans.reduce((sum, l) => sum + ((parseFloat(l.total_repayable) || 0) - (parseFloat(l.amount) || 0)), 0),
      totalRepayable: loans.reduce((sum, l) => sum + (parseFloat(l.total_repayable) || 0), 0),
      totalRepaid: loans.reduce((sum, l) => sum + ((parseFloat(l.total_repayable) || 0) - (parseFloat(l.current_balance) || 0)), 0),
      pendingApprovals: loans.filter(l => l.status === 'Pending').length,
      overdueLoans: loans.filter(l => l.next_payment_date && new Date(l.next_payment_date) < new Date()).length,
      totalSales: 0,
    };
    setStats(calculatedStats);

    const fetchTotalSales = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/sales/analytics`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({ ...prev, totalSales: data.total_sales || data.totalAmount || 0 }));
        }
      } catch (err) {
        console.error('Sales fetch error:', err);
      }
    };
    fetchTotalSales();
  }, [loans, loading]);

  const summary = { value: stats.principalDisbursed };

  const cards = [
    { label: 'Total Active Loans', icon: Users, value: stats.activeLoans, isMonetary: false },
    { label: 'Outstanding Balance', icon: TrendingUp, value: stats.outstandingBalance, isMonetary: true },
    { label: 'Total Repaid', icon: RefreshCw, value: stats.totalRepaid, isMonetary: true },
    { label: 'Pending Approvals', icon: Clock, value: stats.pendingApprovals, isMonetary: false },
    { label: 'Overdue Loans', icon: Clock, value: stats.overdueLoans, isMonetary: false },
    // { label: 'Total Sales Amount', icon: DollarSign, value: stats.totalSales, isMonetary: true },
  ];

  if (loading) {
    return (
      <div className="w-full p-4 flex flex-col items-center justify-center h-64">
        <p className="text-gray-600">Loading loan data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 flex flex-col items-center justify-center h-64">
        <p className="text-red-600">Error: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
        <div className="col-span-1 lg:col-span-2 border rounded bg-white p-4 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Principal Disbursed</h2>
            <img src={loanIcon} alt="Loans" className="w-10 h-10" />
          </div>
          <div className="flex items-center mt-4">
            <h1 className="text-3xl font-bold text-gray-900">{formatUGX(summary.value)}</h1>
          </div>
        </div>

        {cards.map((c, idx) => (
          <div key={idx} className="border rounded bg-white p-4 flex items-center space-x-3 shadow-sm">
            <div className="p-2 bg-gray-100 rounded-full">
              <c.icon size={20} className="text-gray-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="font-semibold text-gray-900">{c.isMonetary ? formatUGX(c.value) : c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <LoanRepayments /> 
      </div>
    </div>
  );
}