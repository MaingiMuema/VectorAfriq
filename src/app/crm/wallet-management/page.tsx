/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import WalletTable from '@/components/wallet/WalletTable';
import WalletFilters from '@/components/wallet/WalletFilters';
import TopUpModal from '@/components/wallet/TopUpModal';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference: string;
}

export default function WalletManagementPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/wallet');
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance);
        setAllTransactions(data.transactions);
        setTransactions(data.transactions);
      } else {
        toast.error('Failed to load wallet data');
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    const filtered = allTransactions.filter(transaction =>
      transaction.description.toLowerCase().includes(query.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(query.toLowerCase())
    );
    setTransactions(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...allTransactions];

    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(transaction => transaction.status === filters.status);
    }
    if (filters.dateRange) {
      const today = new Date();
      const startDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(transaction =>
            new Date(transaction.date).toDateString() === today.toDateString()
          );
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(transaction =>
            new Date(transaction.date) >= startDate && new Date(transaction.date) <= today
          );
          break;
        case 'month':
          startDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(transaction =>
            new Date(transaction.date) >= startDate && new Date(transaction.date) <= today
          );
          break;
        case 'year':
          startDate.setFullYear(today.getFullYear() - 1);
          filtered = filtered.filter(transaction =>
            new Date(transaction.date) >= startDate && new Date(transaction.date) <= today
          );
          break;
      }
    }
    if (filters.amountRange) {
      const [min, max] = filters.amountRange.split('-').map(Number);
      filtered = filtered.filter(transaction =>
        transaction.amount >= min && (max ? transaction.amount <= max : true)
      );
    }

    setTransactions(filtered);
  };

  const handleExportTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const csvContent = `Date,Type,Amount,Description,Status,Reference\n${new Date(transaction.date).toLocaleDateString()},${transaction.type},${transaction.amount},${transaction.description},${transaction.status},${transaction.reference}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `transaction-${transaction.reference}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportAll = () => {
    const csvContent = [
      'Date,Type,Amount,Description,Status,Reference',
      ...transactions.map(transaction =>
        `${new Date(transaction.date).toLocaleDateString()},${transaction.type},${transaction.amount},${transaction.description},${transaction.status},${transaction.reference}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'all-transactions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your wallet and track transactions
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchWalletData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            Refresh
          </button>
          <button
            onClick={handleExportAll}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export All
          </button>
          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#468AD1] hover:bg-[#2F6FAE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Top Up Wallet
          </button>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiDollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Balance</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {loading ? '...' : `KES ${walletBalance.toLocaleString()}`}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiCreditCard className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {loading ? '...' : transactions.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <WalletFilters onSearch={handleSearch} onFilter={handleFilter} />

      {/* Transaction Table */}
      <WalletTable
        transactions={transactions}
        onExportTransaction={handleExportTransaction}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />
    </div>
  );
}
