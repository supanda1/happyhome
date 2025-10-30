"""
Payment routes for ICICI Gateway integration.

This module provides REST API endpoints for payment operations including:
- Payment initiation and processing
- Payment callbacks and webhooks
- Payment verification and status
- Refund processing
- Payment history and analytics
"""

import logging
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from ..core.dependencies import get_current_user, get_db_session, get_current_admin_user
from ..core.config import settings
from ..services.icici_payment_service import ICICIPaymentService, ICICIPaymentError
from ..models.payment import Payment, PaymentWebhook, PaymentMethod, PaymentStatus
from ..models.order import Order
from ..models.user import User
from ..schemas.payment import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentCallbackRequest,
    PaymentCallbackResponse,
    PaymentVerificationRequest,
    PaymentVerificationResponse,
    RefundRequest,
    RefundResponse,
    WebhookRequest,
    WebhookResponse,
    PaymentResponse,
    PaymentListResponse,
    PaymentStatsResponse,
    PaymentMethodsResponse,
    PaymentError,
    OrderWithPayments
)

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)

# Initialize payment service
payment_service = ICICIPaymentService()


@router.get("/methods", response_model=PaymentMethodsResponse)
async def get_payment_methods():
    """Get available payment methods."""
    try:
        payment_methods = [
            {
                "method": "credit_card",
                "name": "Credit Card (ICICI Secure)", 
                "description": "Visa, MasterCard, American Express, RuPay - Powered by ICICI Bank",
                "icon": "credit-card",
                "gateway": "ICICI",
                "is_default": "true"
            },
            {
                "method": "debit_card",
                "name": "Debit Card (ICICI Secure)",
                "description": "All major bank debit cards - Powered by ICICI Bank", 
                "icon": "debit-card",
                "gateway": "ICICI",
                "is_default": "true"
            },
            {
                "method": "net_banking", 
                "name": "Net Banking (ICICI Gateway)",
                "description": "50+ banks including ICICI, SBI, HDFC - Secure ICICI Gateway",
                "icon": "bank",
                "gateway": "ICICI",
                "is_default": "true"
            },
            {
                "method": "upi",
                "name": "UPI (ICICI Secure)",
                "description": "PhonePe, GPay, Paytm, BHIM - Processed via ICICI Gateway",
                "icon": "upi",
                "gateway": "ICICI",
                "is_default": "true"
            },
            {
                "method": "wallet",
                "name": "Digital Wallets (ICICI)",
                "description": "Paytm Wallet, MobiKwik, Amazon Pay - Via ICICI Gateway",
                "icon": "wallet",
                "gateway": "ICICI",
                "is_default": "true"
            },
            {
                "method": "emi",
                "name": "EMI Options (ICICI)", 
                "description": "Credit card EMI and cardless EMI - ICICI Gateway",
                "icon": "emi",
                "gateway": "ICICI",
                "is_default": "true"
            }
        ]
        
        return PaymentMethodsResponse(
            success=True,
            payment_methods=payment_methods
        )
        
    except Exception as e:
        logger.error(f"Error fetching payment methods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment methods"
        )


@router.get("/gateway-info")
async def get_gateway_info():
    """Get payment gateway information."""
    return {
        "success": True,
        "gateway": {
            "name": "ICICI Bank",
            "provider": "ICICI",
            "type": "Bank Gateway",
            "description": "All payments are processed securely through ICICI Bank's certified payment gateway",
            "supported_methods": ["Credit Cards", "Debit Cards", "Net Banking", "UPI", "Digital Wallets", "EMI"],
            "security_features": ["SSL Encryption", "PCI DSS Compliant", "3D Secure", "Fraud Detection"],
            "is_default": True,
            "test_mode": True if settings.ENVIRONMENT == "development" else False,
            "display_message": "🔒 Secure payments powered by ICICI Bank",
            "logo_url": "/static/images/icici-logo.png"
        }
    }


@router.get("/config")
async def get_payment_config():
    """Get payment configuration for frontend display."""
    return {
        "success": True,
        "config": {
            "default_gateway": "ICICI",
            "gateway_display_name": "ICICI Secure Gateway",
            "show_gateway_selection": False,  # Don't show gateway selection since ICICI is default
            "display_gateway_info": True,     # Always show that payments are via ICICI
            "gateway_badge": "🏦 ICICI Bank Secure",
            "trust_indicators": [
                "🔒 Bank-Grade Security",
                "✅ PCI DSS Certified", 
                "🛡️ Fraud Protection",
                "💳 All Cards Accepted"
            ]
        }
    }


