import React from "https://esm.sh/react@18.3.1";

export function PaymentReceivedEmail({ userName, amount, currency, sender, transactionId, timestamp, status }) {
  return (
    <div>
      <h1>Payment Received</h1>
      <p>Hello {userName},</p>
      <p>You received {currency}{amount.toLocaleString()} from {sender}. Status: {status}.</p>
      <p>Transaction ID: {transactionId}</p>
      <p>Time: {timestamp}</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 