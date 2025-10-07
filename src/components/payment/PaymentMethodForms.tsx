/**
 * Payment Method Forms
 * 
 * Individual form components for different payment methods.
 * Each form collects the necessary data for that payment type.
 */

import React, { useState } from 'react';
import type { 
  PaymentMethodDetails, 
  CardPaymentMethod, 
  UPIPaymentMethod, 
  WalletPaymentMethod,
  NetBankingPaymentMethod,
  EMIPaymentMethod,
  BillingDetails 
} from '../../types/payment';

// ========== Card Payment Form ==========

interface CardFormProps {
  onSubmit: (paymentMethod: CardPaymentMethod, billingDetails?: BillingDetails) => void;
  isLoading?: boolean;
}

export function CardPaymentForm({ onSubmit, isLoading = false }: CardFormProps) {
  const [cardData, setCardData] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    holderName: '',
  });

  const [billingData, setBillingData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardData.number || !cardData.expMonth || !cardData.expYear || !cardData.cvc) {
      alert('Please fill in all card details');
      return;
    }

    const paymentMethod: CardPaymentMethod = {
      type: 'card',
      card: {
        last4: cardData.number.slice(-4),
        brand: detectCardBrand(cardData.number),
        expMonth: parseInt(cardData.expMonth),
        expYear: parseInt(cardData.expYear),
      },
      billingDetails: {
        name: billingData.name || cardData.holderName,
        email: billingData.email,
        phone: billingData.phone,
      },
    };

    onSubmit(paymentMethod, paymentMethod.billingDetails);
  };

  const detectCardBrand = (number: string): CardPaymentMethod['card']['brand'] => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    if (cleaned.startsWith('6')) return 'discover';
    if (cleaned.startsWith('60') || cleaned.startsWith('65')) return 'rupay';
    return 'visa';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3 text-2xl">💳</span>
          Card Information
        </h4>
        
        {/* Card Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardData.number}
            onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Expiry Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month *
            </label>
            <select
              value={cardData.expMonth}
              onChange={(e) => setCardData({ ...cardData, expMonth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                  {String(i + 1).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <select
              value={cardData.expYear}
              onChange={(e) => setCardData({ ...cardData, expYear: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">YYYY</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {/* CVC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC *
            </label>
            <input
              type="text"
              placeholder="123"
              maxLength={4}
              value={cardData.cvc}
              onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              required
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={cardData.holderName}
            onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white hover:from-orange-600 hover:via-purple-700 hover:to-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Processing...
          </div>
        ) : (
          'Pay with Card'
        )}
      </button>
    </form>
  );
}

// ========== UPI Payment Form ==========

interface UPIFormProps {
  onSubmit: (paymentMethod: UPIPaymentMethod) => void;
  isLoading?: boolean;
}

export function UPIPaymentForm({ onSubmit, isLoading = false }: UPIFormProps) {
  const [upiId, setUpiId] = useState('');
  const [flow, setFlow] = useState<'collect' | 'intent' | 'qr'>('collect');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (flow === 'collect' && !upiId) {
      alert('Please enter your UPI ID');
      return;
    }

    const paymentMethod: UPIPaymentMethod = {
      type: 'upi',
      upi: {
        vpa: flow === 'collect' ? upiId : undefined,
        flow,
      },
    };

    onSubmit(paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3 text-2xl">📱</span>
          UPI Payment
        </h4>

        {/* UPI Flow Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose UPI Method
          </label>
          <div className="grid grid-cols-1 gap-3">
            <label className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              flow === 'collect' 
                ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md' 
                : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="collect"
                  checked={flow === 'collect'}
                  onChange={(e) => setFlow(e.target.value as 'collect')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-sm bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Enter UPI ID
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Enter your registered UPI ID</div>
                </div>
              </div>
            </label>

            <label className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              flow === 'intent' 
                ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md' 
                : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="intent"
                  checked={flow === 'intent'}
                  onChange={(e) => setFlow(e.target.value as 'intent')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-sm bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Pay with UPI App
                  </div>
                  <div className="text-xs text-gray-600 mt-1">GPay, PhonePe, Paytm, BHIM</div>
                </div>
              </div>
            </label>

            <label className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              flow === 'qr' 
                ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md' 
                : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="qr"
                  checked={flow === 'qr'}
                  onChange={(e) => setFlow(e.target.value as 'qr')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-semibold text-sm bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Scan QR Code
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Scan QR code with any UPI app</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* UPI ID Input (only for collect flow) */}
        {flow === 'collect' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPI ID *
            </label>
            <input
              type="text"
              placeholder="yourname@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter your UPI ID (e.g., mobile@paytm, name@oksbi)
            </p>
          </div>
        )}

        {flow === 'intent' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                You'll be redirected to your UPI app to complete the payment.
              </div>
            </div>
          </div>
        )}

        {flow === 'qr' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4zM2 12v3a2 2 0 002 2h12a2 2 0 002-2v-3H2zm11-5a1 1 0 011 1v1a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-green-800">
                A QR code will be displayed for you to scan with any UPI app.
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white hover:from-orange-600 hover:via-purple-700 hover:to-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Processing...
          </div>
        ) : (
          'Pay with UPI'
        )}
      </button>
    </form>
  );
}

