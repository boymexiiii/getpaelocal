import { ArrowLeft, Shield, FileText, Users, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Compliance = () => {
  const navigate = useNavigate();

  const complianceAreas = [
    {
      title: "KYC/AML Compliance",
      status: "Implemented",
      description: "Know Your Customer and Anti-Money Laundering procedures",
      details: [
        "Identity verification with government-issued ID",
        "BVN (Bank Verification Number) validation",
        "Source of funds verification",
        "Transaction monitoring and reporting",
        "Sanctions screening"
      ]
    },
    {
      title: "Data Protection (GDPR/NDPR)",
      status: "Implemented", 
      description: "Personal data protection and privacy compliance",
      details: [
        "Data minimization and purpose limitation",
        "User consent management",
        "Right to access and deletion",
        "Data encryption and secure storage",
        "Privacy impact assessments"
      ]
    },
    {
      title: "Financial Services Licensing",
      status: "Required",
      description: "Regulatory licenses needed for operation",
      details: [
        "Payment Service Provider (PSP) license from CBN",
        "Money Transfer Operator (MTO) license",
        "Digital payment platform approval",
        "Cryptocurrency trading license (if applicable)",
        "Consumer protection compliance"
      ]
    },
    {
      title: "Cybersecurity Framework",
      status: "Implemented",
      description: "Security standards and incident response",
      details: [
        "ISO 27001 security management",
        "PCI DSS compliance for card data",
        "Incident response procedures",
        "Regular security audits",
        "Employee security training"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Implemented": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Required": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Framework</h1>
          <p className="text-gray-600">Regulatory compliance and risk management overview</p>
        </div>

        {/* Compliance Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Compliance Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">75%</div>
                <div className="text-sm text-gray-600">Implementation Complete</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">1</div>
                <div className="text-sm text-gray-600">Areas In Progress</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">1</div>
                <div className="text-sm text-gray-600">Licenses Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Areas */}
        <div className="grid gap-6">
          {complianceAreas.map((area, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    {area.title}
                  </CardTitle>
                  <Badge className={getStatusColor(area.status)}>
                    {area.status}
                  </Badge>
                </div>
                <p className="text-gray-600">{area.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {area.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Items */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Priority Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h3 className="font-medium text-red-800">1. Obtain CBN Payment Service Provider License</h3>
                <p className="text-red-700 text-sm mt-1">
                  Required for operating payment services in Nigeria. Contact CBN for application process.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-medium text-yellow-800">2. Complete Security Audit</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Schedule independent security assessment before production launch.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-medium text-blue-800">3. Legal Documentation Review</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Have legal team review Terms of Service and Privacy Policy for local compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Compliance Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Legal & Compliance Officer</h3>
                <p className="text-sm text-gray-600">Email: compliance@getpae.com</p>
                <p className="text-sm text-gray-600">Phone: +234-xxx-xxx-xxxx</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Data Protection Officer</h3>
                <p className="text-sm text-gray-600">Email: dpo@getpae.com</p>
                <p className="text-sm text-gray-600">Phone: +234-xxx-xxx-xxxx</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compliance;