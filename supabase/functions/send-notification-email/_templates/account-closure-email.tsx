import React from "https://esm.sh/react@18.3.1";

export function AccountClosureEmail({ userName, timestamp }) {
  return (
    <div>
      <h1>Account Deactivation</h1>
      <p>Hello {userName},</p>
      <p>Your account was deactivated on {timestamp}.</p>
      <p>If this was not you, please contact support immediately.</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 