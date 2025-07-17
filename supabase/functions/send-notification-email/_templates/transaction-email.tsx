import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TransactionEmailProps {
  userName: string;
  transactionType: string;
  amount: number;
  currency: string;
  recipient?: string;
  transactionId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
}

export const TransactionEmail = ({
  userName,
  transactionType,
  amount,
  currency,
  recipient,
  transactionId,
  timestamp,
  status
}: TransactionEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳'} 
      {transactionType} of {currency}{amount.toLocaleString()}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {status === 'success' ? 'Transaction Successful' : 
           status === 'failed' ? 'Transaction Failed' : 
           'Transaction Pending'}
        </Heading>
        
        <Text style={text}>
          Hello {userName},
        </Text>
        
        <Text style={text}>
          Your {transactionType} transaction has been {status}.
        </Text>

        <Section style={transactionBox}>
          <Row>
            <Column style={label}>Amount:</Column>
            <Column style={value}>{currency}{amount.toLocaleString()}</Column>
          </Row>
          <Row>
            <Column style={label}>Type:</Column>
            <Column style={value}>{transactionType}</Column>
          </Row>
          {recipient && (
            <Row>
              <Column style={label}>Recipient:</Column>
              <Column style={value}>{recipient}</Column>
            </Row>
          )}
          <Row>
            <Column style={label}>Transaction ID:</Column>
            <Column style={value}>{transactionId}</Column>
          </Row>
          <Row>
            <Column style={label}>Date & Time:</Column>
            <Column style={value}>{timestamp}</Column>
          </Row>
          <Row>
            <Column style={label}>Status:</Column>
            <Column style={{...value, color: status === 'success' ? '#16a34a' : status === 'failed' ? '#dc2626' : '#ca8a04'}}>
              {status.toUpperCase()}
            </Column>
          </Row>
        </Section>

        {status === 'failed' && (
          <Text style={{...text, color: '#dc2626'}}>
            If you believe this is an error, please contact our support team with the transaction ID above.
          </Text>
        )}

        <Text style={text}>
          Thank you for using Pae.
        </Text>

        <Text style={footer}>
          Pae - Your Digital Wallet for the Future
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TransactionEmail

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

const transactionBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '20px',
  margin: '20px 0',
}

const label = {
  color: '#64748b',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 0',
  width: '40%',
}

const value = {
  color: '#1e293b',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  fontSize: '14px',
  padding: '8px 0',
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