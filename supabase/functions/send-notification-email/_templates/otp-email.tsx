import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface OTPEmailProps {
  userName: string;
  otpCode: string;
  expiryMinutes: number;
  purpose: string;
}

export const OTPEmail = ({
  userName,
  otpCode,
  expiryMinutes,
  purpose
}: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Your OTP code: {otpCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verification Code</Heading>
        
        <Text style={text}>
          Hello {userName},
        </Text>
        
        <Text style={text}>
          Your verification code for {purpose} is:
        </Text>

        <div style={otpContainer}>
          <Text style={otpCode}>{otpCode}</Text>
        </div>

        <Text style={text}>
          This code will expire in {expiryMinutes} minutes.
        </Text>

        <Text style={warningText}>
          For your security, do not share this code with anyone. If you didn't request this code, please contact our support team immediately.
        </Text>

        <Text style={footer}>
          Pae - Your Digital Wallet for the Future
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OTPEmail

const main = {
  backgroundColor: '#f6f9fc',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '8px',
  paddingLeft: '20px',
  paddingRight: '20px',
  margin: '0 auto',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const text = {
  color: '#333',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const otpContainer = {
  backgroundColor: '#f1f5f9',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  padding: '30px',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const otpCode = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#7c3aed',
  fontFamily: 'monospace',
  letterSpacing: '8px',
  margin: '0',
}

const warningText = {
  color: '#dc2626',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  lineHeight: '20px',
  margin: '20px 0',
  padding: '15px',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
}

const footer = {
  color: '#898989',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '40px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}