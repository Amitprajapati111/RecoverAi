import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AtRisk } from './pages/AtRisk';
import { RecoveryCases } from './pages/RecoveryCases';
import { Approvals } from './pages/Approvals';
import { Campaigns } from './pages/Campaigns';
import { Payments } from './pages/Payments';
import { FailedPayments } from './pages/FailedPayments';
import { PaymentDetail } from './pages/PaymentDetail';
import { RecoveryCaseDetail } from './pages/RecoveryCaseDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { AIDecisions } from './pages/AIDecisions';
import { AIEvaluations } from './pages/AIEvaluations';
import { Analytics } from './pages/Analytics';
import { AuditLogs } from './pages/AuditLogs';
import { SimulatorDemo } from './pages/SimulatorDemo';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Modules */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/at-risk" element={<AtRisk />} />
          <Route path="/recovery-cases" element={<RecoveryCases />} />
          <Route path="/recovery-cases/:id" element={<RecoveryCaseDetail />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/failed-payments" element={<FailedPayments />} />
          <Route path="/payments/:id" element={<PaymentDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/ai-decisions" element={<AIDecisions />} />
          <Route path="/ai-evaluations" element={<AIEvaluations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/simulator" element={<SimulatorDemo />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
