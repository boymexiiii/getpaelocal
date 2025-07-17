
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useKYC } from "@/hooks/useKYC";
import { useNavigate } from "react-router-dom";

const KYCStatusCard = () => {
  const { application, loading, getKYCStatus, getKYCLevel } = useKYC();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  const status = getKYCStatus();
  const level = getKYCLevel();

  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return {
          icon: Shield,
          title: 'Complete KYC Verification',
          description: 'Verify your identity to increase transaction limits',
          color: 'bg-gray-100 text-gray-600',
          progress: 0,
          action: 'Start Verification'
        };
      case 'draft':
        return {
          icon: Clock,
          title: 'KYC In Progress',
          description: 'Complete your verification to submit',
          color: 'bg-yellow-100 text-yellow-600',
          progress: 25,
          action: 'Continue'
        };
      case 'submitted':
        return {
          icon: Clock,
          title: 'Under Review',
          description: 'Your documents are being reviewed',
          color: 'bg-blue-100 text-blue-600',
          progress: 50,
          action: 'View Status'
        };
      case 'under_review':
        return {
          icon: Clock,
          title: 'Under Review',
          description: 'Review in progress, please wait',
          color: 'bg-blue-100 text-blue-600',
          progress: 75,
          action: 'View Status'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: `Level ${level} Verified`,
          description: 'Your identity has been verified',
          color: 'bg-green-100 text-green-600',
          progress: 100,
          action: level < 3 ? 'Upgrade Level' : 'View Details'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Verification Failed',
          description: 'Please review and resubmit documents',
          color: 'bg-red-100 text-red-600',
          progress: 25,
          action: 'Resubmit'
        };
      case 'requires_resubmission':
        return {
          icon: AlertTriangle,
          title: 'Resubmission Required',
          description: 'Additional documents needed',
          color: 'bg-orange-100 text-orange-600',
          progress: 40,
          action: 'Update Documents'
        };
      default:
        return {
          icon: Shield,
          title: 'KYC Status Unknown',
          description: 'Please contact support',
          color: 'bg-gray-100 text-gray-600',
          progress: 0,
          action: 'Get Help'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className="border-purple-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${config.color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          <Badge 
            variant={status === 'approved' ? 'default' : 'secondary'}
            className={status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            Level {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Verification Progress</span>
            <span>{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
        </div>
        
        {application?.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <strong>Rejection Reason:</strong> {application.rejection_reason}
            </p>
          </div>
        )}

        <Button 
          onClick={() => navigate('/kyc')}
          className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
        >
          {config.action}
        </Button>
      </CardContent>
    </Card>
  );
};

export default KYCStatusCard;
