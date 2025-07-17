import { ArrowLeft, Calendar, Download, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Press = () => {
  const navigate = useNavigate();

  const pressReleases = [
    {
      title: "Pae Raises $5M Series A to Expand Digital Financial Services in Nigeria",
      date: "December 15, 2024",
      excerpt: "Leading Nigerian fintech Pae announces Series A funding round led by international venture capital firms to accelerate growth and expand product offerings.",
      link: "#"
    },
    {
      title: "Pae Partners with Major Nigerian Banks for Enhanced Money Transfer Services", 
      date: "November 20, 2024",
      excerpt: "Strategic partnerships with top Nigerian financial institutions enable faster, more secure peer-to-peer transfers and bill payment services.",
      link: "#"
    },
    {
      title: "Pae Launches Cryptocurrency Investment Feature for Nigerian Users",
      date: "October 10, 2024", 
      excerpt: "New investment platform allows Nigerian users to buy, sell, and auto-invest in Bitcoin, Ethereum, and other cryptocurrencies with naira.",
      link: "#"
    }
  ];

  const mediaKit = [
    {
      title: "Company Logo Package",
      description: "High-resolution PNG and SVG logos in various formats",
      fileSize: "2.1 MB"
    },
    {
      title: "Executive Photos",
      description: "Professional headshots of leadership team",
      fileSize: "15.3 MB"
    },
    {
      title: "Product Screenshots",
      description: "App interface and feature screenshots",
      fileSize: "8.7 MB"
    },
    {
      title: "Company Fact Sheet",
      description: "Key statistics and company information",
      fileSize: "1.2 MB"
    }
  ];

  const mediaContacts = [
    {
      name: "Sarah Ogundimu",
      role: "Head of Communications",
      email: "press@getpae.com",
      phone: "+234-xxx-xxx-xxxx"
    },
    {
      name: "Michael Adebayo", 
      role: "Public Relations Manager",
      email: "media@getpae.com",
      phone: "+234-xxx-xxx-xxxx"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Press Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Latest news, press releases, and media resources about Pae's mission to 
            democratize financial services in Nigeria.
          </p>
        </div>

        {/* Latest News */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Latest Press Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <div key={index} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 flex-1 mr-4">
                      {release.title}
                    </h3>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {release.date}
                  </div>
                  <p className="text-gray-700">{release.excerpt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Media Kit */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Media Kit</CardTitle>
            <p className="text-gray-600">Download high-quality assets for media coverage</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {mediaKit.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <span className="text-xs text-gray-500">{item.fileSize}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company Facts */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Quick Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Company Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Founded:</span>
                    <span>2023</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Headquarters:</span>
                    <span>Lagos, Nigeria</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CEO:</span>
                    <span>Adebayo Johnson</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employees:</span>
                    <span>50+</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Platform Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users:</span>
                    <span>10,000+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Volume:</span>
                    <span>₦50B+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span>99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Support:</span>
                    <span>24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Media Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {mediaContacts.map((contact, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-lg">{contact.name}</h3>
                  <p className="text-purple-600 mb-3">{contact.role}</p>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Email: </span>
                      <a href={`mailto:${contact.email}`} className="text-purple-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone: </span>
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Press;