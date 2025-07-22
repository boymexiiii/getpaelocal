
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Key, Smartphone, ArrowLeft, Copy, Check, X, ShieldOff, Eye, EyeOff, Monitor } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import { Badge } from '@/components/ui/badge';
import { useRef } from 'react';
import zxcvbn from 'zxcvbn';

const Security = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Password strength
  const passwordStrength = zxcvbn(newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  // 2FA state
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);
  const appName = 'PaePros';
  const userEmail = user?.email || 'user';
  const otpauthUrl = twoFASecret
    ? `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${twoFASecret}&issuer=${encodeURIComponent(appName)}`
    : '';

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Notification toggles loading
  const [notifLoading, setNotifLoading] = useState(false);

  const [loginNotifications, setLoginNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [notifSaved, setNotifSaved] = useState<'login' | 'transaction' | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showEndAllDialog, setShowEndAllDialog] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setSessionsLoading(true);
      try {
        const res = await fetch(`/functions/v1/user-sessions?user_id=${user.id}`);
        const json = await res.json();
        setSessions(json.data || []);
      } catch (e) {
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
    // Load notification preferences and 2FA status
    const fetchNotificationPrefs = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/rest/v1/profiles?id=eq.${user.id}`, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
        });
        const json = await res.json();
        if (json && json[0]) {
          setLoginNotifications(!!json[0].login_notifications_enabled);
          setTransactionAlerts(!!json[0].transaction_alerts_enabled);
          setTwoFactorEnabled(!!json[0].twofa_enabled); // <-- Set 2FA status from backend
        }
      } catch (e) {/* ignore */}
    };
    fetchNotificationPrefs();
    // Fetch login history
    const fetchLoginHistory = async () => {
      if (!user) return;
      setLoginHistoryLoading(true);
      try {
        const res = await fetch(`/functions/v1/login-history?user_id=${user.id}`);
        const json = await res.json();
        setLoginHistory(json.history || []);
      } catch (e) {
        setLoginHistory([]);
      } finally {
        setLoginHistoryLoading(false);
      }
    };
    fetchLoginHistory();
  }, [user]);

  const handleEndSession = async (session_id: string) => {
    if (!user) return;
    await fetch('/functions/v1/user-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, admin_id: user.id })
    });
    // Refetch sessions after ending
    const res = await fetch(`/functions/v1/user-sessions?user_id=${user.id}`);
    const json = await res.json();
    setSessions(json.data || []);
  };

  // Password update handler
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'All fields are required', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    try {
      // Replace with your backend endpoint
      const res = await fetch('/functions/v1/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, currentPassword, newPassword })
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Password updated successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 2000);
      } else {
        toast({ title: json.message || 'Failed to update password', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error updating password', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // 2FA toggle handler
  const handle2FAToggle = async (checked: boolean) => {
    setTwoFactorEnabled(checked);
    if (checked) {
      setShow2FADialog(true);
      setTwoFALoading(true);
      try {
        // Fetch 2FA secret from backend
        const res = await fetch('/functions/v1/enable-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
        const json = await res.json();
        setTwoFASecret(json.secret || '');
        // Persist 2FA enabled status in backend
        await fetch(`/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ twofa_enabled: true })
        });
      } catch (e) {
        toast({ title: 'Error generating 2FA secret', variant: 'destructive' });
        setTwoFactorEnabled(false);
        setShow2FADialog(false);
      } finally {
        setTwoFALoading(false);
      }
    } else {
      // Disable 2FA
      setTwoFALoading(true);
      try {
        await fetch('/functions/v1/disable-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
        // Persist 2FA disabled status in backend
        await fetch(`/rest/v1/profiles?id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ twofa_enabled: false, twofa_secret: null })
        });
        toast({ title: '2FA disabled' });
      } catch (e) {
        toast({ title: 'Error disabling 2FA', variant: 'destructive' });
        setTwoFactorEnabled(true);
      } finally {
        setTwoFALoading(false);
      }
    }
  };

  // 2FA verification handler
  const handleVerify2FA = async () => {
    setTwoFALoading(true);
    try {
      const res = await fetch('/functions/v1/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, code: twoFACode })
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: '2FA enabled successfully' });
        setShow2FADialog(false);
        handle2FASuccess();
      } else {
        toast({ title: json.message || 'Invalid code', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error verifying 2FA', variant: 'destructive' });
    } finally {
      setTwoFALoading(false);
    }
  };

  // Disable 2FA handler
  const handleDisable2FA = async () => {
    setTwoFALoading(true);
    try {
      await fetch('/functions/v1/disable-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      toast({ title: '2FA disabled' });
      setShowDisable2FA(false);
      setTwoFactorEnabled(false);
    } catch (e) {
      toast({ title: 'Error disabling 2FA', variant: 'destructive' });
    } finally {
      setTwoFALoading(false);
    }
  };

  // End all other sessions handler
  const handleEndAllSessions = async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      await fetch('/functions/v1/user-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end_all: true, admin_id: user.id })
      });
      // Refetch sessions
      const res = await fetch(`/functions/v1/user-sessions?user_id=${user.id}`);
      const json = await res.json();
      setSessions(json.data || []);
      toast({ title: 'All other sessions ended' });
    } catch (e) {
      toast({ title: 'Error ending sessions', variant: 'destructive' });
    } finally {
      setSessionsLoading(false);
    }
  };

  // Notification toggles handler
  const handleNotificationToggle = async (type: 'login' | 'transaction', checked: boolean) => {
    setNotifLoading(true);
    try {
      await fetch('/functions/v1/update-notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, type, enabled: checked })
      });
      toast({ title: 'Preferences updated' });
      if (type === 'login') setLoginNotifications(checked);
      if (type === 'transaction') setTransactionAlerts(checked);
      setNotifSaved(type);
      setTimeout(() => setNotifSaved(null), 1200);
    } catch (e) {
      toast({ title: 'Error updating preferences', variant: 'destructive' });
    } finally {
      setNotifLoading(false);
    }
  };

  // Copy secret handler
  const handleCopySecret = async () => {
    if (twoFASecret) {
      await navigator.clipboard.writeText(twoFASecret);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
      toast({ title: 'Secret copied to clipboard' });
    }
  };

  // Confetti on 2FA success
  const handle2FASuccess = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Settings</h1>
          <p className="text-gray-600">Manage your account security and privacy</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Password & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      aria-label="Current password"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrent(v => !v)}
                      aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      aria-label="New password"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNew(v => !v)}
                      aria-label={showNew ? 'Hide new password' : 'Show new password'}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {newPassword && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`h-2 w-32 rounded bg-gray-200 overflow-hidden`}>
                        <div
                          className={`h-2 rounded transition-all duration-300 ${
                            passwordStrength.score === 0 ? 'bg-red-500 w-1/5' :
                            passwordStrength.score === 1 ? 'bg-orange-500 w-2/5' :
                            passwordStrength.score === 2 ? 'bg-yellow-500 w-3/5' :
                            passwordStrength.score === 3 ? 'bg-blue-500 w-4/5' :
                            'bg-green-600 w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score < 2 ? 'text-red-600' :
                        passwordStrength.score === 2 ? 'text-yellow-600' :
                        passwordStrength.score === 3 ? 'text-blue-600' :
                        'text-green-700'
                      }`}>
                        {strengthLabels[passwordStrength.score]}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      aria-label="Confirm new password"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirm(v => !v)}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleUpdatePassword} disabled={passwordLoading} aria-label="Update password">
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
                {passwordSuccess && (
                  <div className="flex items-center gap-2 mt-2 text-green-600 animate-bounce">
                    <Check className="w-5 h-5" /> Password updated!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Two-Factor Authentication
                {twoFactorEnabled ? (
                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Enabled</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-600">Disabled</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handle2FAToggle}
                  disabled={twoFALoading}
                  aria-label="Enable two-factor authentication"
                />
              </div>
              {twoFactorEnabled && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Download an authenticator app like Google Authenticator or Authy
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setShow2FADialog(true)}>
                    Setup Authenticator App
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2"
                    onClick={() => setShowDisable2FA(true)}
                    aria-label="Disable two-factor authentication"
                  >
                    <ShieldOff className="w-4 h-4 mr-1" /> Disable 2FA
                  </Button>
                </div>
              )}
              <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
                <div className="p-6">
                  <DialogTitle className="mb-2">Set up Two-Factor Authentication</DialogTitle>
                  {twoFALoading ? (
                    <div>Loading...</div>
                  ) : twoFASecret ? (
                    <>
                      <DialogDescription className="mb-2">Scan this QR code in your authenticator app or enter the secret manually:</DialogDescription>
                      {otpauthUrl && (
                        <div className="flex flex-col items-center mb-2">
                          <QRCodeGenerator data={otpauthUrl} size={180} />
                          <div className="text-xs text-gray-500 mt-1 break-all">{otpauthUrl}</div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-mono bg-gray-100 p-2 rounded select-all" aria-label="2FA secret">{twoFASecret}</div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Copy 2FA secret"
                          onClick={handleCopySecret}
                        >
                          {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Input
                        placeholder="Enter code from app"
                        value={twoFACode}
                        onChange={e => setTwoFACode(e.target.value)}
                        className="mb-2"
                        aria-label="2FA code"
                      />
                      <Button onClick={handleVerify2FA} disabled={twoFALoading} aria-label="Verify and enable 2FA">
                        {twoFALoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                      </Button>
                      {confettiActive && (
                        <div ref={confettiRef} className="fixed inset-0 pointer-events-none z-50">
                          {/* You can add a confetti animation here, e.g. using a package or a simple SVG animation */}
                          <span className="block w-full h-full animate-ping bg-green-200 opacity-50 rounded-full" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Error loading 2FA secret.</div>
                  )}
                </div>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Notifications</p>
                  <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={loginNotifications}
                    onCheckedChange={checked => handleNotificationToggle('login', checked)}
                    disabled={notifLoading}
                    aria-label="Toggle login notifications"
                  />
                  {notifSaved === 'login' && <Check className="w-4 h-4 text-green-600 animate-bounce" aria-label="Saved" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transaction Alerts</p>
                  <p className="text-sm text-gray-600">Get notified for all transactions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={transactionAlerts}
                    onCheckedChange={checked => handleNotificationToggle('transaction', checked)}
                    disabled={notifLoading}
                    aria-label="Toggle transaction alerts"
                  />
                  {notifSaved === 'transaction' && <Check className="w-4 h-4 text-green-600 animate-bounce" aria-label="Saved" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-gray-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-gray-500">No active sessions found.</div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-shadow ${
                        session.is_current
                          ? 'border-blue-500 bg-blue-50 shadow-md' // Highlight current session
                          : session.revoked
                          ? 'bg-gray-100 text-gray-400'
                          : 'hover:shadow'
                      }`}
                      aria-current={session.is_current ? 'true' : undefined}
                    >
                      <div>
                        <p className="font-medium">
                          {session.device || 'Unknown Device'}
                          {session.is_current && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Current</span>
                          )}
                          {session.revoked && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-600">Revoked</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.browser || 'Unknown Browser'}
                          {session.location ? ` • ${session.location}` : ''}
                          {session.ip_address ? ` • IP: ${session.ip_address}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.revoked
                            ? 'Revoked'
                            : session.is_current
                            ? 'Active now'
                            : `Last active: ${session.last_active || session.created_at}`}
                        </p>
                      </div>
                      {!session.is_current && !session.revoked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEndSession(session.session_id)}
                          aria-label={`End session for ${session.device || 'device'}`}
                        >
                          End Session
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowEndAllDialog(true)}
                disabled={sessionsLoading}
                aria-label="End all other sessions"
              >
                {sessionsLoading ? 'Ending...' : 'End All Other Sessions'}
              </Button>
              <Dialog open={showEndAllDialog} onOpenChange={setShowEndAllDialog}>
                <div className="p-6">
                  <DialogTitle className="mb-2">End All Other Sessions</DialogTitle>
                  <DialogDescription className="mb-4">Are you sure you want to end all other sessions? This will log you out from all devices except this one.</DialogDescription>
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={handleEndAllSessions} aria-label="Confirm end all sessions">
                      End All
                    </Button>
                    <Button variant="outline" onClick={() => setShowEndAllDialog(false)} aria-label="Cancel end all sessions">
                      Cancel
                    </Button>
                  </div>
                </div>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Recent Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loginHistoryLoading ? (
                <div className="text-gray-500">Loading login history...</div>
              ) : loginHistory.length === 0 ? (
                <div className="text-gray-500">No recent logins found.</div>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((entry, i) => (
                    <div key={entry.id || i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{entry.device || 'Unknown Device'}</p>
                        <p className="text-sm text-gray-600">{entry.browser || 'Unknown Browser'} • {entry.location || 'Unknown Location'}</p>
                        <p className="text-xs text-gray-500">IP: {entry.ip_address || 'N/A'}</p>
                      </div>
                      <span className="text-xs text-gray-500">{entry.logged_in_at ? new Date(entry.logged_in_at).toLocaleString() : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={showDisable2FA} onOpenChange={setShowDisable2FA}>
        <div className="p-6">
          <DialogTitle className="mb-2">Disable Two-Factor Authentication</DialogTitle>
          <DialogDescription className="mb-4">Are you sure you want to disable 2FA? This will make your account less secure.</DialogDescription>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDisable2FA} aria-label="Confirm disable 2FA">
              <X className="w-4 h-4 mr-1" /> Disable 2FA
            </Button>
            <Button variant="outline" onClick={() => setShowDisable2FA(false)} aria-label="Cancel disable 2FA">
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </Layout>
  );
};

export default Security;
