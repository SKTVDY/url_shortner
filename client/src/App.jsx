import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import LinkAnalyticsPage from './pages/LinkAnalyticsPage';

function NotFound() { return <div className="not-found"><span>404</span><h1>We lost that little link.</h1><p>The page you’re looking for has wandered off.</p><a href="/">Take me home</a></div>; }

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/login" element={<AuthPage mode="login"/>}/>
    <Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>
      <Route path="/dashboard" element={<DashboardPage/>}/>
      <Route path="/dashboard/links" element={<DashboardPage view="links"/>}/>
      <Route path="/dashboard/analytics" element={<DashboardPage view="analytics"/>}/>
      <Route path="/dashboard/urls/:id/analytics" element={<LinkAnalyticsPage/>}/>
      <Route path="/profile" element={<Navigate to="/dashboard" replace/>}/>
    </Route></Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes>;
}
