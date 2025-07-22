import React from "https://esm.sh/react@18.3.1";

export function BillPaymentEmail({ userName, amount, currency, billType, billRef, transactionId, timestamp, status }) {
  return (
    <div>
      <h1>Bill Payment {status === 'completed' ? 'Successful' : 'Failed'}</h1>
      <p>Hello {userName},</p>
      <p>Your {billType} bill payment of {currency}{amount.toLocaleString()} was {status}.</p>
      <p>Bill Reference: {billRef}</p>
      <p>Transaction ID: {transactionId}</p>
      <p>Time: {timestamp}</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 