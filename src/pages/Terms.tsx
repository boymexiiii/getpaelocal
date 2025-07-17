import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-center text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Pae ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pae is a digital financial platform that provides wallet services, peer-to-peer transfers, bill payments, 
                  virtual cards, cryptocurrency investment, and other financial services. We act as a technology platform 
                  connecting users with licensed financial service providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. User Accounts and KYC</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p>To use our services, you must:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Be at least 18 years old</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Complete our Know Your Customer (KYC) verification process</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Financial Services</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p>Our platform offers various financial services including:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Digital wallet services</li>
                    <li>Peer-to-peer money transfers</li>
                    <li>Bill payment services</li>
                    <li>Virtual card issuance</li>
                    <li>Cryptocurrency investment facilitation</li>
                  </ul>
                  <p>All financial services are provided through licensed partners and are subject to regulatory compliance.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Transaction Limits and Fees</h2>
                <p className="text-gray-700 leading-relaxed">
                  Transaction limits are determined based on your KYC level and regulatory requirements. 
                  Fees for services are clearly displayed before transaction confirmation. We reserve the right 
                  to modify fees with appropriate notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Security and Fraud Prevention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement robust security measures including encryption, multi-factor authentication, and fraud detection. 
                  Users are responsible for maintaining the confidentiality of their account credentials and must report 
                  any unauthorized access immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Prohibited Activities</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p>Users are prohibited from:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Money laundering or terrorist financing</li>
                    <li>Fraudulent or illegal activities</li>
                    <li>Violating any applicable laws or regulations</li>
                    <li>Using the service for unauthorized commercial purposes</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pae shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                  or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, 
                  use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                  to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. Users will be notified of material changes 
                  and continued use of the service constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  For questions about these Terms of Service, please contact us at:
                  <br />
                  Email: legal@getpae.com
                  <br />
                  Address: [Your Business Address]
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;