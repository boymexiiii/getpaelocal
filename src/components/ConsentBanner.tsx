import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Cookie, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem('pae-cookie-consent');
    if (hasConsented !== 'accepted') {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pae-cookie-consent', 'accepted');
    localStorage.setItem('pae-privacy-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('pae-cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto border-purple-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Cookie className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Privacy Matters</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We use cookies and similar technologies to provide our financial services, ensure security, 
                  prevent fraud, and improve your experience. By continuing to use Pae, you consent to our use 
                  of cookies as described in our{' '}
                  <Link to="/privacy" className="text-purple-600 hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}and{' '}
                  <Link to="/terms" className="text-purple-600 hover:underline">
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Bank-level security • GDPR compliant • Data encrypted</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="text-xs"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                Accept All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentBanner;