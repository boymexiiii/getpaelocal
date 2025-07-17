import { ArrowLeft, Users, Target, Award, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security First",
      description: "We prioritize the security of your funds and personal information with bank-level encryption and security measures."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Customer Focused",
      description: "Our users are at the heart of everything we do. We build products that solve real financial challenges."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Innovation",
      description: "We continuously innovate to bring cutting-edge financial technology to Nigerian consumers."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Financial Inclusion",
      description: "We believe everyone deserves access to modern financial services, regardless of their background."
    }
  ];

  const team = [
    {
      name: "Adebayo Johnson",
      role: "Chief Executive Officer",
      bio: "Former VP at leading Nigerian fintech with 10+ years in financial services."
    },
    {
      name: "Kemi Adebayo",
      role: "Chief Technology Officer", 
      bio: "Former lead engineer at international payment processor with expertise in blockchain."
    },
    {
      name: "Chima Okafor",
      role: "Chief Financial Officer",
      bio: "Former investment banker with deep experience in Nigerian financial markets."
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Pae</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're building the future of digital finance in Nigeria, making it easier for everyone 
            to send money, invest, and manage their financial life.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                To democratize financial services in Nigeria by providing secure, accessible, 
                and innovative digital solutions that empower individuals and businesses to 
                achieve their financial goals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                To become Nigeria's most trusted digital financial platform, leading the 
                transformation towards a cashless society while maintaining the highest 
                standards of security and user experience.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center text-white mb-4 mx-auto">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Leadership Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {team.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-teal-600 rounded-full mx-auto mb-4"></div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-purple-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Our Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">10,000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">₦50B+</div>
                <div className="text-gray-600">Transaction Volume</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600">Customer Support</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;