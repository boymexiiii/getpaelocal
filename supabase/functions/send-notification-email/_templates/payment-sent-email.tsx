import React from "https://esm.sh/react@18.3.1";

export function PaymentSentEmail({ userName, amount, currency, recipient, transactionId, timestamp, status }) {
  return (
    <div>
      <h1>Payment Sent {status === 'completed' ? 'Successful' : 'Failed'}</h1>
      <p>Hello {userName},</p>
      <p>You sent {currency}{amount.toLocaleString()} to {recipient}. Status: {status}.</p>
      <p>Transaction ID: {transactionId}</p>
      <p>Time: {timestamp}</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 