@router.post("/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    request: PaymentInitiateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Initiate payment for an order via ICICI Gateway.
    
    All payments are processed securely through ICICI Bank's payment gateway
    regardless of the payment method selected (cards, UPI, net banking, etc.).
    """
    try:
        # Get order
        result = await db.execute(select(Order).where(Order.id == request.order_id))
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Verify user can pay for this order
        if str(order.customer_id) != str(current_user.id) and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to pay for this order"
            )
        
        # Check if order is already paid
        if order.is_paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order is already paid"
            )
        
        # Check if there's already a pending payment
        result = await db.execute(
            select(Payment).where(
                and_(
                    Payment.order_id == order.id,
                    Payment.payment_status.in_([PaymentStatus.PENDING, PaymentStatus.INITIATED])
                )
            )
        )
        pending_payment = result.scalar_one_or_none()
        
        if pending_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already in progress for this order"
            )
        
        # Log that ICICI gateway is being used
        logger.info(
            f"Initiating payment via ICICI Gateway",
            order_id=str(order.id),
            payment_method=request.payment_method.value,
            amount=order.final_amount,
            customer_id=str(current_user.id)
        )
        
        # Initiate payment with ICICI
        payment, payment_form = await payment_service.initiate_payment(
            order=order,
            payment_method=PaymentMethod(request.payment_method.value),
            customer_data=request.customer_data
        )
        
        # Prepare response
        payment_response = PaymentResponse.from_orm(payment)
        
        return PaymentInitiateResponse(
            success=True,
            payment=payment_response,
            payment_form=payment_form,
            gateway_url=payment_service.gateway_url,
            message="Payment initiated successfully via ICICI Secure Gateway"
        )
        
    except ICICIPaymentError as e:
        logger.error(f"ICICI payment error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment initiation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate payment"
        )


@router.post("/callback", response_model=PaymentCallbackResponse)
async def payment_callback(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Handle payment callback from ICICI Gateway."""
    try:
        # Get form data from callback
        form_data = await request.form()
        callback_data = dict(form_data)
        
        logger.info(f"Payment callback received: {callback_data.get('orderNo', 'Unknown')}")
        
        # Process callback with payment service
        payment = await payment_service.handle_payment_callback(callback_data)
        
        # Get order for response
        result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated order not found"
            )
        
        # Prepare response
        payment_response = PaymentResponse.from_orm(payment)
        
        # Determine redirect URL based on payment status
        redirect_url = None
        if payment.payment_status == PaymentStatus.SUCCESS:
            redirect_url = f"/orders/{order.id}/success"
        else:
            redirect_url = f"/orders/{order.id}/failed"
        
        return PaymentCallbackResponse(
            success=payment.is_successful,
            payment=payment_response,
            order_id=order.id,
            transaction_status=payment.payment_status,
            message=f"Payment {payment.payment_status.value}",
            redirect_url=redirect_url
        )
        
    except ICICIPaymentError as e:
        logger.error(f"Payment callback error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment callback processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process payment callback"
        )


