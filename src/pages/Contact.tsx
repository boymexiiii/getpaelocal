import { ArrowLeft, MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Contact = () => {
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Phone",
      details: ["+234-xxx-xxx-xxxx", "Mon-Fri, 9AM-6PM WAT"]
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Email", 
      details: ["support@getpae.com", "Response within 24 hours"]
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Address",
      details: ["123 Victoria Island", "Lagos, Nigeria"]
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Business Hours",
      details: ["Monday - Friday: 9AM-6PM", "Saturday: 10AM-4PM"]
    }
  ];

  const departments = [
    { value: "support", label: "General Support" },
    { value: "technical", label: "Technical Issues" },
    { value: "billing", label: "Billing & Payments" },
    { value: "partnerships", label: "Business Partnerships" },
    { value: "press", label: "Press & Media" },
    { value: "compliance", label: "Compliance & Legal" }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help! Reach out to us with any questions, feedback, or support needs.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">First Name</label>
                      <Input placeholder="Enter your first name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Last Name</label>
                      <Input placeholder="Enter your last name" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Address</label>
                    <Input type="email" placeholder="Enter your email address" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone Number</label>
                    <Input type="tel" placeholder="Enter your phone number" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Department</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input placeholder="Brief description of your inquiry" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                    />
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{info.title}</h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-sm text-gray-600">{detail}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Live Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule a Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Before You Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-700 text-sm mb-4">
                  Check our FAQ section for instant answers to common questions.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => navigate('/help-center')}
                >
                  Visit Help Center
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Office Locations */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Our Offices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Lagos Headquarters</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>123 Victoria Island</p>
                  <p>Lagos State, Nigeria</p>
                  <p>Phone: +234-xxx-xxx-xxxx</p>
                  <p>Email: lagos@getpae.com</p>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Abuja Office</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>456 Central Business District</p>
                  <p>Abuja, FCT, Nigeria</p>
                  <p>Phone: +234-xxx-xxx-xxxx</p>
                  <p>Email: abuja@getpae.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;