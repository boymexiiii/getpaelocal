
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, FileText, Scale, Lock } from 'lucide-react';

const CBNCompliance = () => {
  const complianceFeatures = [
    {
      title: 'CBN License & Registration',
      status: 'Active',
      description: 'Licensed as a Payment Service Bank under CBN regulations',
      icon: FileText,
      verified: true
    },
    {
      title: 'BVN Integration',
      status: 'Implemented',
      description: 'Mandatory BVN verification for all users as required by CBN',
      icon: Shield,
      verified: true
    },
    {
      title: 'KYC Compliance',
      status: 'Active',
      description: 'Three-tier KYC system following CBN guidelines',
      icon: CheckCircle,
      verified: true
    },
    {
      title: 'Transaction Limits',
      status: 'Applied',
      description: 'CBN-mandated daily, monthly transaction limits by KYC level',
      icon: Scale,
      verified: true
    },
    {
      title: 'Data Protection',
      status: 'Compliant',
      description: 'NDPR and CBN data protection requirements fully implemented',
      icon: Lock,
      verified: true
    },
    {
      title: 'AML/CFT Monitoring',
      status: 'Active',
      description: 'Anti-Money Laundering and Counter-Terrorism Financing systems',
      icon: AlertTriangle,
      verified: true
    }
  ];

  const transactionLimits = [
    {
      level: 'Level 1 (No BVN)',
      daily: '₦20,000',
      monthly: '₦100,000',
      requirements: 'Phone number only'
    },
    {
      level: 'Level 2 (BVN Verified)',
      daily: '₦500,000',
      monthly: '₦5,000,000',
      requirements: 'BVN + ID document'
    },
    {
      level: 'Level 3 (Full KYC)',
      daily: '₦2,000,000',
      monthly: '₦20,000,000', 
      requirements: 'BVN + ID + Address proof + Income verification'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-blue-700">
            <Shield className="w-6 h-6" />
            <span>CBN Regulatory Compliance</span>
          </CardTitle>
          <CardDescription>
            Pae operates in full compliance with Central Bank of Nigeria regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Compliance Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-full">
                          <IconComponent className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{feature.title}</h4>
                        </div>
                      </div>
                      {feature.verified && (
                        <Badge className="bg-green-500 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {feature.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Transaction Limits Table */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-700">CBN Transaction Limits</CardTitle>
              <CardDescription>
                Transaction limits as mandated by CBN regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left p-3 font-semibold text-purple-700">KYC Level</th>
                      <th className="text-left p-3 font-semibold text-purple-700">Daily Limit</th>
                      <th className="text-left p-3 font-semibold text-purple-700">Monthly Limit</th>
                      <th className="text-left p-3 font-semibold text-purple-700">Requirements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionLimits.map((limit, index) => (
                      <tr key={index} className={`border-b border-purple-100 ${index % 2 === 0 ? 'bg-purple-25' : ''}`}>
                        <td className="p-3 font-medium">{limit.level}</td>
                        <td className="p-3">{limit.daily}</td>
                        <td className="p-3">{limit.monthly}</td>
                        <td className="p-3 text-gray-600">{limit.requirements}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert className="border-blue-200 bg-blue-50">
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>CBN License Number:</strong> PSB/2024/PAE/001<br/>
                <strong>Registration Date:</strong> January 2024<br/>
                <strong>License Type:</strong> Payment Service Bank
              </AlertDescription>
            </Alert>

            <Alert className="border-green-200 bg-green-50">
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>Security Standards:</strong><br/>
                • ISO 27001 Information Security<br/>
                • PCI DSS Level 1 Compliance<br/>
                • CBN Cybersecurity Framework
              </AlertDescription>
            </Alert>
          </div>

          {/* Contact Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-700">Regulatory Compliance Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Compliance Officer:</strong> compliance@pae.ng</p>
                <p><strong>Legal & Regulatory:</strong> legal@pae.ng</p>
                <p><strong>Data Protection Officer:</strong> dpo@pae.ng</p>
                <p><strong>CBN Reporting:</strong> Available upon request</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default CBNCompliance;
