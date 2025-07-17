
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Settings,
  User,
  Shield,
  CreditCard,
  Landmark,
  LogOut,
  Menu,
  X,
  Gift,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false); // Close mobile menu when switching to desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/transactions", 
      icon: CreditCard,
      label: "Transactions",
    },
    {
      to: "/cards",
      icon: CreditCard,
      label: "Virtual Cards",
    },
    {
      to: "/bills",
      icon: CreditCard,
      label: "Bill Payments",
    },
    {
      to: "/gift-cards",
      icon: Gift,
      label: "Gift Cards",
    },
    {
      to: "/invest",
      icon: CreditCard,
      label: "Investments",
    },
    {
      to: "/kyc",
      icon: Shield,
      label: "KYC Verification",
    },
    {
      to: "/admin",
      icon: Shield,
      label: "Admin Panel",
    },
    {
      to: "/nigeria-banking",
      icon: Landmark,
      label: "Nigerian Banking",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.user_metadata?.last_name) {
      return user.user_metadata.last_name;
    }
    return user?.email || 'User';
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name.charAt(0)}${user.user_metadata.last_name.charAt(0)}`.toUpperCase();
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 bg-white shadow-md md:hidden"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Mobile Backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`
        bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'w-80' : 'w-64'}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <NavLink to="/dashboard" className="flex items-center space-x-2 text-xl font-bold">
            <img 
              src="/lovable-uploads/61394b0e-fa0e-4b6f-a9fe-e79413ec7cfa.png" 
              alt="Pae Logo" 
              className="w-8 h-8"
            />
            <span className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Pae</span>
          </NavLink>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems
              .filter(item => {
                // Hide admin panel from non-admin users
                if (item.to === '/admin') {
                  return isAdmin;
                }
                return true;
              })
              .map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={isMobile ? closeMobileMenu : undefined}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 w-full justify-start p-3 hover:bg-gray-50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} />
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getUserDisplayName()}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
