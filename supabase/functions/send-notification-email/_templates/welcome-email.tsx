import React from "https://esm.sh/react@18.3.1";

export function WelcomeEmail({ userName }) {
  return (
    <div>
      <h1>Welcome to Pae!</h1>
      <p>Hello {userName},</p>
      <p>Thank you for registering with Pae. We’re excited to have you on board!</p>
      <p>Start exploring your new wallet and enjoy seamless payments.</p>
      <p>— The Pae Team</p>
    </div>
  );
} 