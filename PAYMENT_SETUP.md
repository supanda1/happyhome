# Payment Gateway Setup Guide

This guide explains how to configure and use the payment gateway system in the Happy Homes application.

## 🏗️ Architecture Overview

The payment system is designed with a **provider-agnostic architecture** that supports multiple payment gateways:

- **Mock Gateway**: For development and testing
- **Stripe**: Global card payments
- **Razorpay**: Complete Indian payment ecosystem
- **PayPal**: International payments
- **Square**: Point of sale and online payments
- **Paytm, PhonePe, GPay**: Indian digital wallets

## 🚀 Quick Start (Development)

The system works out of the box with the **mock payment provider** for development:

```bash
# Clone and install
npm install

# Start development (uses mock payments by default)
npm run dev
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file for frontend configuration:

```env
# Payment Provider Selection
VITE_PAYMENT_PROVIDER=mock  # Options: mock, stripe, razorpay, paypal, square

# Stripe Configuration (if using Stripe)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_ENVIRONMENT=sandbox  # or production

# Razorpay Configuration (if using Razorpay)
VITE_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=rzp_test_...
RAZORPAY_WEBHOOK_SECRET=webhook_secret
VITE_RAZORPAY_ENVIRONMENT=sandbox  # or production

# PayPal Configuration (if using PayPal)
VITE_PAYPAL_CLIENT_ID=paypal_client_id
PAYPAL_CLIENT_SECRET=paypal_client_secret
VITE_PAYPAL_ENVIRONMENT=sandbox  # or production
```

### Backend Environment (.env for backend)

```env
# Same payment provider configs as above (without VITE_ prefix for backend)
PAYMENT_PROVIDER=mock
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_SECRET=rzp_test_...
PAYPAL_CLIENT_SECRET=paypal_secret...
```

## 🔧 Provider Setup Instructions

### 1. Mock Provider (Development)
```env
VITE_PAYMENT_PROVIDER=mock
```
- ✅ No additional setup required
- ✅ Test different payment scenarios
- ✅ Simulates real payment flows

### 2. Stripe Setup
1. **Create Stripe Account**: [https://stripe.com](https://stripe.com)
2. **Get API Keys**:
   ```env
   VITE_PAYMENT_PROVIDER=stripe
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # From Stripe Dashboard
   STRIPE_SECRET_KEY=sk_test_...            # From Stripe Dashboard
   ```
3. **Setup Webhooks**:
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.*`, `refund.*`
   - Copy webhook secret: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 3. Razorpay Setup (India)
