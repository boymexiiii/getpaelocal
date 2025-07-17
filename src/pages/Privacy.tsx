import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
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
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pae ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our financial services platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Full name, date of birth, and government-issued ID</li>
                      <li>Contact information (email, phone, address)</li>
                      <li>Banking and financial account information</li>
                      <li>Employment and income information</li>
                      <li>Biometric data for verification (when applicable)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Transaction Information</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Payment and transfer details</li>
                      <li>Transaction history and patterns</li>
                      <li>Merchant and recipient information</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Technical Information</h3>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>Device information and identifiers</li>
                      <li>IP address and location data</li>
                      <li>Usage patterns and analytics</li>
                      <li>Cookies and similar technologies</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p>We use your information to:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Provide and maintain our financial services</li>
                    <li>Verify your identity and comply with KYC/AML requirements</li>
                    <li>Process transactions and prevent fraud</li>
                    <li>Communicate with you about your account and services</li>
                    <li>Improve our services and develop new features</li>
                    <li>Comply with legal and regulatory obligations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>We may share your information with:</p>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Service Providers</h3>
                    <p>Third-party companies that help us operate our platform, including payment processors, 
                    identity verification services, and cloud storage providers.</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Financial Partners</h3>
                    <p>Licensed banks and financial institutions that provide underlying services.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Legal Requirements</h3>
                    <p>Government authorities and regulatory bodies when required by law or to prevent fraud 
                    and comply with anti-money laundering regulations.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement industry-standard security measures including encryption, secure data transmission, 
                  access controls, and regular security audits. However, no method of transmission over the Internet 
                  is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and comply 
                  with legal obligations. Financial transaction records may be retained for up to 7 years as 
                  required by applicable regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Your Rights</h2>
                <div className="text-gray-700 leading-relaxed space-y-2">
                  <p>Depending on your jurisdiction, you may have the right to:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your data (subject to legal requirements)</li>
                    <li>Object to or restrict processing of your information</li>
                    <li>Receive a copy of your data in a portable format</li>
                    <li>Withdraw consent for certain processing activities</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. International Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your information in accordance 
                  with applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our services are not intended for individuals under 18 years of age. We do not knowingly 
                  collect personal information from children under 18.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material 
                  changes by posting the new policy on our platform and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  Email: privacy@getpae.com
                  <br />
                  Address: [Your Business Address]
                  <br />
                  Data Protection Officer: dpo@getpae.com
                </p>
              </section>

              <section className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-2xl font-semibold mb-3">12. GDPR Compliance (EU Users)</h2>
                <p className="text-gray-700 leading-relaxed">
                  For users in the European Union, we comply with the General Data Protection Regulation (GDPR). 
                  Our lawful basis for processing includes contract performance, legal obligation, and legitimate interests. 
                  You have additional rights under GDPR including the right to lodge a complaint with your local 
                  data protection authority.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;