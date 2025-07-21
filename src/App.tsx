
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Fund from '@/pages/Fund';
import Send from '@/pages/Send';
import Request from '@/pages/Request';
import Transactions from '@/pages/Transactions';
import KYC from '@/pages/KYC';
import Settings from '@/pages/Settings';
import Index from '@/pages/Index';
import Cards from '@/pages/Cards';
import Bills from '@/pages/Bills';
import Analytics from '@/pages/Analytics';
import Invest from '@/pages/Invest';
import Notifications from '@/pages/Notifications';
import QRPayment from '@/pages/QRPayment';
import QRPaymentConfirm from '@/pages/QRPaymentConfirm';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import EmailVerification from '@/pages/EmailVerification';
import NigeriaBanking from '@/pages/NigeriaBanking';
import NotFound from '@/pages/NotFound';
import UserAnalytics from '@/pages/UserAnalytics';
import { Toaster } from '@/components/ui/toaster';
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary';
import { initSentry } from '@/utils/sentry';
import PaymentCallback from '@/pages/PaymentCallback';
import PaymentMethods from '@/pages/PaymentMethods';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import Compliance from '@/pages/Compliance';
import GiftCards from '@/pages/GiftCards';
import About from '@/pages/About';
import Careers from '@/pages/Careers';
import Press from '@/pages/Press';
import Blog from '@/pages/Blog';
import Security from '@/pages/Security';
import HelpCenter from '@/pages/HelpCenter';
import Contact from '@/pages/Contact';
import ApiDocs from '@/pages/ApiDocs';
import Status from '@/pages/Status';
import ProtectedRoute from '@/components/ProtectedRoute';
import AccountingSettings from '@/pages/AccountingSettings';
import Remittance from '@/pages/Remittance';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UsersAdminPage from '@/pages/admin/Users';
import TransactionsAdminPage from '@/pages/admin/Transactions';
import BillsAdminPage from '@/pages/admin/Bills';
import KYCAdminPage from '@/pages/admin/KYC';
import BankTransfersAdminPage from '@/pages/admin/BankTransfers';
import NotificationsAdminPage from '@/pages/admin/Notifications';
import SettingsAdminPage from '@/pages/admin/Settings';
import AuditLogsAdminPage from '@/pages/admin/AuditLogs';
import TestBVN from '@/pages/TestBVN';
import KYCStatusFloatingAlert from '@/components/KYCStatusFloatingAlert';

// Initialize Sentry
initSentry();

const queryClient = new QueryClient();

function App() {
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster />
            <KYCStatusFloatingAlert />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/fund" element={<ProtectedRoute><Fund /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><Send /></ProtectedRoute>} />
              <Route path="/request" element={<ProtectedRoute><Request /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
              <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/settings/accounting" element={<ProtectedRoute><AccountingSettings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/qr-payment" element={<ProtectedRoute><QRPayment /></ProtectedRoute>} />
              <Route path="/qr-payment-confirm" element={<ProtectedRoute><QRPaymentConfirm /></ProtectedRoute>} />
              <Route path="/security-settings" element={<ProtectedRoute><Security /></ProtectedRoute>} />
              <Route path="/nigeria-banking" element={<ProtectedRoute><NigeriaBanking /></ProtectedRoute>} />
              <Route path="/user-analytics" element={<ProtectedRoute><UserAnalytics /></ProtectedRoute>} />
              <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
              <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/press" element={<Press />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/security" element={<Security />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/status" element={<Status />} />
              <Route path="/gift-cards" element={<ProtectedRoute><GiftCards /></ProtectedRoute>} />
              <Route path="/remittance" element={<ProtectedRoute><Remittance /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><UsersAdminPage /></ProtectedRoute>} />
              <Route path="/admin/transactions" element={<ProtectedRoute><TransactionsAdminPage /></ProtectedRoute>} />
              <Route path="/admin/bills" element={<ProtectedRoute><BillsAdminPage /></ProtectedRoute>} />
              <Route path="/admin/kyc" element={<ProtectedRoute><KYCAdminPage /></ProtectedRoute>} />
              <Route path="/admin/bank-transfers" element={<ProtectedRoute><BankTransfersAdminPage /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute><NotificationsAdminPage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><SettingsAdminPage /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute><AuditLogsAdminPage /></ProtectedRoute>} />
              <Route path="/test-bvn" element={<ProtectedRoute><TestBVN /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
