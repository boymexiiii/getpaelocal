import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Status = () => {
  const navigate = useNavigate();

  const systemStatus = {
    overall: "operational",
    uptime: "99.98%",
    responseTime: "142ms"
  };

  const services = [
    {
      name: "API Services",
      status: "operational",
      uptime: "99.99%",
      description: "Core API endpoints for payments and transfers"
    },
    {
      name: "Mobile App",
      status: "operational", 
      uptime: "99.97%",
      description: "iOS and Android mobile applications"
    },
    {
      name: "Web Dashboard",
      status: "operational",
      uptime: "99.98%",
      description: "Web-based user dashboard and admin panel"
    },
    {
      name: "Payment Processing",
      status: "operational",
      uptime: "99.95%",
      description: "Bank transfers and bill payment services"
    },
    {
      name: "KYC Verification",
      status: "degraded",
      uptime: "97.82%",
      description: "Document verification and identity checks"
    },
    {
      name: "SMS Notifications",
      status: "operational",
      uptime: "99.92%",
      description: "SMS alerts and OTP delivery"
    }
  ];

  const incidents = [
    {
      id: "INC-2024-001",
      title: "KYC Verification Delays",
      status: "investigating",
      severity: "minor",
      startTime: "2024-12-20 14:30 UTC",
      description: "Some users experiencing delays in KYC document processing. Our team is investigating.",
      updates: [
        {
          time: "14:45 UTC",
          message: "We have identified the issue and are working on a fix."
        },
        {
          time: "14:30 UTC", 
          message: "We are investigating reports of KYC verification delays."
        }
      ]
    }
  ];

  const maintenanceSchedule = [
    {
      title: "Database Optimization",
      date: "2024-12-25",
      time: "02:00 - 04:00 UTC",
      impact: "No expected downtime",
      description: "Routine database maintenance to improve performance"
    },
    {
      title: "Security Updates",
      date: "2024-12-30", 
      time: "01:00 - 03:00 UTC",
      impact: "Brief API interruptions possible",
      description: "Applying security patches and system updates"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "outage":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "investigating":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "degraded":
        return "bg-yellow-100 text-yellow-800";
      case "outage":
        return "bg-red-100 text-red-800";
      case "investigating":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time status and performance metrics for all Pae services.
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getStatusIcon(systemStatus.overall)}
                  <span className="text-lg font-semibold capitalize">{systemStatus.overall}</span>
                </div>
                <p className="text-sm text-gray-600">All systems operational</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">{systemStatus.uptime}</div>
                <p className="text-sm text-gray-600">Uptime (30 days)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">{systemStatus.responseTime}</div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">{service.uptime} uptime</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        {incidents.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {incidents.map((incident, index) => (
                  <div key={index} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-yellow-800">{incident.title}</h3>
                        <p className="text-sm text-yellow-700">Started at {incident.startTime}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {incident.severity}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-yellow-700 mb-4">{incident.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-800">Updates:</h4>
                      {incident.updates.map((update, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-yellow-600">{update.time}:</span> {update.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Maintenance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scheduled Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceSchedule.length > 0 ? (
              <div className="space-y-4">
                {maintenanceSchedule.map((maintenance, index) => (
                  <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-blue-800">{maintenance.title}</h3>
                      <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Date:</strong> {maintenance.date}</p>
                      <p><strong>Time:</strong> {maintenance.time}</p>
                      <p><strong>Impact:</strong> {maintenance.impact}</p>
                      <p>{maintenance.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No scheduled maintenance at this time.</p>
            )}
          </CardContent>
        </Card>

        {/* Subscribe to Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Informed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Subscribe to receive real-time updates about system status and planned maintenance.
            </p>
            <div className="flex max-w-md gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-teal-600">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Status;