import type {
  PaymentService,
  PaymentIntent,
  PaymentIntentResponse,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  Refund,
  CreateRefundRequest,
  PaymentWebhookEvent,
  PaymentMethod,
  PaymentStatus,
  PaymentError,
} from '../../types/payment';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://happyhomesworld.com/api';
const FETCH_TIMEOUT_MS = 15_000;

function makePaymentError(code: string, message: string): PaymentError {
  return { code, type: 'api_error', message };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw makePaymentError(
        'request_timeout',
        'The payment server took too long to respond. Please check your internet connection and try again.'
      );
    }
    throw makePaymentError(
      'network_error',
      'Unable to reach the payment server. Please check your internet connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }
}

async function parseJSONSafely(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    throw makePaymentError(
      'invalid_response',
      'The payment server returned an unexpected response. Please try again.'
    );
  }
}

function mapStatus(backendStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    pending: 'pending',
    initiated: 'pending',
    processing: 'processing',
    success: 'succeeded',
    failed: 'failed',
    cancelled: 'cancelled',
    refunded: 'refunded',
    partially_refunded: 'partially_refunded',
  };
  return statusMap[backendStatus] ?? 'pending';
}

function buildPaymentIntent(
  backendPayment: Record<string, any>,
  orderId: string,
  paymentMethod: PaymentMethod
): PaymentIntent {
  return {
    id: backendPayment.id,
    amount: backendPayment.amount,
    currency: 'INR',
    status: mapStatus(backendPayment.payment_status ?? 'initiated'),
    provider: 'backend' as any,
    paymentMethod,
    orderId,
    customerEmail: backendPayment.customer_email,
    providerTransactionId: backendPayment.transaction_id,
    providerData: {
      payment_form: backendPayment.payment_form,
      gateway_url: backendPayment.gateway_url,
    },
    createdAt: new Date(backendPayment.created_at ?? Date.now()),
    updatedAt: new Date(),
  };
}

