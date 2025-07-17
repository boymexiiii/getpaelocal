import { ArrowLeft, Code, Book, Key, Globe, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ApiDocs = () => {
  const navigate = useNavigate();

  const endpoints = [
    {
      method: "POST",
      path: "/api/auth/login",
      description: "Authenticate user and obtain access token",
      status: "Active"
    },
    {
      method: "GET", 
      path: "/api/wallet/balance",
      description: "Get user's wallet balance",
      status: "Active"
    },
    {
      method: "POST",
      path: "/api/transactions/send",
      description: "Send money to another user",
      status: "Active"
    },
    {
      method: "GET",
      path: "/api/transactions/history",
      description: "Get transaction history",
      status: "Active"
    },
    {
      method: "POST",
      path: "/api/kyc/submit",
      description: "Submit KYC documents for verification",
      status: "Beta"
    }
  ];

  const getMethodColor = (method: string) => {
    const colors = {
      "GET": "bg-green-100 text-green-800",
      "POST": "bg-blue-100 text-blue-800",
      "PUT": "bg-yellow-100 text-yellow-800",
      "DELETE": "bg-red-100 text-red-800"
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const codeExamples = {
    javascript: `
// Initialize Pae SDK
const pae = new PaeSDK({
  apiKey: 'your-api-key',
  environment: 'sandbox' // or 'production'
});

// Send money
const response = await pae.transactions.send({
  recipient: '+2348123456789',
  amount: 1000,
  currency: 'NGN',
  description: 'Payment for goods'
});
`,
    python: `
# Install: pip install pae-python
from pae import PaeClient

# Initialize client
client = PaeClient(
    api_key='your-api-key',
    environment='sandbox'
)

# Send money
response = client.transactions.send(
    recipient='+2348123456789',
    amount=1000,
    currency='NGN',
    description='Payment for goods'
)
`,
    curl: `
# Send money via cURL
curl -X POST https://api.getpae.com/v1/transactions/send \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+2348123456789",
    "amount": 1000,
    "currency": "NGN",
    "description": "Payment for goods"
  }'
`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrate Pae's payment and financial services into your applications with our 
            comprehensive REST API.
          </p>
        </div>

        {/* Getting Started */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-purple-600" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Key className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">1. Get API Key</h3>
                <p className="text-sm text-gray-600">Sign up and get your API credentials from the developer dashboard.</p>
              </div>
              <div className="text-center">
                <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">2. Make API Calls</h3>
                <p className="text-sm text-gray-600">Use our RESTful API to integrate payments into your application.</p>
              </div>
              <div className="text-center">
                <Globe className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">3. Go Live</h3>
                <p className="text-sm text-gray-600">Test in sandbox, then switch to production when ready.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono">{endpoint.path}</code>
                    <span className="text-gray-600">{endpoint.description}</span>
                  </div>
                  <Badge variant={endpoint.status === "Active" ? "default" : "secondary"}>
                    {endpoint.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-purple-600" />
              Code Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="javascript">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeExamples.javascript}</code>
                </pre>
              </TabsContent>
              <TabsContent value="python">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeExamples.python}</code>
                </pre>
              </TabsContent>
              <TabsContent value="curl">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeExamples.curl}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SDKs and Libraries */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>SDKs & Libraries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">JavaScript/TypeScript</h3>
                <p className="text-sm text-gray-600 mb-3">Official SDK for Node.js and browser applications</p>
                <Button variant="outline" size="sm">
                  npm install @pae/js-sdk
                </Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">Python</h3>
                <p className="text-sm text-gray-600 mb-3">Python SDK for server-side applications</p>
                <Button variant="outline" size="sm">
                  pip install pae-python
                </Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-2">PHP</h3>
                <p className="text-sm text-gray-600 mb-3">PHP SDK for web applications</p>
                <Button variant="outline" size="sm">
                  composer require pae/php-sdk
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">API Key Authentication</h3>
              <p className="text-sm text-gray-600 mb-3">
                Include your API key in the Authorization header of every request:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                <code>Authorization: Bearer your-api-key-here</code>
              </pre>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Sandbox Environment</h4>
                <p className="text-sm text-gray-600">Base URL: https://api-sandbox.getpae.com</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Production Environment</h4>
                <p className="text-sm text-gray-600">Base URL: https://api.getpae.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">Developer Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              Need help integrating our API? Our developer support team is here to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Join Developer Community
              </Button>
              <Button variant="outline" className="border-purple-300 text-purple-700">
                Contact API Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocs;