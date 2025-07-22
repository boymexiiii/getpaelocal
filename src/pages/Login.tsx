
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Fingerprint, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { startAuthentication } from '@simplewebauthn/browser';
import { startRegistration } from '@simplewebauthn/browser';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (!error) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!email) {
        toast({ title: 'Email required', description: 'Please enter your email to use biometric login', variant: 'destructive' });
        return;
      }
      // 1. Get userId (for demo, use email as userId; in production, use real userId)
      const userId = email;
      // 2. Fetch authentication options from backend
      const optionsRes = await fetch('/functions/v1/webauthn-authentication-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!optionsRes.ok) throw new Error('Failed to get authentication options');
      const options = await optionsRes.json();
      // 3. Start authentication with browser
      const credential = await startAuthentication(options);
      // 4. Send response to backend for verification
      const verifyRes = await fetch('/functions/v1/webauthn-verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credential, expectedChallenge: options.challenge }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        toast({ title: 'Biometric Login Successful', description: 'You are now logged in!', variant: 'default' });
        // TODO: Set session/cookie and redirect to dashboard
        navigate('/dashboard');
      } else {
        toast({ title: 'Biometric Login Failed', description: verifyData.error || 'Verification failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Biometric Login Error', description: err.message || 'An error occurred', variant: 'destructive' });
    }
  };

  const handleBiometricRegister = async () => {
    try {
      if (!email) {
        toast({ title: 'Email required', description: 'Please enter your email to register biometric', variant: 'destructive' });
        return;
      }
      // 1. Get userId (for demo, use email as userId; in production, use real userId)
      const userId = email;
      // 2. Fetch registration options from backend
      const optionsRes = await fetch('/functions/v1/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username: email, displayName: email }),
      });
      if (!optionsRes.ok) throw new Error('Failed to get registration options');
      const options = await optionsRes.json();
      // 3. Start registration with browser
      const credential = await startRegistration(options);
      // 4. Send response to backend for verification
      const verifyRes = await fetch('/functions/v1/webauthn-verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credential, expectedChallenge: options.challenge }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        toast({ title: 'Biometric Registered', description: 'You can now use biometric login!', variant: 'default' });
      } else {
        toast({ title: 'Biometric Registration Failed', description: verifyData.error || 'Verification failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Biometric Registration Error', description: err.message || 'An error occurred', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Pae
              </span>
            </div>
          </div>
        </div>

        <Card className="border-purple-100 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your Pae account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="border-purple-200 focus:border-purple-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleBiometricLogin}
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Biometric Login
            </Button>
            <Button
              variant="outline"
              onClick={handleBiometricRegister}
              className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 mt-2"
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Register Biometric
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Protected by industry-leading security standards</p>
          <p className="mt-1">🔒 Bank-level encryption • 🛡️ Dual OTP verification</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
