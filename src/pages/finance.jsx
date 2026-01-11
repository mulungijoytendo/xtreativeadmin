// pages/Finance.js
import React from 'react';
import Sidebar from '../components/sidebar';
import Header from '../components/header';
import { DateProvider } from '../context/datecontext';
import FinanceOverview from '../components/financeoverview';

const Finance = () => {
  return (
    <DateProvider>
      <div className="h-screen font-poppins flex flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-gray-100 ml-[80px] overflow-hidden">
            {/* Scrollable wrapper */}
            <div className="h-full overflow-y-auto p-4">
              <FinanceOverview />
            </div>
          </main>
        </div>
      </div>
    </DateProvider>
  );
};

export default Finance;