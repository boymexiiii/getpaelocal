import { ArrowLeft, MapPin, Clock, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Careers = () => {
  const navigate = useNavigate();

  const openings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Lagos, Nigeria",
      type: "Full-time",
      description: "Build beautiful and intuitive user interfaces for our financial platform using React and TypeScript.",
      requirements: ["5+ years React experience", "TypeScript proficiency", "Financial tech experience preferred"]
    },
    {
      title: "Backend Engineer",
      department: "Engineering", 
      location: "Lagos, Nigeria",
      type: "Full-time",
      description: "Design and implement scalable backend systems to handle millions of transactions securely.",
      requirements: ["Node.js/Python expertise", "Database design skills", "API development experience"]
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Lagos, Nigeria", 
      type: "Full-time",
      description: "Drive product strategy and roadmap for our digital wallet and investment features.",
      requirements: ["5+ years product management", "Fintech experience", "Data-driven mindset"]
    },
    {
      title: "Compliance Officer",
      department: "Legal & Compliance",
      location: "Lagos, Nigeria",
      type: "Full-time", 
      description: "Ensure regulatory compliance with CBN guidelines and international financial standards.",
      requirements: ["Legal/compliance background", "Nigerian banking regulations knowledge", "Risk management experience"]
    }
  ];

  const benefits = [
    "Competitive salary and equity packages",
    "Comprehensive health insurance",
    "Professional development opportunities", 
    "Flexible working arrangements",
    "Modern office in Victoria Island",
    "Annual learning and conference budget"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help us build the future of digital finance in Nigeria. We're looking for passionate 
            individuals who want to make a real impact.
          </p>
        </div>

        {/* Why Work With Us */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Why Work With Us?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Amazing Team</h3>
                <p className="text-gray-600">Work with talented engineers, designers, and business experts.</p>
              </div>
              <div>
                <Briefcase className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Growth Opportunities</h3>
                <p className="text-gray-600">Accelerate your career in a fast-growing fintech company.</p>
              </div>
              <div>
                <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Great Location</h3>
                <p className="text-gray-600">Modern office space in the heart of Lagos business district.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Benefits & Perks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Positions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
          <div className="space-y-6">
            {openings.map((job, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.department}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.type}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {job.department}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Requirements:</h4>
                    <ul className="space-y-1">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact HR */}
        <Card>
          <CardHeader>
            <CardTitle>Don't See Your Role?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              We're always looking for talented individuals. Send us your resume and let us know 
              how you'd like to contribute to our mission.
            </p>
            <Button variant="outline">
              Contact HR
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Careers;