import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBVNVerification } from '@/hooks/useBVNVerification';

const TestBVN = () => {
  const [bvn, setBvn] = useState('');
  const [result, setResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { verifyBVN, loading } = useBVNVerification();

  const handleTest = async () => {
    if (!bvn.trim()) {
      setResult({ error: 'Please enter a BVN' });
      return;
    }

    try {
      console.log('Testing BVN verification for:', bvn);
      setDebugInfo({ timestamp: new Date().toISOString(), bvn: bvn });
      
      const verificationResult = await verifyBVN(bvn);
      setResult(verificationResult);
      
      console.log('Verification result:', verificationResult);
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test BVN Verification</CardTitle>
          <CardDescription>
            Test the BVN verification functionality with detailed debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bvn">BVN (11 digits)</Label>
            <Input
              id="bvn"
              type="text"
              placeholder="Enter 11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
              maxLength={11}
            />
            <p className="text-sm text-gray-500 mt-1">
              For testing, you can use any 11-digit number. The function will return a fallback response if Flutterwave API fails.
            </p>
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={loading || bvn.length !== 11}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test BVN Verification'}
          </Button>

          {debugInfo && (
            <div className="mt-4 p-4 border rounded bg-blue-50">
              <h3 className="font-semibold mb-2 text-blue-800">Debug Info:</h3>
              <pre className="text-sm text-blue-700">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 border rounded">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4 p-4 border rounded bg-yellow-50">
            <h3 className="font-semibold mb-2 text-yellow-800">Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Enter any 11-digit number to test</li>
              <li>• Check browser console for detailed logs</li>
              <li>• The function will try Flutterwave first, then Mono as fallback</li>
              <li>• If both fail, it will return a mock response for testing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBVN; 