export class BackendPaymentService implements PaymentService {
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> {
    if (!request.orderId?.trim()) {
      throw makePaymentError('invalid_order', 'Order ID is required to initiate payment.');
    }
    if (!request.amount || request.amount <= 0) {
      throw makePaymentError('invalid_amount', 'Payment amount must be greater than zero.');
    }

    const body = {
      order_id: request.orderId,
      payment_method: this.mapToBackendMethod(request.paymentMethod ?? 'card'),
      return_url: `${window.location.origin}/api/payments/callback`,
      customer_data: {
        email: request.customerEmail,
        phone: request.customerPhone,
      },
    };

    const res = await fetchWithTimeout(`${API_BASE}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await parseJSONSafely(res);

    if (res.status === 404) {
      throw makePaymentError('order_not_found', 'The order could not be found. Please go back and try again.');
    }
    if (res.status === 400) {
      const msg = data.error ?? '';
      if (msg.includes('already paid')) {
        throw makePaymentError('already_paid', 'This order has already been paid.');
      }
      if (msg.includes('in progress')) {
        throw makePaymentError('payment_in_progress', 'A payment is already in progress for this order. Please wait a moment and try again.');
      }
      throw makePaymentError('bad_request', data.error ?? 'Invalid payment request. Please check your details and try again.');
    }
    if (res.status === 401 || res.status === 403) {
      throw makePaymentError('auth_error', 'Your session has expired. Please log in again to continue.');
    }
    if (!res.ok || !data.success) {
      throw makePaymentError(
        'initiate_failed',
        data.error ?? 'Payment could not be initiated. Please try again in a moment.'
      );
    }

    if (!data.payment_form) {
      throw makePaymentError(
        'gateway_unavailable',
        'The payment gateway is temporarily unavailable. Please try again in a few minutes.'
      );
    }

    const paymentIntent = buildPaymentIntent(
      data.payment,
      request.orderId,
      request.paymentMethod ?? 'card'
    );

    paymentIntent.providerData = {
      ...paymentIntent.providerData,
      payment_form: data.payment_form,
      gateway_url: data.gateway_url,
    };

    return {
      paymentIntent,
      nextAction: { type: 'redirect_to_url', redirectUrl: data.gateway_url },
    };
  }

  async confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentIntentResponse> {
    const hash = window.location.hash;
    const isSuccess = hash.includes('checkout-success');
    const params = new URLSearchParams(hash.split('?')[1] ?? '');
    const status: PaymentStatus = isSuccess ? 'succeeded' : 'failed';

    const rawReason = params.get('reason');
    const failureReason = rawReason
      ? decodeURIComponent(rawReason)
      : 'Your payment was not completed. Please try again or contact your bank.';

    const paymentIntent: PaymentIntent = {
      id: request.paymentIntentId,
      amount: 0,
      currency: 'INR',
      status,
      provider: 'backend' as any,
      orderId: params.get('orderId') ?? '',
      providerTransactionId: params.get('transactionId') ?? undefined,
      failureReason: isSuccess ? undefined : failureReason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { paymentIntent };
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    const hash = window.location.hash;
    const status: PaymentStatus = hash.includes('checkout-success')
      ? 'succeeded'
      : hash.includes('checkout-failed')
      ? 'failed'
      : 'processing';

    return {
      id,
      amount: 0,
      currency: 'INR',
      status,
      provider: 'backend' as any,
      orderId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async cancelPaymentIntent(id: string): Promise<PaymentIntent> {
    return {
      id,
      amount: 0,
      currency: 'INR',
      status: 'cancelled',
      provider: 'backend' as any,
      orderId: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createRefund(_request: CreateRefundRequest): Promise<Refund> {
    throw makePaymentError(
      'refund_not_supported',
      'Refunds must be processed from the Admin Panel. Please contact support if you need an immediate refund.'
    );
  }

  async getRefund(_id: string): Promise<Refund> {
    throw makePaymentError(
      'refund_lookup_unavailable',
      'Refund status lookup is not available yet. Please contact support for refund status.'
    );
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true;
  }

  async handleWebhook(_payload: string): Promise<PaymentWebhookEvent> {
    throw new Error('Webhook handling is done server-side by the Node.js backend');
  }

  isConfigured(): boolean {
    return true;
  }

  getSupportedPaymentMethods(): PaymentMethod[] {
    return ['card', 'upi', 'netbanking', 'wallet', 'emi'];
  }

  async getUPIQR(
    orderId: string,
    amount: number
  ): Promise<{ upiUri: string; qrDataUrl: string; merchantUpiId: string }> {
    if (!orderId?.trim()) {
      throw makePaymentError('invalid_order', 'Order ID is required to generate UPI QR.');
    }
    if (!amount || amount <= 0) {
      throw makePaymentError('invalid_amount', 'A valid payment amount is required to generate UPI QR.');
    }

    const params = new URLSearchParams({
      order_id: orderId,
      amount: String(amount),
    });

    const res = await fetchWithTimeout(`${API_BASE}/api/payments/upi-qr?${params}`, {
      credentials: 'include',
    });

    const data = await parseJSONSafely(res);

    if (!res.ok || !data.success) {
      throw makePaymentError(
        'qr_generation_failed',
        data.error ?? 'Could not generate the UPI QR code. Please try the manual UPI ID below instead.'
      );
    }

    return {
      upiUri: data.upi_uri,
      qrDataUrl: data.qr_data_url,
      merchantUpiId: data.merchant_upi_id,
    };
  }

  private mapToBackendMethod(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      card: 'credit_card',
      upi: 'upi',
      netbanking: 'net_banking',
      wallet: 'wallet',
      emi: 'emi',
      cash_on_delivery: 'upi',
      bank_transfer: 'net_banking',
    };
    return map[method] ?? 'credit_card';
  }
}

export const backendPaymentService = new BackendPaymentService();
