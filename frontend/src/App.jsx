import { Routes, Route } from 'react-router-dom'
import { AnalysisProvider } from './context/AnalysisContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import FraudRingsPage from './pages/FraudRingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import HistoryPage from './pages/HistoryPage'
import ReportPage from './pages/ReportPage'
import HowItWorksPage from './pages/HowItWorksPage'

export default function App() {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <div className="min-h-screen app-bg">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rings" element={<FraudRingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
          </Routes>
        </div>
      </AnalysisProvider>
    </ThemeProvider>
  )
}
