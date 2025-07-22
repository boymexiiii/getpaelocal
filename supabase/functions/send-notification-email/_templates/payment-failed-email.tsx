import React from "https://esm.sh/react@18.3.1";

export function PaymentFailedEmail({ userName, amount, currency, transactionType, transactionId, timestamp, reason }) {
  return (
    <div>
      <h1>Transaction Failed</h1>
      <p>Hello {userName},</p>
      <p>Your {transactionType} of {currency}{amount.toLocaleString()} failed.</p>
      <p>Reason: {reason || 'Unknown error'}</p>
      <p>Transaction ID: {transactionId}</p>
      <p>Time: {timestamp}</p>
      <p>If you have questions, contact support.</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 