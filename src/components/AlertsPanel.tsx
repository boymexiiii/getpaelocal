
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, XCircle, Filter } from "lucide-react";
import { useMonitoringAlerts } from "@/hooks/useMonitoringAlerts";
import { formatDistanceToNow } from "date-fns";

const AlertsPanel = () => {
  const { alerts, loading, unreadCount, resolveAlert, getAlertsBySeverity, getCriticalAlerts } = useMonitoringAlerts();
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFilteredAlerts = () => {
    if (selectedSeverity === 'all') return alerts;
    return getAlertsBySeverity(selectedSeverity);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = getCriticalAlerts();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Monitoring Alerts</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              System alerts and notifications
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {criticalAlerts.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <Tabs value={selectedSeverity} onValueChange={(value: any) => setSelectedSeverity(value)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedSeverity}>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {getFilteredAlerts().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No alerts found</p>
                  </div>
                ) : (
                  getFilteredAlerts().map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${
                        alert.is_resolved ? 'bg-gray-50' : 'bg-white'
                      } ${alert.is_resolved ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {alert.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={getSeverityColor(alert.severity)}
                              >
                                {alert.severity}
                              </Badge>
                              {alert.is_resolved && (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {!alert.is_resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                            className="ml-2"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