1. **Create Razorpay Account**: [https://razorpay.com](https://razorpay.com)
2. **Get API Keys**:
   ```env
   VITE_PAYMENT_PROVIDER=razorpay
   VITE_RAZORPAY_KEY_ID=rzp_test_...        # From Razorpay Dashboard
   RAZORPAY_KEY_SECRET=rzp_test_...         # From Razorpay Dashboard
   ```
3. **Setup Webhooks**:
   - Add endpoint: `https://yourdomain.com/api/webhooks/razorpay`
   - Enable events: `payment.*`, `refund.*`
   - Set webhook secret: `RAZORPAY_WEBHOOK_SECRET=your_secret`

### 4. PayPal Setup
1. **Create PayPal Developer Account**: [https://developer.paypal.com](https://developer.paypal.com)
2. **Create Application**:
   ```env
   VITE_PAYMENT_PROVIDER=paypal
   VITE_PAYPAL_CLIENT_ID=paypal_client_id   # From PayPal App
   PAYPAL_CLIENT_SECRET=paypal_secret       # From PayPal App
   ```
3. **Configure Webhooks**:
   - Add endpoint: `https://yourdomain.com/api/webhooks/paypal`
   - Subscribe to: `CHECKOUT.ORDER.COMPLETED`, `PAYMENT.CAPTURE.COMPLETED`

## 🛠️ Backend Integration

### Express.js Webhook Setup

```typescript
// server.js or app.js
import express from 'express';
import { handlePaymentWebhookRoute } from './src/utils/paymentWebhooks';

const app = express();

// Webhook endpoints for different providers
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handlePaymentWebhookRoute);
app.post('/api/webhooks/razorpay', express.json(), handlePaymentWebhookRoute);
app.post('/api/webhooks/paypal', express.json(), handlePaymentWebhookRoute);
```

### Database Schema Updates

Add payment-related fields to your orders table:

```sql
ALTER TABLE orders ADD COLUMN payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN paid_at TIMESTAMP NULL;
```

## 🧪 Testing

### Mock Payment Testing

The mock provider provides test scenarios:

```typescript
// Test successful payment
const testCard = '4242424242424242';

// Test declined payment  
const declinedCard = '4000000000000002';

// Test insufficient funds
const insufficientCard = '4000000000009995';

// Test 3D Secure flow
const threeDSCard = '4000000000003220';

// Test UPI IDs
const successUPI = 'success@upi';
const failureUPI = 'failure@upi';
```

### Production Testing

1. **Test Mode Keys**: Use test/sandbox keys initially
2. **Small Amounts**: Test with small amounts first
3. **Webhook Testing**: Use tools like ngrok for local webhook testing
4. **Real Cards**: Use your own cards for final testing

## 🔄 Switching Providers

To switch payment providers, simply change the environment variable:

```bash
# Switch to Razorpay
VITE_PAYMENT_PROVIDER=razorpay

# Switch to Stripe  
VITE_PAYMENT_PROVIDER=stripe

# Switch back to mock for development
VITE_PAYMENT_PROVIDER=mock
```

The system automatically:
- ✅ Loads the correct provider configuration
- ✅ Shows appropriate payment methods
- ✅ Handles provider-specific flows
- ✅ Processes webhooks correctly

## 🎨 UI Customization

### Payment Form Theming

```typescript
<PaymentForm
  amount={1000}
  currency="INR"
  orderId="ORDER123"
  theme="light"  // or "dark"
  className="custom-payment-form"
  allowedMethods={['card', 'upi', 'wallet']}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

### Custom Payment Methods

You can restrict which payment methods are shown:

```typescript
// Only show cards and UPI
allowedMethods={['card', 'upi']}

// Show all available methods
allowedMethods={undefined}  // or don't pass the prop
```

## 📱 Mobile Optimization

The payment forms are fully responsive and mobile-optimized:

- ✅ Touch-friendly interfaces
- ✅ Mobile keyboard optimization
- ✅ App deep-linking for UPI/wallets
- ✅ Progressive Web App support

## 🔒 Security Best Practices

### API Keys Security
- ✅ Never commit API keys to version control
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for test/production

### Frontend Security
- ✅ Only publishable keys in frontend
- ✅ Secret keys only on backend
- ✅ HTTPS in production
- ✅ Webhook signature verification

### Data Protection
- ✅ No sensitive card data stored
- ✅ PCI DSS compliance through providers
- ✅ Encrypted data transmission
- ✅ Audit logs for all transactions

## 🚨 Troubleshooting

### Common Issues

1. **Payment failing immediately**
   ```bash
   # Check configuration
   npm run build  # Look for config validation errors
   ```

2. **Webhooks not working**
   ```bash
   # Test webhook endpoint
   curl -X POST http://localhost:3000/api/webhooks/stripe \
        -H "Content-Type: application/json" \
        -d '{"test": true}'
   ```

3. **Environment variables not loading**
   ```bash
   # Restart development server
   npm run dev
   ```

### Debug Mode

Enable debug logging:

```env
# Add to .env.local
VITE_PAYMENT_DEBUG=true
```

This will log:
- 🔍 Payment initialization
- 🔍 Provider selection
- 🔍 API calls and responses
- 🔍 Webhook events

## 📚 API Reference

### PaymentService Interface

```typescript
interface PaymentService {
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse>;
  confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentIntentResponse>;
  getPaymentIntent(id: string): Promise<PaymentIntent>;
  cancelPaymentIntent(id: string): Promise<PaymentIntent>;
  createRefund(request: CreateRefundRequest): Promise<Refund>;
  // ... more methods
}
```

### Payment Context Hooks

```typescript
// Main payment hook
const { 
  currentPayment, 
  isProcessing, 
  error,
  initializePayment,
  confirmPayment 
} = usePayment();

// Status checking
const { isSuccessful, isFailed } = usePaymentStatus();

// Configuration checking  
const isReady = usePaymentReady();
```

## 🌍 Multi-Currency Support

The system supports multiple currencies:

```typescript
// Indian Rupees (primary)
currency: 'INR'

// US Dollars
currency: 'USD'

// Euros
currency: 'EUR'

// British Pounds
currency: 'GBP'
```

## 📈 Analytics Integration

Track payment metrics:

```typescript
// Payment success rate
const successRate = totalSuccessful / totalAttempts;

// Popular payment methods
const methodStats = groupBy(payments, 'paymentMethod');

// Revenue analytics
const monthlyRevenue = payments
  .filter(p => p.status === 'succeeded')
  .reduce((sum, p) => sum + p.amount, 0);
```

## 🔮 Future Enhancements

Planned features:

- 🚀 **Subscription payments**
- 🚀 **Split payments**  
- 🚀 **Marketplace escrow**
- 🚀 **Crypto payment support**
- 🚀 **Buy now, pay later (BNPL)**
- 🚀 **QR code generation**

## 📞 Support

For payment integration support:

1. **Documentation**: Check this guide first
2. **Provider Docs**: Stripe/Razorpay official documentation  
3. **Issues**: Create GitHub issue with payment logs
4. **Community**: Join our Discord for real-time help

## 📄 License

Payment integration code follows the same license as the main project.