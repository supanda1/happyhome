import React, { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '../../utils/priceFormatter';

interface Payment {
  id: string;
  order_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  gateway_name: string;
  gateway_transaction_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  refund_id: string | null;
  refund_amount: number;
  refund_status: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  initiated_at: string;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  order_number: string;
  order_amount: number;
  order_status: string;
}

interface PaymentStats {
  period: string;
  overview: {
    total_transactions: number;
    gross_amount: number;
    total_received: number;
    total_refunded: number;
    net_received: number;
    successful_count: number;
    failed_count: number;
    pending_count: number;
    refund_count: number;
    success_rate: number;
    avg_transaction_value: number;
  };
  by_gateway: Array<{
    gateway: string;
    transactions: number;
    amount_received: number;
    successful: number;
    failed: number;
    success_rate: string;
  }>;
  by_payment_method: Array<{
    method: string;
    transactions: number;
    amount_received: number;
    successful: number;
    failed: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    transactions: number;
    amount_received: number;
    successful: number;
    refunded: number;
  }>;
}

interface AuditLog {
  id: string;
  payment_id: string;
  order_id: string;
  action: string;
  previous_status: string | null;
  new_status: string;
  amount: number;
  refund_amount: number;
  gateway_name: string;
  gateway_transaction_id: string;
  triggered_by: string;
  triggered_by_user_name: string | null;
  triggered_by_user_email: string | null;
  reason: string | null;
  created_at: string;
}

interface PaymentDetail extends Payment {
  refunded_by_name: string | null;
  order_created_at: string;
}

const PaymentAuditManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gatewayFilter, setGatewayFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [hasRefund, setHasRefund] = useState<string>('');
  const [statsPeriod, setStatsPeriod] = useState<string>('30d');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  
  // Detail view
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditLog[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Custom CSS for animations matching OrdersManagement
  const customStyles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes bounce-in {
      0% { transform: scale(0.9); opacity: 0; }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.5s ease-out;
    }
    
    .animate-bounce-in {
      animation: bounce-in 0.4s ease-out;
    }
    
    .stats-3d {
      transition: all 0.3s ease;
    }
    
    .stats-3d:hover {
      transform: translateY(-4px);
    }
    
    .icon-3d {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `;

  // Fetch payments list
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      if (statusFilter) params.append('status', statusFilter);
      if (gatewayFilter) params.append('gateway', gatewayFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchEmail) params.append('customer_email', searchEmail);
      if (hasRefund) params.append('has_refund', hasRefund);
      
      const response = await fetch(`/api/admin/payments/audit?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPayments(data.data.payments);
        setTotalPages(data.data.pagination.total_pages);
        setTotalCount(data.data.pagination.total);
        setSummary(data.data.summary);
      } else {
        throw new Error(data.error || 'Failed to fetch payments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, gatewayFilter, dateFrom, dateTo, searchEmail, hasRefund]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/payments/audit/stats?period=${statsPeriod}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [statsPeriod]);

  // Fetch payment details
  const fetchPaymentDetails = async (paymentId: string) => {
    setDetailLoading(true);
    
    try {
      const response = await fetch(`/api/admin/payments/audit/${paymentId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedPayment(data.data.payment);
        setAuditTrail(data.data.audit_trail || []);
        setShowDetailModal(true);
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Export to Excel/CSV
  const exportToExcel = async () => {
    setIsExporting(true);
    
    try {
      // Fetch all payments for export (without pagination)
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('per_page', '10000'); // Get all records
      if (statusFilter) params.append('status', statusFilter);
      if (gatewayFilter) params.append('gateway', gatewayFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchEmail) params.append('customer_email', searchEmail);
      if (hasRefund) params.append('has_refund', hasRefund);
      
      const response = await fetch(`/api/admin/payments/audit?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments for export');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data.payments) {
        throw new Error('No data available for export');
      }
      
      const exportPayments = data.data.payments;
      
      // Build CSV content
      const csvData: string[][] = [];
      
      // Header row
      csvData.push(['Payment Audit Report']);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push(['Period:', dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time']);
      csvData.push(['Filters:', [
        statusFilter && `Status: ${statusFilter}`,
        gatewayFilter && `Gateway: ${gatewayFilter}`,
        hasRefund && `Has Refund: ${hasRefund}`,
        searchEmail && `Email: ${searchEmail}`
      ].filter(Boolean).join(', ') || 'None']);
      csvData.push([]);
      
      // Summary section
      if (summary) {
        csvData.push(['Summary']);
        csvData.push(['Total Transactions:', summary.total_transactions?.toString() || '0']);
        csvData.push(['Total Received:', `₹${(summary.total_received || 0).toLocaleString()}`]);
        csvData.push(['Total Refunded:', `₹${(summary.total_refunded || 0).toLocaleString()}`]);
        csvData.push(['Net Received:', `₹${(summary.net_received || 0).toLocaleString()}`]);
        csvData.push([]);
      }
      
      // Column headers
      csvData.push([
        'Date',
        'Order Number',
        'Transaction ID',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Gateway',
        'Payment Method',
        'Amount (₹)',
        'Status',
        'Refund Amount (₹)',
        'Refund Status',
        'Refund Reason',
        'Refunded At',
        'Gateway Transaction ID',
        'Razorpay Order ID',
        'Razorpay Payment ID',
        'Failure Reason',
        'Created At',
        'Completed At'
      ]);
      
      // Data rows
      exportPayments.forEach((payment: Payment) => {
        csvData.push([
          formatDateForExport(payment.created_at),
          payment.order_number || '-',
          payment.transaction_id || '-',
          payment.customer_name || '-',
          payment.customer_email || '-',
          payment.customer_phone || '-',
          payment.gateway_name || '-',
          payment.payment_method?.replace('_', ' ') || '-',
          payment.amount?.toString() || '0',
          payment.payment_status || '-',
          payment.refund_amount?.toString() || '0',
          payment.refund_status || '-',
          payment.refund_reason || '-',
          payment.refunded_at ? formatDateForExport(payment.refunded_at) : '-',
          payment.gateway_transaction_id || '-',
          payment.razorpay_order_id || '-',
          payment.razorpay_payment_id || '-',
          payment.failure_reason || '-',
          formatDateForExport(payment.created_at),
          payment.completed_at ? formatDateForExport(payment.completed_at) : '-'
        ]);
      });
      
      // Convert to CSV string with proper escaping
      const csvContent = csvData.map(row => 
        row.map(cell => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');
      
      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `payment_audit_report_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setNotification({
        type: 'success',
        message: `Successfully exported ${exportPayments.length} payment records to Excel`
      });
      
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to export data'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Format date for export
  const formatDateForExport = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'initiated': case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading && payments.length === 0) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  Loading Payment Audit
                </h3>
                <p className="text-gray-600 font-medium">Fetching payment data and audit trail...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Notification */}
          {notification && (
            <div className={`rounded-2xl p-4 border-2 shadow-2xl backdrop-blur-sm animate-bounce-in relative overflow-hidden ${
              notification.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
              'bg-blue-50/90 border-blue-200 text-blue-800'
            }`}>
              <div className={`absolute inset-0 opacity-20 ${
                notification.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                notification.type === 'error' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                'bg-gradient-to-r from-blue-400 to-indigo-400'
              }`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-3 p-2 rounded-xl shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    <span className="text-white text-lg">
                      {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                  </div>
                  <span className="font-bold text-base">{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className={`ml-4 p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${
                    notification.type === 'success' ? 'hover:bg-green-100' :
                    notification.type === 'error' ? 'hover:bg-red-100' :
                    'hover:bg-blue-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Modern Header Section - Matching OrdersManagement */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-3xl p-8 shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-white">Payment Audit</h1>
                        <p className="text-emerald-100 text-lg">Track all payments, refunds, and transaction history</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Export Button */}
                    <button
                      onClick={exportToExcel}
                      disabled={isExporting || payments.length === 0}
                      className="group relative px-6 py-3 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden flex items-center gap-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {isExporting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="relative z-10">Exporting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="relative z-10">Export Excel</span>
                        </>
                      )}
                    </button>
                    {/* Stats Card */}
                    <div className="hidden md:block">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{totalCount}</div>
                          <div className="text-sm text-emerald-100">Total Payments</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Enhanced KPI Cards - Matching OrdersManagement style */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Total Received */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <select
                      value={statsPeriod}
                      onChange={(e) => setStatsPeriod(e.target.value)}
                      className="text-xs bg-gray-100 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500"
                    >
                      <option value="7d">7D</option>
                      <option value="30d">30D</option>
                      <option value="90d">90D</option>
                      <option value="1y">1Y</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600 mb-1">{formatPrice(stats.overview.total_received)}</p>
                    <p className="text-sm font-medium text-gray-600">Total Received</p>
                  </div>
                </div>
              </div>

              {/* Total Refunded */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600 mb-1">{formatPrice(stats.overview.total_refunded)}</p>
                    <p className="text-sm font-medium text-gray-600">Total Refunded</p>
                  </div>
                </div>
              </div>

              {/* Net Received */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600 mb-1">{formatPrice(stats.overview.net_received)}</p>
                    <p className="text-sm font-medium text-gray-600">Net Received</p>
                  </div>
                </div>
              </div>

              {/* Total Transactions */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-800 mb-1">{stats.overview.total_transactions}</p>
                    <p className="text-sm font-medium text-gray-600">Transactions</p>
                  </div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-emerald-600 mb-1">{stats.overview.success_rate}%</p>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  </div>
                </div>
              </div>

              {/* Avg Transaction */}
              <div className="group stats-3d">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2.5 icon-3d">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-600 mb-1">{formatPrice(stats.overview.avg_transaction_value)}</p>
                    <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gateway Stats Card */}
          {stats && stats.by_gateway.length > 0 && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Payment Gateway Statistics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-3 font-semibold">Gateway</th>
                      <th className="pb-3 text-right font-semibold">Transactions</th>
                      <th className="pb-3 text-right font-semibold">Amount</th>
                      <th className="pb-3 text-right font-semibold">Successful</th>
                      <th className="pb-3 text-right font-semibold">Failed</th>
                      <th className="pb-3 text-right font-semibold">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.by_gateway.map((gw) => (
                      <tr key={gw.gateway} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 font-medium text-gray-800">{gw.gateway}</td>
                        <td className="py-3 text-right text-gray-600">{gw.transactions}</td>
                        <td className="py-3 text-right font-medium text-gray-800">{formatPrice(gw.amount_received)}</td>
                        <td className="py-3 text-right text-green-600 font-medium">{gw.successful}</td>
                        <td className="py-3 text-right text-red-600 font-medium">{gw.failed}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            parseFloat(gw.success_rate) >= 90 ? 'bg-green-100 text-green-700' :
                            parseFloat(gw.success_rate) >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {gw.success_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filters Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="initiated">Initiated</option>
                  <option value="processing">Processing</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Gateway</label>
                <select
                  value={gatewayFilter}
                  onChange={(e) => { setGatewayFilter(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All Gateways</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="Razorpay">Razorpay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Customer Email</label>
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
                  placeholder="Search email..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Refunds</label>
                <select
                  value={hasRefund}
                  onChange={(e) => { setHasRefund(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">All</option>
                  <option value="true">With Refunds</option>
                  <option value="false">No Refunds</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Bar */}
          {summary && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-4 flex flex-wrap gap-6 text-sm border border-green-200/50">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Filtered:</span>
                <span className="font-bold text-gray-800">{summary.total_transactions} transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Received:</span>
                <span className="font-bold text-green-600">{formatPrice(summary.total_received)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Refunded:</span>
                <span className="font-bold text-red-600">{formatPrice(summary.total_refunded)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Net:</span>
                <span className="font-bold text-blue-600">{formatPrice(summary.net_received)}</span>
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-3 font-medium">Loading payments...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <button onClick={fetchPayments} className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                  Try Again
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No payments found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-gray-600 font-bold uppercase text-xs tracking-wide">Date</th>
                      <th className="px-4 py-4 text-left text-gray-600 font-bold uppercase text-xs tracking-wide">Order</th>
                      <th className="px-4 py-4 text-left text-gray-600 font-bold uppercase text-xs tracking-wide">Customer</th>
                      <th className="px-4 py-4 text-left text-gray-600 font-bold uppercase text-xs tracking-wide">Gateway</th>
                      <th className="px-4 py-4 text-left text-gray-600 font-bold uppercase text-xs tracking-wide">Method</th>
                      <th className="px-4 py-4 text-right text-gray-600 font-bold uppercase text-xs tracking-wide">Amount</th>
                      <th className="px-4 py-4 text-right text-gray-600 font-bold uppercase text-xs tracking-wide">Refund</th>
                      <th className="px-4 py-4 text-center text-gray-600 font-bold uppercase text-xs tracking-wide">Status</th>
                      <th className="px-4 py-4 text-center text-gray-600 font-bold uppercase text-xs tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={payment.id} className={`border-b border-gray-100 hover:bg-green-50/30 transition-colors ${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-green-600">{payment.order_number || '-'}</div>
                          <div className="text-xs text-gray-400 font-mono">{payment.transaction_id?.slice(0, 12)}...</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-800">{payment.customer_name || '-'}</div>
                          <div className="text-xs text-gray-500">{payment.customer_email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                            {payment.gateway_name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4 capitalize text-gray-600">{payment.payment_method?.replace('_', ' ') || '-'}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-800">{formatPrice(payment.amount)}</td>
                        <td className="px-4 py-4 text-right">
                          {payment.refund_amount > 0 ? (
                            <span className="text-red-600 font-bold">-{formatPrice(payment.refund_amount)}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(payment.payment_status)}`}>
                            {payment.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => fetchPaymentDetails(payment.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Page <span className="font-bold text-gray-800">{page}</span> of <span className="font-bold text-gray-800">{totalPages}</span>
                  <span className="text-gray-400 ml-2">({totalCount} total records)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-bounce-in">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Payment Details</h2>
                <p className="text-sm text-gray-500 font-mono">Transaction: {selectedPayment.transaction_id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-3">Loading details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Amount</div>
                      <div className="text-2xl font-bold text-green-600 mt-1">{formatPrice(selectedPayment.amount)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</div>
                      <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold mt-2 ${getStatusColor(selectedPayment.payment_status)}`}>
                        {selectedPayment.payment_status}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Gateway</div>
                      <div className="text-lg font-bold text-gray-800 mt-1">{selectedPayment.gateway_name || '-'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Payment Method</div>
                      <div className="text-lg font-bold text-gray-800 mt-1 capitalize">{selectedPayment.payment_method?.replace('_', ' ')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Order</div>
                      <div className="text-lg font-bold text-green-600 mt-1">{selectedPayment.order_number}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/50">
                      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Created</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{formatDate(selectedPayment.created_at)}</div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200/50">
                    <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="font-semibold text-gray-800">{selectedPayment.customer_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="font-semibold text-gray-800">{selectedPayment.customer_email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>{' '}
                        <span className="font-semibold text-gray-800">{selectedPayment.customer_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gateway IDs */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200/50">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Gateway References
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Gateway Transaction ID:</span>{' '}
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{selectedPayment.gateway_transaction_id || '-'}</span>
                      </div>
                      {selectedPayment.razorpay_order_id && (
                        <div>
                          <span className="text-gray-500">Razorpay Order ID:</span>{' '}
                          <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{selectedPayment.razorpay_order_id}</span>
                        </div>
                      )}
                      {selectedPayment.razorpay_payment_id && (
                        <div>
                          <span className="text-gray-500">Razorpay Payment ID:</span>{' '}
                          <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{selectedPayment.razorpay_payment_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refund Info */}
                  {selectedPayment.refund_amount > 0 && (
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200/50">
                      <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Refund Information
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>{' '}
                          <span className="font-bold text-red-600">{formatPrice(selectedPayment.refund_amount)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className="font-semibold">{selectedPayment.refund_status}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Refunded At:</span>{' '}
                          <span className="font-semibold">{formatDate(selectedPayment.refunded_at)}</span>
                        </div>
                        {selectedPayment.refunded_by_name && (
                          <div>
                            <span className="text-gray-500">Refunded By:</span>{' '}
                            <span className="font-semibold">{selectedPayment.refunded_by_name}</span>
                          </div>
                        )}
                      </div>
                      {selectedPayment.refund_reason && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <span className="text-gray-500">Reason:</span>{' '}
                          <span className="font-semibold">{selectedPayment.refund_reason}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Failure Info */}
                  {selectedPayment.failure_reason && (
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200/50">
                      <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Failure Information
                      </h3>
                      <div className="text-sm">
                        <div>
                          <span className="text-gray-500">Failed At:</span>{' '}
                          <span className="font-semibold">{formatDate(selectedPayment.failed_at)}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-500">Reason:</span>{' '}
                          <span className="font-semibold text-red-700">{selectedPayment.failure_reason}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audit Trail */}
                  {auditTrail.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Audit Trail
                      </h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status Change</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Triggered By</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditTrail.map((log) => (
                              <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(log.created_at)}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {log.previous_status && (
                                    <>
                                      <span className="text-gray-500">{log.previous_status}</span>
                                      <span className="mx-2 text-gray-400">→</span>
                                    </>
                                  )}
                                  <span className="font-semibold text-gray-800">{log.new_status}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="capitalize font-medium">{log.triggered_by}</span>
                                  {log.triggered_by_user_name && (
                                    <span className="text-gray-500 text-xs block">{log.triggered_by_user_name}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{log.reason || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentAuditManagement;
