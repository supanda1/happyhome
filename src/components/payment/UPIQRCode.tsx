import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface UPIQRCodeProps {
  merchantUpiId: string;
  merchantName: string;
  amount: number;
  orderId: string;
  onVerify?: () => void;
}

function buildUpiUri(
  upiId: string,
  name: string,
  amount: number,
  orderId: string
): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: String(amount.toFixed(2)),
    cu: 'INR',
    tn: `Order ${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

export function UPIQRCode({
  merchantUpiId,
  merchantName,
  amount,
  orderId,
  onVerify,
}: UPIQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (amount <= 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-red-200">
        <p className="text-sm text-red-600 font-medium">Invalid payment amount. Please go back and try again.</p>
      </div>
    );
  }

  const upiUri = buildUpiUri(merchantUpiId, merchantName, amount, orderId);

  useEffect(() => {
    if (!canvasRef.current) return;
    setQrError(null);
    QRCode.toCanvas(canvasRef.current, upiUri, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then(() => setQrReady(true))
      .catch(() => setQrError('Failed to generate QR code. Please use the UPI ID below to pay manually.'));
  }, [upiUri]);

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(merchantUpiId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        setCopied(false);
      });
    } else {
      try {
        const el = document.createElement('textarea');
        el.value = merchantUpiId;
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-xl">📱</span>
        Scan & Pay with any UPI App
      </div>

      {qrError ? (
        <div className="w-[220px] flex flex-col items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <span className="text-2xl">⚠️</span>
          <p className="text-xs text-red-700 font-medium">{qrError}</p>
        </div>
      ) : (
        <>
          <div
            className={`transition-opacity duration-300 ${qrReady ? 'opacity-100' : 'opacity-0'}`}
          >
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>

          {!qrReady && (
            <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          )}
        </>
      )}

      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Order #{orderId}</p>
      </div>

      <div className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <span className="text-sm font-mono text-gray-800 truncate">
          {merchantUpiId}
        </span>
        <button
          onClick={handleCopyUpi}
          className="ml-2 text-xs text-orange-600 hover:text-orange-700 font-medium shrink-0"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map((app) => (
          <span
            key={app}
            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100"
          >
            {app}
          </span>
        ))}
      </div>

      <ol className="text-xs text-gray-500 space-y-1 text-left w-full list-decimal list-inside">
        <li>Open any UPI app on your phone</li>
        <li>Tap "Scan QR" and scan the code above</li>
        <li>Confirm ₹{amount.toLocaleString('en-IN')} and pay</li>
        <li>Click "I've Paid" once done</li>
      </ol>

      {onVerify && (
        <button
          onClick={onVerify}
          className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
        >
          ✓ I've Completed the Payment
        </button>
      )}

      <p className="text-xs text-gray-400 text-center">
        🔒 Secure Payment · PCI DSS Certified
      </p>
    </div>
  );
}
