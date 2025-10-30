"""
ICICI Payment Gateway Integration Service.

This service handles all payment operations with ICICI Gateway including:
- Payment initiation and form generation
- Callback processing and verification  
- Refund processing
- Transaction status inquiry
- Webhook processing
"""

import hashlib
import hmac
import json
import logging
import urllib.parse
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import httpx
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

from ..core.config import get_settings
from ..models.payment import Payment, PaymentWebhook, PaymentMethod, PaymentStatus
from ..models.order import Order
from ..database.connection import get_db_session

logger = logging.getLogger(__name__)
settings = get_settings()


class ICICIPaymentError(Exception):
    """Custom exception for ICICI payment gateway errors."""
    pass


class ICICIPaymentService:
    """
    ICICI Payment Gateway integration service.
    
    Handles all payment operations including initiation, verification,
    and callback processing for ICICI Gateway.
    """
    
    def __init__(self):
        """Initialize ICICI payment service with configuration."""
        self.merchant_id = settings.ICICI_MERCHANT_ID
        self.access_code = settings.ICICI_ACCESS_CODE
        self.working_key = settings.ICICI_WORKING_KEY
        self.gateway_url = settings.ICICI_GATEWAY_URL
        self.redirect_url = settings.ICICI_REDIRECT_URL
        self.cancel_url = settings.ICICI_CANCEL_URL
        
    def _encrypt_data(self, data: str) -> str:
        """Encrypt data using AES encryption for ICICI Gateway."""
        try:
            # Convert working key to bytes
            key = self.working_key.encode('utf-8')
            
            # Pad key to 16 bytes if needed
            if len(key) < 16:
                key = key.ljust(16, b'\0')
            elif len(key) > 16:
                key = key[:16]
            
            # Create cipher
            cipher = AES.new(key, AES.MODE_CBC, key)
            
            # Encrypt data
            padded_data = pad(data.encode('utf-8'), AES.block_size)
            encrypted = cipher.encrypt(padded_data)
            
            # Return base64 encoded string
            return base64.b64encode(encrypted).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise ICICIPaymentError(f"Failed to encrypt data: {str(e)}")
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data received from ICICI Gateway."""
        try:
            # Convert working key to bytes
            key = self.working_key.encode('utf-8')
            
            # Pad key to 16 bytes if needed
            if len(key) < 16:
                key = key.ljust(16, b'\0')
            elif len(key) > 16:
                key = key[:16]
            
            # Create cipher
            cipher = AES.new(key, AES.MODE_CBC, key)
            
            # Decrypt data
            encrypted_bytes = base64.b64decode(encrypted_data)
            decrypted = cipher.decrypt(encrypted_bytes)
            
            # Unpad and return
            unpadded = unpad(decrypted, AES.block_size)
            return unpadded.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise ICICIPaymentError(f"Failed to decrypt data: {str(e)}")
    
    def _generate_checksum(self, data: Dict[str, str]) -> str:
        """Generate checksum for ICICI Gateway request."""
        try:
            # Sort parameters by key
            sorted_params = sorted(data.items())
            
            # Create query string
            query_string = "&".join([f"{k}={v}" for k, v in sorted_params])
            
            # Add working key
            query_string += f"&{self.working_key}"
            
            # Generate MD5 hash
            checksum = hashlib.md5(query_string.encode('utf-8')).hexdigest()
            
            return checksum.upper()
            
        except Exception as e:
            logger.error(f"Checksum generation error: {str(e)}")
            raise ICICIPaymentError(f"Failed to generate checksum: {str(e)}")
    
    def _verify_checksum(self, response_data: Dict[str, str], received_checksum: str) -> bool:
        """Verify checksum from ICICI Gateway response."""
        try:
            # Remove checksum from response data for verification
            verification_data = {k: v for k, v in response_data.items() if k != 'checksum'}
            
            # Generate expected checksum
            expected_checksum = self._generate_checksum(verification_data)
            
            return expected_checksum == received_checksum.upper()
            
        except Exception as e:
            logger.error(f"Checksum verification error: {str(e)}")
            return False
    
    async def initiate_payment(
        self,
        order: Order,
        payment_method: PaymentMethod,
        customer_data: Dict[str, str] = None
    ) -> Tuple[Payment, str]:
        """
        Initiate payment with ICICI Gateway.
        
        Args:
            order: Order instance to create payment for
            payment_method: Selected payment method
            customer_data: Additional customer data if needed
            
        Returns:
            Tuple of (Payment instance, Payment form HTML)
        """
        try:
            async with get_db_session() as session:
                # Create payment record
                payment = Payment(
                    order_id=order.id,
                    transaction_id=Payment().generate_transaction_id(),
                    amount=order.final_amount,
                    currency="INR",
                    payment_method=payment_method,
                    payment_status=PaymentStatus.INITIATED,
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                    customer_phone=order.customer_phone,
                    merchant_id=self.merchant_id,
                    access_code=self.access_code,
                    initiated_at=datetime.utcnow()
                )
                
                session.add(payment)
                await session.commit()
                await session.refresh(payment)
                
                # Prepare payment parameters
                payment_params = {
                    "merchant_id": self.merchant_id,
                    "order_id": payment.transaction_id,
                    "currency": "INR",
                    "amount": str(payment.amount),
                    "redirect_url": self.redirect_url,
                    "cancel_url": self.cancel_url,
                    "language": "EN",
                    "billing_name": payment.customer_name,
                    "billing_address": json.dumps(order.service_address),
                    "billing_city": order.service_address.get("city", ""),
                    "billing_state": order.service_address.get("state", ""),
                    "billing_zip": order.service_address.get("pincode", ""),
                    "billing_country": "India",
                    "billing_tel": payment.customer_phone,
                    "billing_email": payment.customer_email,
                    "delivery_name": payment.customer_name,
                    "delivery_address": json.dumps(order.service_address),
                    "delivery_city": order.service_address.get("city", ""),
                    "delivery_state": order.service_address.get("state", ""),
                    "delivery_zip": order.service_address.get("pincode", ""),
                    "delivery_country": "India",
                    "delivery_tel": payment.customer_phone,
                    "merchant_param1": str(order.id),
                    "merchant_param2": payment_method.value,
                    "merchant_param3": order.order_number,
                    "promo_code": "",
                    "customer_identifier": str(order.customer_id),
                }
                
                # Add payment method specific parameters
                if payment_method == PaymentMethod.CREDIT_CARD:
                    payment_params["payment_option"] = "OPTCRDC"
                elif payment_method == PaymentMethod.DEBIT_CARD:
                    payment_params["payment_option"] = "OPTDBDC"
                elif payment_method == PaymentMethod.NET_BANKING:
                    payment_params["payment_option"] = "OPTNBK"
                elif payment_method == PaymentMethod.UPI:
                    payment_params["payment_option"] = "OPTUPI"
                elif payment_method == PaymentMethod.WALLET:
                    payment_params["payment_option"] = "OPTWLT"
                
                # Generate and add checksum
                checksum = self._generate_checksum(payment_params)
                payment_params["checksum"] = checksum
                
                # Store checksum in payment record
                payment.checksum = checksum
                await session.commit()
                
                # Encrypt sensitive data
                encrypted_data = self._encrypt_data(urllib.parse.urlencode(payment_params))
                
                # Generate payment form HTML
                form_html = self._generate_payment_form(encrypted_data)
                
                logger.info(f"Payment initiated: {payment.transaction_id} for order {order.order_number}")
                
                return payment, form_html
                
        except Exception as e:
            logger.error(f"Payment initiation failed: {str(e)}")
            raise ICICIPaymentError(f"Payment initiation failed: {str(e)}")
    
    def _generate_payment_form(self, encrypted_data: str) -> str:
        """Generate HTML form for payment submission."""
        form_html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Redirecting to ICICI Payment Gateway</title>
            <meta charset="utf-8">
        </head>
        <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h3>Redirecting to ICICI Payment Gateway...</h3>
                <p>Please wait while we redirect you to the secure payment page.</p>
                <form id="paymentForm" method="post" action="{self.gateway_url}">
                    <input type="hidden" name="encRequest" value="{encrypted_data}">
                    <input type="hidden" name="access_code" value="{self.access_code}">
                    <input type="submit" value="Click here if not redirected automatically" 
                           style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                </form>
            </div>
            <script>
                document.getElementById('paymentForm').submit();
            </script>
        </body>
        </html>
        '''
        return form_html
    
    async def handle_payment_callback(self, callback_data: Dict[str, str]) -> Payment:
        """
        Handle payment callback from ICICI Gateway.
        
        Args:
            callback_data: Callback data from gateway
            
        Returns:
            Updated Payment instance
        """
        try:
            # Decrypt response data
            encrypted_response = callback_data.get("encResp", "")
            if not encrypted_response:
                raise ICICIPaymentError("No encrypted response data received")
            
            decrypted_data = self._decrypt_data(encrypted_response)
            response_params = dict(urllib.parse.parse_qsl(decrypted_data))
            
            # Verify checksum
            received_checksum = response_params.get("checksum", "")
            if not self._verify_checksum(response_params, received_checksum):
                raise ICICIPaymentError("Checksum verification failed")
            
            # Get payment record
            order_id = response_params.get("order_id", "")
            
            async with get_db_session() as session:
                payment = await session.get(Payment, {"transaction_id": order_id})
                if not payment:
                    raise ICICIPaymentError(f"Payment not found for transaction: {order_id}")
                
                # Update payment with gateway response
                payment.gateway_transaction_id = response_params.get("tracking_id", "")
                payment.gateway_response = response_params
                payment.gateway_status_code = response_params.get("order_status", "")
                payment.gateway_status_message = response_params.get("status_message", "")
                payment.is_verified = True
                payment.completed_at = datetime.utcnow()
                
                # Determine payment status
                order_status = response_params.get("order_status", "").upper()
                if order_status == "SUCCESS":
                    payment.payment_status = PaymentStatus.SUCCESS
                elif order_status in ["FAILURE", "ABORTED"]:
                    payment.payment_status = PaymentStatus.FAILED
                elif order_status == "INVALID":
                    payment.payment_status = PaymentStatus.CANCELLED
                else:
                    payment.payment_status = PaymentStatus.FAILED
                
                # Update payment instrument details if available
                if response_params.get("card_name"):
                    payment.card_type = response_params.get("card_name")
                if response_params.get("payment_mode"):
                    payment.bank_name = response_params.get("payment_mode")
                
                # Mask sensitive data
                payment.mask_sensitive_data()
                
                await session.commit()
                await session.refresh(payment)
                
                logger.info(f"Payment callback processed: {payment.transaction_id} - Status: {payment.payment_status}")
                
                return payment
                
        except Exception as e:
            logger.error(f"Payment callback processing failed: {str(e)}")
            raise ICICIPaymentError(f"Payment callback processing failed: {str(e)}")
    
    async def verify_payment_status(self, payment: Payment) -> Payment:
        """
        Verify payment status with ICICI Gateway.
        
        Args:
            payment: Payment instance to verify
            
        Returns:
            Updated Payment instance
        """
        try:
            # Prepare status inquiry parameters
            inquiry_params = {
                "merchant_id": self.merchant_id,
                "order_id": payment.transaction_id,
                "access_code": self.access_code
            }
            
            # Generate checksum
            checksum = self._generate_checksum(inquiry_params)
            inquiry_params["checksum"] = checksum
            
            # Make status inquiry API call
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.gateway_url}/merchant/postservice.jsp",
                    data=inquiry_params,
                    timeout=30.0
                )
                response.raise_for_status()
                
                # Parse response
                response_data = dict(urllib.parse.parse_qsl(response.text))
                
                # Verify response checksum
                received_checksum = response_data.get("checksum", "")
                if not self._verify_checksum(response_data, received_checksum):
                    raise ICICIPaymentError("Status inquiry checksum verification failed")
                
                # Update payment status
                async with get_db_session() as session:
                    session.add(payment)
                    
                    payment.gateway_response = response_data
                    payment.gateway_status_code = response_data.get("order_status", "")
                    payment.gateway_status_message = response_data.get("status_message", "")
                    
                    order_status = response_data.get("order_status", "").upper()
                    if order_status == "SUCCESS":
                        payment.payment_status = PaymentStatus.SUCCESS
                        if not payment.completed_at:
                            payment.completed_at = datetime.utcnow()
                    elif order_status in ["FAILURE", "ABORTED"]:
                        payment.payment_status = PaymentStatus.FAILED
                    elif order_status == "INVALID":
                        payment.payment_status = PaymentStatus.CANCELLED
                    
                    await session.commit()
                    await session.refresh(payment)
                
                logger.info(f"Payment status verified: {payment.transaction_id} - Status: {payment.payment_status}")
                
                return payment
                
        except Exception as e:
            logger.error(f"Payment status verification failed: {str(e)}")
            raise ICICIPaymentError(f"Payment status verification failed: {str(e)}")
    
    async def process_refund(
        self,
        payment: Payment,
        refund_amount: float,
        refund_reason: str = "Customer request"
    ) -> Dict[str, any]:
        """
        Process refund for a successful payment.
        
        Args:
            payment: Payment instance to refund
            refund_amount: Amount to refund
            refund_reason: Reason for refund
            
        Returns:
            Refund response data
        """
        try:
            if not payment.is_refundable:
                raise ICICIPaymentError("Payment is not eligible for refund")
            
            if refund_amount > payment.remaining_refund_amount:
                raise ICICIPaymentError("Refund amount exceeds available balance")
            
            # Prepare refund parameters
            refund_params = {
                "merchant_id": self.merchant_id,
                "order_id": payment.transaction_id,
                "refund_amount": str(refund_amount),
                "refund_ref_no": f"REF-{payment.transaction_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "access_code": self.access_code
            }
            
            # Generate checksum
            checksum = self._generate_checksum(refund_params)
            refund_params["checksum"] = checksum
            
            # Make refund API call
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.gateway_url}/merchant/refund",
                    data=refund_params,
                    timeout=30.0
                )
                response.raise_for_status()
                
                # Parse response
                response_data = dict(urllib.parse.parse_qsl(response.text))
                
                # Update payment record
                async with get_db_session() as session:
                    session.add(payment)
                    
                    payment.refund_amount += refund_amount
                    payment.refund_reason = refund_reason
                    payment.refund_reference = refund_params["refund_ref_no"]
                    
                    if payment.refund_amount >= payment.amount:
                        payment.payment_status = PaymentStatus.REFUNDED
                    else:
                        payment.payment_status = PaymentStatus.PARTIAL_REFUND
                    
                    await session.commit()
                    await session.refresh(payment)
                
                logger.info(f"Refund processed: {payment.transaction_id} - Amount: {refund_amount}")
                
                return response_data
                
        except Exception as e:
            logger.error(f"Refund processing failed: {str(e)}")
            raise ICICIPaymentError(f"Refund processing failed: {str(e)}")
    
    async def process_webhook(self, webhook_data: Dict[str, any]) -> PaymentWebhook:
        """
        Process webhook notification from ICICI Gateway.
        
        Args:
            webhook_data: Webhook data from gateway
            
        Returns:
            PaymentWebhook instance
        """
        try:
            # Create webhook record
            webhook = PaymentWebhook(
                webhook_id=webhook_data.get("webhook_id", f"WH-{datetime.utcnow().timestamp()}"),
                transaction_id=webhook_data.get("order_id", ""),
                webhook_data=webhook_data,
                signature=webhook_data.get("signature", ""),
                is_verified=False,
                processed=False
            )
            
            async with get_db_session() as session:
                # Verify webhook signature if present
                if webhook.signature:
                    webhook.is_verified = self._verify_webhook_signature(webhook_data, webhook.signature)
                
                # Find associated payment
                if webhook.transaction_id:
                    payment = await session.get(Payment, {"transaction_id": webhook.transaction_id})
                    if payment:
                        webhook.payment_id = payment.id
                
                session.add(webhook)
                await session.commit()
                await session.refresh(webhook)
                
                # Process webhook if verified
                if webhook.is_verified and webhook.payment_id:
                    try:
                        # Update payment status based on webhook data
                        await self._update_payment_from_webhook(webhook)
                        webhook.processed = True
                    except Exception as e:
                        webhook.processing_error = str(e)
                        logger.error(f"Webhook processing error: {str(e)}")
                
                await session.commit()
                
                logger.info(f"Webhook processed: {webhook.webhook_id} - Verified: {webhook.is_verified}")
                
                return webhook
                
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            raise ICICIPaymentError(f"Webhook processing failed: {str(e)}")
    
    def _verify_webhook_signature(self, webhook_data: Dict[str, any], signature: str) -> bool:
        """Verify webhook signature."""
        try:
            # Create signature payload
            payload_string = json.dumps(webhook_data, sort_keys=True)
            
            # Generate expected signature
            expected_signature = hmac.new(
                self.working_key.encode('utf-8'),
                payload_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Webhook signature verification error: {str(e)}")
            return False
    
    async def _update_payment_from_webhook(self, webhook: PaymentWebhook):
        """Update payment status from webhook data."""
        async with get_db_session() as session:
            payment = await session.get(Payment, webhook.payment_id)
            if not payment:
                raise ICICIPaymentError(f"Payment not found: {webhook.payment_id}")
            
            webhook_data = webhook.webhook_data
            
            # Update payment status based on webhook
            status = webhook_data.get("status", "").upper()
            if status == "SUCCESS":
                payment.payment_status = PaymentStatus.SUCCESS
                if not payment.completed_at:
                    payment.completed_at = datetime.utcnow()
            elif status in ["FAILURE", "FAILED"]:
                payment.payment_status = PaymentStatus.FAILED
            elif status == "REFUNDED":
                payment.payment_status = PaymentStatus.REFUNDED
                payment.refund_amount = float(webhook_data.get("refund_amount", 0))
            
            # Update gateway information
            if webhook_data.get("gateway_transaction_id"):
                payment.gateway_transaction_id = webhook_data["gateway_transaction_id"]
            
            await session.commit()
            
            logger.info(f"Payment updated from webhook: {payment.transaction_id} - Status: {payment.payment_status}")