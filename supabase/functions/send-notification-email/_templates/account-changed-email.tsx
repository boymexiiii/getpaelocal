import React from "https://esm.sh/react@18.3.1";

export function AccountChangedEmail({ userName, changeType, timestamp }) {
  return (
    <div>
      <h1>Account Change Notification</h1>
      <p>Hello {userName},</p>
      <p>Your account {changeType} was updated on {timestamp}.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <p>Thank you for using Pae.</p>
    </div>
  );
} 