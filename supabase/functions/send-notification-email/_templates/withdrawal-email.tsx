import React from "https://esm.sh/react@18.3.1";

export function WithdrawalEmail({ userName, amount, currency, transactionId, timestamp, status }) {
  return (
    <div>
      <h1>Withdrawal {status === 'completed' ? 'Successful' : 'Failed'}</h1>
      <p>Hello {userName},</p>
      <p>Your withdrawal of {currency}{amount.toLocaleString()} was {status}.</p>
      <p>Transaction ID: {transactionId}</p>
      <p>Time: {timestamp}</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 