
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Mail, Clock, MapPin, Users } from 'lucide-react';

const NigerianSupport = () => {
  const supportOptions = [
    {
      type: 'phone',
      title: 'Call Us',
      description: 'Speak with our Nigerian customer support team',
      contact: '+234 700 PAE HELP',
      subtext: '+234 700 723 4357',
      hours: 'Monday - Friday: 8AM - 8PM WAT\nSaturday: 9AM - 5PM WAT',
      icon: Phone,
      primary: true
    },
    {
      type: 'whatsapp',
      title: 'WhatsApp Support',
      description: 'Chat with us on WhatsApp - very fast response',
      contact: '+234 814 PAE CHAT',
      subtext: '+234 814 723 2428',
      hours: '24/7 available',
      icon: MessageCircle,
      primary: true
    },
    {
      type: 'email',
      title: 'Email Support',
      description: 'Send us detailed questions or complaints',
      contact: 'support@pae.ng',
      subtext: 'We reply within 2 hours',
      hours: '24/7 monitored',
      icon: Mail,
      primary: false
    }
  ];

  const locations = [
    {
      city: 'Lagos',
      address: 'Victoria Island, Lagos State',
      phone: '+234 701 PAE LAGOS'
    },
    {
      city: 'Abuja', 
      address: 'Central Business District, FCT',
      phone: '+234 702 PAE ABUJA'
    },
    {
      city: 'Port Harcourt',
      address: 'GRA Phase 2, Rivers State',
      phone: '+234 703 PAE PHCITY'
    }
  ];

  const handleContact = (type: string, contact: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${contact.replace(/\s/g, '')}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${contact.replace(/[\s+]/g, '').replace('234', '234')}`);
        break;
      case 'email':
        window.open(`mailto:${contact}`);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-green-700">
            <Users className="w-6 h-6" />
            <span>Nigerian Customer Support</span>
          </CardTitle>
          <CardDescription>
            We understand Naija! Our local team is here to help you 24/7
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Card key={option.type} className={`border-2 ${option.primary ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${option.primary ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <IconComponent className={`w-4 h-4 ${option.primary ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      {option.primary && <Badge className="bg-green-500">Recommended</Badge>}
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{option.contact}</p>
                      <p className="text-sm text-gray-600">{option.subtext}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                      <p className="text-sm text-gray-600 whitespace-pre-line">{option.hours}</p>
                    </div>
                    <Button 
                      onClick={() => handleContact(option.type, option.contact)}
                      className={`w-full ${option.primary ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                      Contact Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Local Offices */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <MapPin className="w-5 h-5" />
                <span>Our Nigerian Offices</span>
              </CardTitle>
              <CardDescription>Visit us in person at any of our locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <div key={location.city} className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">{location.city}</h4>
                    <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                    <p className="text-sm font-medium text-blue-600">{location.phone}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Quick Tips for Faster Support</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li>• Have your account number or phone number ready</li>
                <li>• For transaction issues, provide the transaction reference</li>
                <li>• WhatsApp support is fastest for urgent issues</li>
                <li>• Call during business hours for immediate assistance</li>
                <li>• Email us for detailed complaints or suggestions</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default NigerianSupport;
