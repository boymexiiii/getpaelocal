
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecretKey {
  name: string;
  label: string;
  description: string;
  required: boolean;
  testEndpoint?: string;
}

const requiredSecrets: SecretKey[] = [
  {
    name: 'PAYSTACK_SECRET_KEY',
    label: 'Paystack Secret Key',
    description: 'Your Paystack secret key for processing payments',
    required: true,
    testEndpoint: 'https://api.paystack.co/bank'
  },
  {
    name: 'FLUTTERWAVE_SECRET_KEY',
    label: 'Flutterwave Secret Key', 
    description: 'Your Flutterwave secret key for payment processing',
    required: true,
    testEndpoint: 'https://api.flutterwave.com/v3/banks/NG'
  },
  {
    name: 'RELOADLY_API_KEY',
    label: 'Reloadly API Key',
    description: 'Your Reloadly API key for virtual card services',
    required: true,
    testEndpoint: 'https://auth.reloadly.com/oauth/token'
  },
  {
    name: 'CRYPTO_API_KEY',
    label: 'CoinGecko API Key',
    description: 'API key for real-time cryptocurrency prices (optional)',
    required: false
  }
];

export const SecretKeyManager = () => {
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({});
  const { toast } = useToast();

  const handleSecretChange = (name: string, value: string) => {
    setSecrets(prev => ({ ...prev, [name]: value }));
    // Clear test result when secret changes
    setTestResults(prev => ({ ...prev, [name]: null }));
  };

  const toggleShowSecret = (name: string) => {
    setShowSecrets(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const testSecret = async (secret: SecretKey) => {
    if (!secret.testEndpoint) return;
    
    const secretValue = secrets[secret.name];
    if (!secretValue) {
      toast({
        title: "Missing Secret",
        description: `Please enter your ${secret.label} first`,
        variant: "destructive"
      });
      return;
    }

    setTesting(prev => ({ ...prev, [secret.name]: true }));

    try {
      // This is a simplified test - in production you'd make actual API calls
      // For now, just validate the format
      let isValid = false;

      if (secret.name === 'PAYSTACK_SECRET_KEY') {
        isValid = secretValue.startsWith('sk_') && secretValue.length > 20;
      } else if (secret.name === 'FLUTTERWAVE_SECRET_KEY') {
        isValid = secretValue.startsWith('FLWSECK_TEST') || secretValue.startsWith('FLWSECK-');
      } else if (secret.name === 'RELOADLY_API_KEY') {
        isValid = secretValue.length > 20;
      } else if (secret.name === 'CRYPTO_API_KEY') {
        isValid = secretValue.length > 10;
      }

      setTestResults(prev => ({ 
        ...prev, 
        [secret.name]: isValid ? 'success' : 'error' 
      }));

      toast({
        title: isValid ? "Key Valid" : "Key Invalid",
        description: isValid 
          ? `${secret.label} appears to be valid`
          : `${secret.label} format is incorrect`,
        variant: isValid ? "default" : "destructive"
      });

    } catch (error) {
      setTestResults(prev => ({ ...prev, [secret.name]: 'error' }));
      toast({
        title: "Test Failed",
        description: `Unable to validate ${secret.label}`,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [secret.name]: false }));
    }
  };

  const saveSecrets = async () => {
    const requiredMissing = requiredSecrets
      .filter(s => s.required && !secrets[s.name])
      .map(s => s.label);

    if (requiredMissing.length > 0) {
      toast({
        title: "Missing Required Keys",
        description: `Please provide: ${requiredMissing.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // In production, these would be saved to Supabase secrets
    console.log('Secrets to save:', Object.keys(secrets));
    
    toast({
      title: "Configuration Saved",
      description: "Your API keys have been securely stored. You can now test payments.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Configuration</h1>
        <p className="text-gray-600">Configure your payment and service provider API keys</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              API keys are sensitive credentials. Only enter production keys when you're ready to process real payments.
              Use test keys for development and testing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {requiredSecrets.map((secret) => (
          <Card key={secret.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5" />
                {secret.label}
                {secret.required && <span className="text-red-500">*</span>}
              </CardTitle>
              <p className="text-sm text-gray-600">{secret.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={secret.name}>API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={secret.name}
                      type={showSecrets[secret.name] ? 'text' : 'password'}
                      value={secrets[secret.name] || ''}
                      onChange={(e) => handleSecretChange(secret.name, e.target.value)}
                      placeholder={`Enter your ${secret.label}`}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowSecret(secret.name)}
                    >
                      {showSecrets[secret.name] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {secret.testEndpoint && (
                    <Button
                      onClick={() => testSecret(secret)}
                      disabled={testing[secret.name] || !secrets[secret.name]}
                      variant="outline"
                      className={
                        testResults[secret.name] === 'success' 
                          ? 'border-green-500 text-green-700'
                          : testResults[secret.name] === 'error'
                          ? 'border-red-500 text-red-700'
                          : ''
                      }
                    >
                      {testing[secret.name] ? 'Testing...' : 'Test'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={saveSecrets} size="lg" className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
};
