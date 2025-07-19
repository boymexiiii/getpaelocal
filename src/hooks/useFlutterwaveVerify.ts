import { useState } from 'react';

export function useFlutterwaveVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verify = async (transactionId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/functions/flutterwave-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, success, verify };
} 