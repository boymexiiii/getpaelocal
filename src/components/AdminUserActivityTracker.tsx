import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Activity, Clock, MapPin, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

interface UserSession {
  user_id: string;
  user_name: string;
  user_email: string;
  last_activity: string;
  ip_address: string;
  device_type: string;
  location: string;
  session_duration: number;
  is_active: boolean;
}

const AdminUserActivityTracker: React.FC = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');

  const fetchUserActivities = async () => {
    setLoading(true);
    try {
      const hours = timeFilter === '1h' ? 1 : timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 720;
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      // Fetch audit logs with user information
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch user profiles to get names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      // We can't access auth.users directly from client, so we'll use profile data only

      // Merge data
      const activitiesWithUserInfo: UserActivity[] = auditData?.map(activity => {
        const profile = profilesData?.find(p => p.id === activity.user_id);
        
        return {
          id: activity.id,
          user_id: activity.user_id || '',
          action: activity.action,
          ip_address: String(activity.ip_address || 'Unknown'),
          user_agent: activity.user_agent || '',
          created_at: activity.created_at,
          user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User',
          user_email: `user_${activity.user_id?.slice(0, 8) || 'unknown'}@system.local` // Mock email since we can't access auth users
        };
      }) || [];

      // Generate mock session data based on activities
      const sessionMap = new Map<string, UserSession>();
      
      activitiesWithUserInfo.forEach(activity => {
        if (activity.user_id && !sessionMap.has(activity.user_id)) {
          const lastActivity = new Date(activity.created_at);
          const isActive = (new Date().getTime() - lastActivity.getTime()) < 15 * 60 * 1000; // Active if within 15 minutes
          
          sessionMap.set(activity.user_id, {
            user_id: activity.user_id,
            user_name: activity.user_name,
            user_email: activity.user_email,
            last_activity: activity.created_at,
            ip_address: activity.ip_address || 'Unknown',
            device_type: getDeviceType(activity.user_agent || ''),
            location: 'Nigeria', // Mock location
            session_duration: Math.floor(Math.random() * 3600), // Mock duration in seconds
            is_active: isActive
          });
        }
      });

      setActivities(activitiesWithUserInfo);
      setSessions(Array.from(sessionMap.values()));

    } catch (error) {
      console.error('Error fetching user activities:', error);
      toast({
        title: "Error",
        description: "Failed to load user activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceType = (userAgent: string): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'insert':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Activity className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activityFilter === 'all' || activity.action.toLowerCase() === activityFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const activeSessions = sessions.filter(s => s.is_active);

  useEffect(() => {
    fetchUserActivities();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchUserActivities, 30000);
    return () => clearInterval(interval);
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Activity Tracking</h2>
          <p className="text-muted-foreground">Monitor user actions and sessions in real-time</p>
        </div>
        <Button variant="outline" onClick={fetchUserActivities} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Sessions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{activeSessions.length}</div>
            <div className="text-sm text-muted-foreground">Active Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-sm text-muted-foreground">Total Sessions Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-sm text-muted-foreground">Recent Activities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{sessions.filter(s => s.device_type === 'Mobile').length}</div>
            <div className="text-sm text-muted-foreground">Mobile Users</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="insert">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="30d">30d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getActivityIcon(activity.action)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.user_name}</span>
                      <Badge variant="outline">{activity.action}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.user_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.ip_address || 'Unknown IP'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active User Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeSessions.map((session) => (
                <div key={session.user_id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(session.device_type)}
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{session.user_name}</div>
                    <div className="text-sm text-muted-foreground">{session.user_email}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Duration: {formatDuration(session.session_duration)}</span>
                      <span>•</span>
                      <span>{session.device_type}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>{new Date(session.last_activity).toLocaleTimeString()}</div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </div>
                  </div>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No active sessions found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserActivityTracker;