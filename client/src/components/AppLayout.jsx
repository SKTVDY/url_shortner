import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BarChart3, ChevronDown, CircleHelp, Command, Link2, LogOut, Menu, X } from 'lucide-react';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  async function handleLogout() { await logout(); navigate('/'); }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="sidebar-head"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-select"><div className="workspace-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div><div className="workspace-copy"><strong>{user?.name?.split(' ')[0] || 'My'}’s space</strong><span>Free workspace</span></div><ChevronDown size={15} className="muted"/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">
        <NavLink to="/dashboard" end onClick={() => setMobileNav(false)}><Command size={17}/><span>Overview</span><span className="nav-shortcut">⌘ 1</span></NavLink>
        <NavLink to="/dashboard/links" onClick={() => setMobileNav(false)}><Link2 size={17}/><span>My links</span></NavLink>
        <NavLink to="/dashboard/analytics" onClick={() => setMobileNav(false)}><BarChart3 size={17}/><span>Analytics</span></NavLink>
      </nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-help"><div className="help-icon"><CircleHelp size={16}/></div><div><strong>Need a hand?</strong><span>We’re here for you.</span></div><a href="mailto:hello@shortly.app" aria-label="Email support"><ArrowUpRight size={14}/></a></div>
      <div className="profile-menu"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div><div className="profile-copy"><strong>{user?.name}</strong><span>{user?.email}</span></div><button className="icon-button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16}/></button></div>
    </aside>
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-panel"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>Overview</strong></div><div className="topbar-actions"><span className="online-status"><i/> All systems normal</span><span className="topbar-divider"/><button className="topbar-avatar" title={user?.name}>{user?.name?.charAt(0)?.toUpperCase()}</button></div></header><div className="dashboard-content"><Outlet/></div></main>
  </div>;
}
