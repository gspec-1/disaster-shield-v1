import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import IntakePage from './pages/IntakePage'
import SignupPage from './pages/auth/SignupPage'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ClientDashboard from './pages/client/Dashboard'
import BrowseContractors from './pages/client/BrowseContractors'
import ReviewEstimates from './pages/client/ReviewEstimates'
import MatchingPage from './pages/MatchingPage'
import ContractorDashboard from './pages/contractor/Dashboard'
import BrowseJobs from './pages/contractor/BrowseJobs'
import ContractorProfile from './pages/contractor/Profile'
import SubmitEstimate from './pages/contractor/SubmitEstimate'
import ProjectPortal from './pages/portal/ProjectPortal'
import AcceptJob from './pages/AcceptJob'
import AcceptJobPage from './pages/AcceptJobPage'
import DeclineJobPage from './pages/DeclineJobPage'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentDeclinedPage from './pages/PaymentDeclinedPage'
import FNOLPage from './pages/fnol/FNOLPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import InsuranceCompaniesPage from './pages/admin/InsuranceCompaniesPage'
import AdminRoute from './components/AdminRoute'
import ClientRoute from './components/ClientRoute'
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/client/login" element={<LoginPage />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/browse-contractors" element={<BrowseContractors />} />
        <Route path="/client/review-estimates/:projectId" element={<ReviewEstimates />} />
        <Route path="/matching/:projectId" element={<MatchingPage />} />
        <Route path="/contractor/login" element={<LoginPage />} />
        <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
        <Route path="/contractor/browse-jobs" element={<BrowseJobs />} />
        <Route path="/contractor/profile" element={<ContractorProfile />} />
        <Route path="/contractor/submit-estimate/:projectId" element={<SubmitEstimate />} />
        <Route path="/portal/:id" element={<ProjectPortal />} />
        <Route path="/payment/:projectId" element={<PaymentPage />} />
        <Route path="/accept/:token" element={<AcceptJob />} />
        <Route path="/accept-job/:token" element={<AcceptJobPage />} />
        <Route path="/decline-job/:token" element={<DeclineJobPage />} />
        <Route path="/payment-success/:projectId" element={<PaymentSuccessPage />} />
        <Route path="/payment-declined/:projectId" element={<PaymentDeclinedPage />} />
        <Route path="/fnol/:projectId" element={
          <ClientRoute>
            <FNOLPage />
          </ClientRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/insurance-companies" element={
          <AdminRoute>
            <InsuranceCompaniesPage />
          </AdminRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App