// ========== Wallet Payment Form ==========

interface WalletFormProps {
  onSubmit: (paymentMethod: WalletPaymentMethod) => void;
  isLoading?: boolean;
}

export function WalletPaymentForm({ onSubmit, isLoading = false }: WalletFormProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletPaymentMethod['wallet']['provider']>('paytm');
  const [phone, setPhone] = useState('');

  const wallets = [
    { id: 'paytm', name: 'Paytm', icon: '💰' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱' },
    { id: 'gpay', name: 'Google Pay', icon: '🔵' },
    { id: 'amazonpay', name: 'Amazon Pay', icon: '🟠' },
    { id: 'mobikwik', name: 'MobiKwik', icon: '🔷' },
    { id: 'freecharge', name: 'FreeCharge', icon: '⚡' },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentMethod: WalletPaymentMethod = {
      type: 'wallet',
      wallet: {
        provider: selectedWallet,
        phone: phone || undefined,
      },
    };

    onSubmit(paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3 text-2xl">💰</span>
          Wallet Payment
        </h4>

        {/* Wallet Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Wallet
          </label>
          <div className="grid grid-cols-2 gap-3">
            {wallets.map((wallet) => (
              <label 
                key={wallet.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                  selectedWallet === wallet.id 
                    ? 'bg-gradient-to-br from-purple-200 via-blue-200 to-indigo-300 border-purple-300 ring-1 ring-purple-200 shadow-md' 
                    : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-white to-purple-50 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value={wallet.id}
                    checked={selectedWallet === wallet.id}
                    onChange={(e) => setSelectedWallet(e.target.value as any)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-xl">{wallet.icon}</div>
                  <div>
                    <div className="font-semibold text-sm bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {wallet.name}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Phone Number (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (optional)
          </label>
          <input
            type="tel"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
          />
          <p className="text-xs text-gray-500 mt-2">
            Phone number linked to your wallet account
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white hover:from-orange-600 hover:via-purple-700 hover:to-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Processing...
          </div>
        ) : (
          `Pay with ${wallets.find(w => w.id === selectedWallet)?.name}`
        )}
      </button>
    </form>
  );
}

// ========== Net Banking Form ==========

interface NetBankingFormProps {
  onSubmit: (paymentMethod: NetBankingPaymentMethod) => void;
  isLoading?: boolean;
}

export function NetBankingPaymentForm({ onSubmit, isLoading = false }: NetBankingFormProps) {
  const [selectedBank, setSelectedBank] = useState('');

  const banks = [
    { code: 'SBI', name: 'State Bank of India' },
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'ICICI', name: 'ICICI Bank' },
    { code: 'AXIS', name: 'Axis Bank' },
    { code: 'PNB', name: 'Punjab National Bank' },
    { code: 'BOB', name: 'Bank of Baroda' },
    { code: 'KOTAK', name: 'Kotak Mahindra Bank' },
    { code: 'IDBI', name: 'IDBI Bank' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBank) {
      alert('Please select a bank');
      return;
    }

    const bankInfo = banks.find(b => b.code === selectedBank)!;
    
    const paymentMethod: NetBankingPaymentMethod = {
      type: 'netbanking',
      netbanking: {
        bank: bankInfo.name,
        bankCode: bankInfo.code,
      },
    };

    onSubmit(paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3 text-2xl">🏦</span>
          Net Banking
        </h4>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Bank *
          </label>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            required
          >
            <option value="">Choose your bank</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              You'll be redirected to your bank's secure login page to complete the payment.
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !selectedBank}
        className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
          isLoading || !selectedBank
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white hover:from-orange-600 hover:via-purple-700 hover:to-blue-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Redirecting...
          </div>
        ) : (
          'Pay with Net Banking'
        )}
      </button>
    </form>
  );
}

// ========== Cash on Delivery Form ==========

interface CODFormProps {
  onSubmit: () => void;
  amount: number;
  isLoading?: boolean;
}

export function CashOnDeliveryForm({ onSubmit, amount, isLoading = false }: CODFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-3 text-2xl">💵</span>
          Cash on Delivery
        </h4>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Amount to pay:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 bg-clip-text text-transparent">₹{amount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-semibold text-gray-900 mb-3">How it works:</h5>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">1</span>
                </div>
                <span className="text-sm text-gray-700">Pay cash when the service is delivered</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">2</span>
                </div>
                <span className="text-sm text-gray-700">Keep exact change ready for faster service</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">3</span>
                </div>
                <span className="text-sm text-gray-700">Our service provider will collect payment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 font-semibold text-sm">!</span>
                </div>
                <span className="text-sm text-gray-700">Additional convenience fee may apply</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-sm font-semibold text-yellow-800">Important Note</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Cash on delivery orders may have limited payment modification options after booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            Confirming...
          </div>
        ) : (
          'Confirm Cash on Delivery'
        )}
      </button>
    </form>
  );
}