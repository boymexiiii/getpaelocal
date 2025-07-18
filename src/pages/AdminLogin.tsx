import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CODE = '0000000';

const AdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (code === ADMIN_CODE) {
        // Store a flag in localStorage and sessionStorage to allow access to /admin
        localStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_authenticated', 'true'); // <-- Added for compatibility
        navigate('/admin');
        window.location.reload();
      } else {
        toast({
          title: 'Access Denied',
          description: 'Invalid admin code',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Login Error',
        description: 'An error occurred during login',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-teal-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-code">Admin Code</Label>
              <Input
                id="admin-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                maxLength={7}
                minLength={7}
                placeholder="Enter 7-digit admin code"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Login as Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin; 