@router.get("/callback/success")
async def payment_success_page():
    """Display payment success page."""
    success_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success-icon { color: #28a745; font-size: 64px; margin-bottom: 20px; }
            h1 { color: #28a745; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 30px; }
            .btn { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .btn:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been processed successfully. You will receive a confirmation email shortly.</p>
            <a href="/orders" class="btn">View My Orders</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=success_html)


@router.get("/callback/failed")
async def payment_failed_page():
    """Display payment failed page."""
    failed_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Failed</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .error-icon { color: #dc3545; font-size: 64px; margin-bottom: 20px; }
            h1 { color: #dc3545; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 30px; }
            .btn { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; }
            .btn:hover { background: #0056b3; }
            .btn-retry { background: #28a745; }
            .btn-retry:hover { background: #1e7e34; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="error-icon">✗</div>
            <h1>Payment Failed</h1>
            <p>Your payment could not be processed. Please try again or use a different payment method.</p>
            <a href="/orders" class="btn">View Orders</a>
            <a href="javascript:history.back()" class="btn btn-retry">Try Again</a>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=failed_html)


@router.post("/verify", response_model=PaymentVerificationResponse)
async def verify_payment(
    request: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Verify payment status with gateway."""
    try:
        # Get payment by transaction ID
        result = await db.execute(
            select(Payment).where(Payment.transaction_id == request.transaction_id)
        )
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Check authorization
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalar_one_or_none()
        
        if order and str(order.customer_id) != str(current_user.id) and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to verify this payment"
            )
        
        # Verify with gateway
        updated_payment = await payment_service.verify_payment_status(payment)
        
        payment_response = PaymentResponse.from_orm(updated_payment)
        
        return PaymentVerificationResponse(
            success=True,
            payment=payment_response,
            is_verified=updated_payment.is_verified,
            gateway_status=updated_payment.gateway_status_code,
            message="Payment verification completed"
        )
        
    except ICICIPaymentError as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify payment"
        )


@router.post("/refund", response_model=RefundResponse)
async def process_refund(
    request: RefundRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Process refund for a payment (Admin only)."""
    try:
        # Get payment
        result = await db.execute(select(Payment).where(Payment.id == request.payment_id))
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Process refund
        refund_response = await payment_service.process_refund(
            payment=payment,
            refund_amount=request.refund_amount,
            refund_reason=request.refund_reason
        )
        
        return RefundResponse(
            success=True,
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            refund_amount=request.refund_amount,
            refund_reference=payment.refund_reference,
            refund_status="processed",
            message="Refund processed successfully",
            gateway_response=refund_response
        )
        
    except ICICIPaymentError as e:
        logger.error(f"Refund processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Refund processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process refund"
        )


@router.post("/webhook", response_model=WebhookResponse)
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
):
    """Handle payment webhook from ICICI Gateway."""
    try:
        # Get webhook data
        webhook_data = await request.json()
        
        logger.info(f"Payment webhook received: {webhook_data.get('webhook_id', 'Unknown')}")
        
        # Process webhook
        webhook = await payment_service.process_webhook(webhook_data)
        
        return WebhookResponse(
            success=True,
            webhook_id=webhook.webhook_id,
            processed=webhook.processed,
            is_verified=webhook.is_verified,
            message="Webhook processed successfully",
            payment_updated=webhook.processed and webhook.payment_id is not None
        )
        
    except ICICIPaymentError as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )


@router.get("/history", response_model=PaymentListResponse)
async def get_payment_history(
    page: int = 1,
    per_page: int = 20,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get payment history for current user."""
    try:
        # Build query
        query = select(Payment).join(Order).where(Order.customer_id == str(current_user.id))
        
        # Add status filter
        if status_filter:
            query = query.where(Payment.payment_status == status_filter)
        
        # Add pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page).order_by(Payment.created_at.desc())
        
        # Execute query
        result = await db.execute(query)
        payments = result.scalars().all()
        
        # Get total count
        count_query = select(func.count(Payment.id)).join(Order).where(Order.customer_id == str(current_user.id))
        if status_filter:
            count_query = count_query.where(Payment.payment_status == status_filter)
        
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()
        
        # Prepare response
        payment_responses = [PaymentResponse.from_orm(payment) for payment in payments]
        
        return PaymentListResponse(
            success=True,
            payments=payment_responses,
            total_count=total_count,
            page=page,
            per_page=per_page,
            has_next=(offset + per_page) < total_count,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Payment history error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment history"
        )


@router.get("/stats", response_model=PaymentStatsResponse)
async def get_payment_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get payment statistics (Admin only)."""
    try:
        # Get payment counts by status
        stats_query = select(
            func.count(Payment.id).label('total_payments'),
            func.count(Payment.id).filter(Payment.payment_status == PaymentStatus.SUCCESS).label('successful_payments'),
            func.count(Payment.id).filter(Payment.payment_status == PaymentStatus.FAILED).label('failed_payments'),
            func.count(Payment.id).filter(Payment.payment_status.in_([PaymentStatus.PENDING, PaymentStatus.INITIATED])).label('pending_payments'),
            func.sum(Payment.amount).label('total_amount'),
            func.sum(Payment.amount).filter(Payment.payment_status == PaymentStatus.SUCCESS).label('successful_amount'),
            func.sum(Payment.refund_amount).label('refunded_amount')
        )
        
        result = await db.execute(stats_query)
        stats = result.first()
        
        # Calculate success rate
        success_rate = 0.0
        if stats.total_payments > 0:
            success_rate = (stats.successful_payments / stats.total_payments) * 100
        
        return PaymentStatsResponse(
            success=True,
            total_payments=stats.total_payments or 0,
            successful_payments=stats.successful_payments or 0,
            failed_payments=stats.failed_payments or 0,
            pending_payments=stats.pending_payments or 0,
            total_amount=float(stats.total_amount or 0),
            successful_amount=float(stats.successful_amount or 0),
            refunded_amount=float(stats.refunded_amount or 0),
            success_rate=success_rate
        )
        
    except Exception as e:
        logger.error(f"Payment stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment statistics"
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_details(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get payment details by ID."""
    try:
        # Get payment
        result = await db.execute(select(Payment).where(Payment.id == payment_id))
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Check authorization
        order_result = await db.execute(select(Order).where(Order.id == payment.order_id))
        order = order_result.scalar_one_or_none()
        
        if order and str(order.customer_id) != str(current_user.id) and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this payment"
            )
        
        return PaymentResponse.from_orm(payment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get payment details error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment details"
        )


@router.get("/order/{order_id}", response_model=OrderWithPayments)
async def get_order_payments(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get order with all its payments."""
    try:
        # Get order with payments
        result = await db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check authorization
        if str(order.customer_id) != str(current_user.id) and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this order"
            )
        
        # Get payments for this order
        payments_result = await db.execute(
            select(Payment).where(Payment.order_id == order.id).order_by(Payment.created_at.desc())
        )
        payments = payments_result.scalars().all()
        
        # Prepare response
        payment_responses = [PaymentResponse.from_orm(payment) for payment in payments]
        
        return OrderWithPayments(
            id=order.id,
            order_number=order.order_number,
            customer_name=order.customer_name,
            customer_email=order.customer_email,
            customer_phone=order.customer_phone,
            total_amount=order.total_amount,
            final_amount=order.final_amount,
            status=order.status.value,
            payments=payment_responses,
            payment_status=order.payment_status,
            is_paid=order.is_paid,
            total_paid_amount=order.total_paid_amount,
            created_at=order.created_at,
            updated_at=order.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get order payments error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch order payments"
        )