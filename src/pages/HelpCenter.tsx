import { ArrowLeft, Search, MessageCircle, Phone, Mail, Book, CreditCard, Users, Shield, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const HelpCenter = () => {
  const navigate = useNavigate();

  const categories = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Payments & Transfers",
      description: "Send money, pay bills, and manage transactions",
      articles: 12
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Account Management", 
      description: "Profile setup, KYC verification, and account settings",
      articles: 8
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security & Privacy",
      description: "Two-factor authentication, password reset, and security tips",
      articles: 6
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Mobile App",
      description: "App installation, features, and troubleshooting",
      articles: 5
    }
  ];

  const popularArticles = [
    "How to send money to another Pae user",
    "KYC verification requirements and process", 
    "Setting up two-factor authentication",
    "Supported banks for money transfers",
    "Transaction limits and how to increase them",
    "How to reset your password",
    "Understanding transaction fees",
    "Cryptocurrency investment basics"
  ];

  const contactOptions = [
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "24/7",
      action: "Start Chat"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Support",
      description: "Send us an email",
      availability: "Response within 24 hours",
      action: "Send Email"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone Support", 
      description: "Call our support line",
      availability: "Mon-Fri, 9AM-6PM",
      action: "Call Now"
    }
  ];

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find answers to your questions and get the help you need to make the most of your Pae experience.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search for help articles..." 
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Help Categories */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Browse by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{category.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <span className="text-xs text-purple-600">{category.articles} articles</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Articles */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-purple-600" />
              Popular Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularArticles.map((article, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-gray-700">{article}</span>
                  <Button variant="ghost" size="sm">
                    Read More
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <p className="text-gray-600">Our support team is here to help you 24/7</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {contactOptions.map((option, index) => (
                <div key={index} className="text-center p-6 border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                    {option.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{option.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                  <p className="text-xs text-gray-500 mb-4">{option.availability}</p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    {option.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium mb-2">How long do transfers take?</h3>
                <p className="text-sm text-gray-600">Most transfers between Pae users are instant. Bank transfers typically take 1-3 business days.</p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium mb-2">What are the transaction limits?</h3>
                <p className="text-sm text-gray-600">Limits depend on your KYC verification level. Verified users can send up to ₦1,000,000 daily.</p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium mb-2">Is my money safe with Pae?</h3>
                <p className="text-sm text-gray-600">Yes, we use bank-grade security with 256-bit encryption and are licensed by the Central Bank of Nigeria.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">How do I contact customer support?</h3>
                <p className="text-sm text-gray-600">You can reach us via live chat, email at support@getpae.com, or phone at +234-xxx-xxx-xxxx.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;