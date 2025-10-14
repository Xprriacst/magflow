import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
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

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<SmartContentCreator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/content-editor" element={<ContentEditor />} />
        <Route path="/smart-content-creator" element={<SmartContentCreator />} />
        <Route path="/template-gallery" element={<TemplateGallery />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/image-manager" element={<ImageManager />} />
        <Route path="/processing-status" element={<ProcessingStatus />} />
        <Route path="/template-preview" element={<TemplatePreview />} />
        <Route path="/generation-loading" element={<GenerationLoading />} />
        <Route path="/generation-result" element={<GenerationResult />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;