import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TransactionEmail } from './_templates/transaction-email.tsx'
import { OTPEmail } from './_templates/otp-email.tsx'
import { WithdrawalEmail } from './_templates/withdrawal-email.tsx';
import { PaymentSentEmail } from './_templates/payment-sent-email.tsx';
import { PaymentReceivedEmail } from './_templates/payment-received-email.tsx';
import { BillPaymentEmail } from './_templates/bill-payment-email.tsx';
import { PaymentFailedEmail } from './_templates/payment-failed-email.tsx';
import { WelcomeEmail } from './_templates/welcome-email.tsx';
import { AccountChangedEmail } from './_templates/account-changed-email.tsx';
import { AccountClosureEmail } from './_templates/account-closure-email.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type:
    | 'transaction'
    | 'otp'
    | 'kyc_update'
    | 'security_alert'
    | 'withdrawal'
    | 'payment_sent'
    | 'payment_received'
    | 'bill_payment'
    | 'payment_failed'
    | 'welcome'
    | 'account_changed'
    | 'account_closure';
  to: string;
  data: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, data }: EmailRequest = await req.json()

    let html = '';
    let subject = '';

    switch (type) {
      case 'transaction':
        html = await renderAsync(
          React.createElement(TransactionEmail, {
            userName: data.userName,
            transactionType: data.transactionType,
            amount: data.amount,
            currency: data.currency,
            recipient: data.recipient,
            transactionId: data.transactionId,
            timestamp: data.timestamp,
            status: data.status
          })
        );
        subject = `Transaction ${data.status}: ${data.currency}${data.amount.toLocaleString()}`;
        break;
      case 'withdrawal':
        html = await renderAsync(
          React.createElement(WithdrawalEmail, data)
        );
        subject = `Withdrawal ${data.status}: ${data.currency}${data.amount.toLocaleString()}`;
        break;
      case 'payment_sent':
        html = await renderAsync(
          React.createElement(PaymentSentEmail, data)
        );
        subject = `Payment Sent ${data.status}: ${data.currency}${data.amount.toLocaleString()}`;
        break;
      case 'payment_received':
        html = await renderAsync(
          React.createElement(PaymentReceivedEmail, data)
        );
        subject = `Payment Received: ${data.currency}${data.amount.toLocaleString()}`;
        break;
      case 'bill_payment':
        html = await renderAsync(
          React.createElement(BillPaymentEmail, data)
        );
        subject = `Bill Payment ${data.status}: ${data.currency}${data.amount.toLocaleString()}`;
        break;
      case 'payment_failed':
        html = await renderAsync(
          React.createElement(PaymentFailedEmail, data)
        );
        subject = `Transaction Failed: ${data.transactionType}`;
        break;
      case 'welcome':
        html = await renderAsync(
          React.createElement(WelcomeEmail, data)
        );
        subject = `Welcome to Pae!`;
        break;
      case 'account_changed':
        html = await renderAsync(
          React.createElement(AccountChangedEmail, data)
        );
        subject = `Account Change Notification`;
        break;
      case 'account_closure':
        html = await renderAsync(
          React.createElement(AccountClosureEmail, data)
        );
        subject = `Account Deactivation`;
        break;

      case 'otp':
        html = await renderAsync(
          React.createElement(OTPEmail, {
            userName: data.userName,
            otpCode: data.otpCode,
            expiryMinutes: data.expiryMinutes || 10,
            purpose: data.purpose || 'transaction verification'
          })
        );
        subject = `Your verification code: ${data.otpCode}`;
        break;

      case 'kyc_update':
        html = `
          <h1>KYC Status Update</h1>
          <p>Hello ${data.userName},</p>
          <p>Your KYC application status has been updated to: <strong>${data.status}</strong></p>
          ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
          <p>Thank you for using Pae.</p>
        `;
        subject = `KYC Status Update: ${data.status}`;
        break;

      case 'security_alert':
        html = `
          <h1>Security Alert</h1>
          <p>Hello ${data.userName},</p>
          <p>We detected ${data.alertType} on your account.</p>
          <p>Details: ${data.message}</p>
          <p>Time: ${data.timestamp}</p>
          <p>If this wasn't you, please contact support immediately.</p>
          <p>Pae Security Team</p>
        `;
        subject = `Security Alert: ${data.alertType}`;
        break;

      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: 'Pae <notifications@pae.com>',
      to: [to],
      subject,
      html,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
})