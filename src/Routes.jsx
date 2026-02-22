import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLogin from './pages/auth/Login';
import AuthSignup from './pages/auth/Signup';
import AuthCallback from './pages/auth/Callback';
import Login from './pages/login';
import ContentEditor from './pages/content-editor';
import SmartContentCreator from './pages/smart-content-creator';
import TemplateGallery from './pages/template-gallery';
import Dashboard from './pages/dashboard';
import ImageManager from './pages/image-manager';
import ProcessingStatus from './pages/processing-status';
import TemplatePreview from './pages/template-preview';
import RegisterPage from './pages/register';
import GenerationLoading from './pages/generation-loading';
import GenerationResult from './pages/generation-result';
import TemplatesAdmin from './pages/admin/templates';
import PricingPage from './pages/pricing';
import PaymentSuccessPage from './pages/payment/success';
import AccountPage from './pages/account';
import TermsPage from './pages/legal/terms';
import PrivacyPage from './pages/legal/privacy';
import GdprPage from './pages/legal/gdpr';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Routes publiques */}
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/signup" element={<AuthSignup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/old-login" element={<Login />} />

        {/* Routes protégées - nécessitent une authentification */}
        <Route path="/" element={
          <ProtectedRoute><SmartContentCreator /></ProtectedRoute>
        } />
        <Route path="/smart-content-creator" element={
          <ProtectedRoute><SmartContentCreator /></ProtectedRoute>
        } />
        <Route path="/content-editor" element={
          <ProtectedRoute><ContentEditor /></ProtectedRoute>
        } />
        <Route path="/template-gallery" element={
          <ProtectedRoute><TemplateGallery /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/image-manager" element={
          <ProtectedRoute><ImageManager /></ProtectedRoute>
        } />
        <Route path="/processing-status" element={
          <ProtectedRoute><ProcessingStatus /></ProtectedRoute>
        } />
        <Route path="/template-preview" element={
          <ProtectedRoute><TemplatePreview /></ProtectedRoute>
        } />
        <Route path="/generation-loading" element={
          <ProtectedRoute><GenerationLoading /></ProtectedRoute>
        } />
        <Route path="/generation-result" element={
          <ProtectedRoute><GenerationResult /></ProtectedRoute>
        } />
        <Route path="/admin/templates" element={
          <ProtectedRoute><TemplatesAdmin /></ProtectedRoute>
        } />

        {/* Pricing - accessible sans auth pour voir les offres */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/legal/cgv" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/rgpd" element={<GdprPage />} />

        {/* Payment success - protégé */}
        <Route path="/payment/success" element={
          <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute><AccountPage /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
