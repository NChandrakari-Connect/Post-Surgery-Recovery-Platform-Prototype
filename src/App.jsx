import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';
import ToastContainer from './components/common/ToastContainer';

// Care Team Pages
import Dashboard from './pages/care-team/Dashboard';
import PatientList from './pages/care-team/PatientList';
import PatientProfile from './pages/care-team/PatientProfile';
import Alerts from './pages/care-team/Alerts';
import FollowUps from './pages/care-team/FollowUps';
import ReportsOverview from './pages/care-team/ReportsOverview';
import RecoveryMonitoring from './pages/care-team/RecoveryMonitoring';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientSurgeryDischarge from './pages/patient/PatientSurgeryDischarge';
import PatientCheckin from './pages/patient/PatientCheckin';
import PatientReports from './pages/patient/PatientReports';
import PatientMedications from './pages/patient/PatientMedications';
import PatientTimeline from './pages/patient/PatientTimeline';
import PatientCareTeam from './pages/patient/PatientCareTeam';

import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

function AppContent() {
  const { role } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <TopNav />
      <main className="main-content">
        {role === 'care-team' ? (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/reports-overview" element={<ReportsOverview />} />
            <Route path="/monitoring" element={<RecoveryMonitoring />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/surgery-discharge" element={<PatientSurgeryDischarge />} />
            <Route path="/checkin" element={<PatientCheckin />} />
            <Route path="/my-reports" element={<PatientReports />} />
            <Route path="/my-medications" element={<PatientMedications />} />
            <Route path="/my-timeline" element={<PatientTimeline />} />
            <Route path="/my-care-team" element={<PatientCareTeam />} />
            <Route path="*" element={<PatientDashboard />} />
          </Routes>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HashRouter>
  );
}
