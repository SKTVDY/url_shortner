import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, CircleHelp, Clock3, Copy, ExternalLink, Filter, Link2, MoreHorizontal, MousePointer2, Plus, Search, Sparkles, TrendingUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { copyText, formatDate, isExpired, shortenText } from '../utils/format';
import { useToast } from '../components/ToastContext';

const blankForm = { originalUrl: '', alias: '', expiresAt: '' };
const metricIcons = [Link2, MousePointer2, TrendingUp, Clock3];
const shortUrlBase = (import.meta.env.VITE_SHORT_URL_ORIGIN || 'http://localhost:5000').replace(/\/$/, '').replace(/^https?:\/\//, '');

export default function DashboardPage({ view = 'overview' }) {
  const toast = useToast();
  const [urls, setUrls] = useState([]);
  const [stats, setStats] = useState({ totalUrls: 0, totalClicks: 0, activeUrls: 0, expiredUrls: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blankForm);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('All links');
  const [search, setSearch] = useState('');
  const [menuId, setMenuId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [urlResponse, statsResponse] = await Promise.all([api.get('/urls', { params: search ? { search } : {} }), api.get('/urls/stats')]);
      setUrls(urlResponse.data.data.urls);
      setStats(statsResponse.data.data.stats);
    } catch (error) { toast(error.response?.data?.message || 'Could not load your links.', 'error'); }
    finally { setLoading(false); }
  }, [search, toast]);

  useEffect(() => { const timer = window.setTimeout(load, 220); return () => window.clearTimeout(timer); }, [load]);

  async function createLink(event) {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = { originalUrl: form.originalUrl.trim() };
      if (form.alias.trim()) payload.alias = form.alias.trim();
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
      const { data } = await api.post('/urls', payload);
      setForm(blankForm);
      toast(form.alias ? `Custom link “${form.alias}” is ready.` : 'Your new short link is ready.');
      await load();
      try { await copyText(data.data.url.shortUrl); toast('Short link copied to your clipboard.'); } catch { /* Clipboard can be unavailable on insecure origins. */ }
    } catch (error) { toast(error.response?.data?.message || 'Could not create that short link.', 'error'); }
    finally { setCreating(false); }
  }

  async function copyLink(url) { try { await copyText(url.shortUrl); toast('Link copied to clipboard.'); } catch { toast('Clipboard access is unavailable in this browser.', 'error'); } }
  async function removeLink(url) {
    if (!window.confirm(`Delete the link ${url.shortUrl}? This cannot be undone.`)) return;
    try { await api.delete(`/urls/${url.id}`); toast('Link deleted.'); await load(); }
    catch (error) { toast(error.response?.data?.message || 'Could not delete that link.', 'error'); }
  }
  async function toggleActive(url) {
    try { await api.patch(`/urls/${url.id}`, { isActive: !url.isActive }); toast(url.isActive ? 'Link disabled.' : 'Link enabled.'); await load(); }
    catch (error) { toast(error.response?.data?.message || 'Could not update that link.', 'error'); }
  }

  const visibleUrls = useMemo(() => urls.filter((url) => {
    if (filter === 'Active') return url.isActive && !isExpired(url.expiresAt);
    if (filter === 'Expired') return isExpired(url.expiresAt);
    if (filter === 'Disabled') return !url.isActive;
    return true;
  }), [urls, filter]);
  const metrics = [
    { label: 'Total links', value: stats.totalUrls, note: `${stats.activeUrls} currently active`, color: 'sage' },
    { label: 'Total clicks', value: stats.totalClicks.toLocaleString(), note: 'Across all your links', color: 'lavender' },
    { label: 'Active links', value: stats.activeUrls, note: `${stats.totalUrls ? Math.round(stats.activeUrls / stats.totalUrls * 100) : 0}% of your links`, color: 'peach' },
    { label: 'Expired links', value: stats.expiredUrls, note: 'Past their end date', color: 'blue' }
  ];

  if (view === 'analytics') return <AnalyticsOverview urls={urls} loading={loading}/>;
  const showCreator = view === 'overview' || view === 'links';

  return <>
    <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> YOUR LINK WORKSPACE</div><h1>{view === 'links' ? 'Your links' : 'Good morning, link-maker.'}</h1><p>{view === 'links' ? 'Every link, all in one place.' : 'Here’s what’s happening with your links today.'}</p></div><div className="date-pill"><span className="date-dot"/>{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</div></div>
    <section className="metrics-grid" aria-label="Link statistics">{metrics.map((metric, index) => { const Icon = metricIcons[index]; return <article className="metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className={`metric-icon metric-${metric.color}`}><Icon size={17}/></span></div><div className="metric-value">{loading ? <span className="skeleton skeleton-value"/> : metric.value}</div><div className="metric-note"><i className={`note-dot dot-${metric.color}`}/>{metric.note}</div></article>; })}</section>
    {showCreator && <section className="creator-card"><div className="creator-heading"><div><div className="eyebrow"><Sparkles size={13}/> QUICK CREATE</div><h2>Make a link worth sharing</h2><p>Shorten a URL and make it yours.</p></div><div className="creator-art"><span/><span/><span/><Link2 size={26}/></div></div><form className="create-form" onSubmit={createLink}><label className="field-group url-field"><span>DESTINATION URL</span><div className="field-icon"><ExternalLink size={16}/><input type="url" placeholder="https://your-very-long-url.com/goes-here" value={form.originalUrl} onChange={(event) => setForm({ ...form, originalUrl: event.target.value })} required maxLength={2048} aria-label="Destination URL"/></div></label><label className="field-group alias-field"><span>CUSTOM ALIAS <em>OPTIONAL</em></span><div className="field-icon alias-input"><span className="domain-prefix">{shortUrlBase}/</span><input type="text" placeholder="your-name" value={form.alias} onChange={(event) => setForm({ ...form, alias: event.target.value })} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]{3,30}" title="3–30 letters, numbers, hyphens, or underscores" aria-label="Custom alias"/><button type="button" className="field-info" title="Use 3–30 letters, numbers, hyphens, or underscores"><CircleHelp size={15}/></button></div></label><label className="field-group expiry-field"><span>EXPIRES <em>OPTIONAL</em></span><div className="field-icon"><Clock3 size={16}/><input type="date" value={form.expiresAt} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} aria-label="Expiration date"/></div></label><button className="primary-button create-button" type="submit" disabled={creating}>{creating ? <span className="spinner spinner-light"/> : <><Plus size={17}/> Create link</>}</button></form><div className="creator-footer"><span><Check size={14}/> Free forever, no card required</span><span><span className="footer-dot"/> Links are private to your workspace</span></div></section>}
    <section className="links-section"><div className="section-heading"><div><div className="eyebrow">YOUR LITTLE CORNER OF THE INTERNET</div><h2>Recent links <span className="count-badge">{stats.totalUrls}</span></h2></div><Link to="/dashboard/links" className="text-link">View all links <ArrowRight size={15}/></Link></div><div className="table-toolbar"><div className="filter-tabs">{['All links', 'Active', 'Expired'].map((item) => <button key={item} className={filter === item ? 'filter-tab selected' : 'filter-tab'} onClick={() => setFilter(item)}>{item}{item === 'All links' && <span>{stats.totalUrls}</span>}</button>)}</div><label className="search-box"><Search size={15}/><input placeholder="Search links..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search links"/><kbd>⌘ K</kbd></label></div>
      <div className="links-table-wrap"><table className="links-table"><thead><tr><th>LINK</th><th>DESTINATION</th><th>CLICKS</th><th>CREATED</th><th>STATUS</th><th aria-label="Actions"/></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="table-empty"><span className="spinner"/> Loading your links…</td></tr> : visibleUrls.length ? visibleUrls.slice(0, view === 'overview' ? 5 : undefined).map((url) => { const expired = isExpired(url.expiresAt); const status = expired ? 'Expired' : url.isActive ? 'Active' : 'Disabled'; return <tr key={url.id}><td><div className="link-cell"><span className="link-mini-icon"><Link2 size={15}/></span><div><a href={url.shortUrl} target="_blank" rel="noreferrer" className="short-link">{url.shortUrl.replace(/^https?:\/\//, '')}</a><span className="link-sub">{url.isCustomAlias || url.shortCode.length !== 7 ? 'Custom link' : 'Short link'}</span></div></div></td><td><a href={url.originalUrl} target="_blank" rel="noreferrer" className="destination" title={url.originalUrl}>{shortenText(url.originalUrl, 42)}</a></td><td><span className="click-count">{url.clicks.toLocaleString()}</span></td><td><span className="created-date">{formatDate(url.createdAt, { month: 'short', day: 'numeric' })}</span></td><td><span className={`status-pill ${expired ? 'status-expired' : url.isActive ? 'status-active' : 'status-disabled'}`}><i/>{status}</span></td><td className="action-cell"><button className="icon-button row-action" onClick={() => copyLink(url)} title="Copy short link" aria-label="Copy short link"><Copy size={15}/></button><div className="row-menu-wrap"><button className="icon-button row-action" onClick={() => setMenuId(menuId === url.id ? null : url.id)} aria-label="More link actions"><MoreHorizontal size={17}/></button>{menuId === url.id && <><button className="click-away" onClick={() => setMenuId(null)} aria-label="Close actions"/><div className="row-menu"><Link to={`/dashboard/urls/${url.id}/analytics`} onClick={() => setMenuId(null)}><BarChart3 size={14}/> View analytics</Link><button onClick={() => { setMenuId(null); toggleActive(url); }}>{url.isActive ? <><X size={14}/> Disable link</> : <><Check size={14}/> Enable link</>}</button><button className="danger-menu" onClick={() => { setMenuId(null); removeLink(url); }}><X size={14}/> Delete link</button></div></>}</div></td></tr>; }) : <tr><td colSpan="6" className="table-empty"><div className="empty-state"><span className="empty-icon"><Link2 size={21}/></span><strong>{search ? 'No matching links' : 'It’s quiet here…'}</strong><span>{search ? 'Try a different search.' : 'Create your first link above and it’ll show up here.'}</span>{search && <button className="text-link" onClick={() => setSearch('')}>Clear search <X size={14}/></button>}</div></td></tr>}</tbody></table></div>
      {visibleUrls.length > 5 && view === 'overview' && <Link to="/dashboard/links" className="table-footer">See all {visibleUrls.length} links <ArrowRight size={14}/></Link>}
    </section>
    <footer className="dashboard-footer"><span>Made for the things worth sharing <span>✳</span></span><span><a href="mailto:hello@shortly.app">Help</a><a href="/">Privacy</a><a href="/">Terms</a></span></footer>
  </>;
}

function AnalyticsOverview({ urls, loading }) {
  const clicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  return <><div className="welcome-row"><div><div className="eyebrow">LINK PERFORMANCE</div><h1>Your analytics</h1><p>A little look at how your links are traveling.</p></div></div><section className="metrics-grid"><article className="metric-card"><div className="metric-top"><span>Total clicks</span><span className="metric-icon metric-lavender"><MousePointer2 size={17}/></span></div><div className="metric-value">{loading ? '—' : clicks.toLocaleString()}</div><div className="metric-note">All-time clicks across your links</div></article><article className="metric-card"><div className="metric-top"><span>Links created</span><span className="metric-icon metric-sage"><Link2 size={17}/></span></div><div className="metric-value">{loading ? '—' : urls.length}</div><div className="metric-note">Links in your workspace</div></article><article className="metric-card"><div className="metric-top"><span>Most popular</span><span className="metric-icon metric-peach"><TrendingUp size={17}/></span></div><div className="metric-value metric-value-small">{loading ? '—' : (urls.slice().sort((a, b) => b.clicks - a.clicks)[0]?.shortCode || '—')}</div><div className="metric-note">Your highest traffic link</div></article><article className="metric-card"><div className="metric-top"><span>Avg. clicks / link</span><span className="metric-icon metric-blue"><BarChart3 size={17}/></span></div><div className="metric-value">{loading || !urls.length ? 0 : Math.round(clicks / urls.length)}</div><div className="metric-note">A simple average, just for you</div></article></section><section className="links-section"><div className="section-heading"><div><div className="eyebrow">PER LINK DETAILS</div><h2>Explore your links</h2></div></div><div className="links-table-wrap"><table className="links-table"><thead><tr><th>LINK</th><th>DESTINATION</th><th>CLICKS</th><th>CREATED</th><th>STATUS</th><th/></tr></thead><tbody>{urls.map((url) => <tr key={url.id}><td><div className="link-cell"><span className="link-mini-icon"><Link2 size={15}/></span><Link to={`/dashboard/urls/${url.id}/analytics`} className="short-link">{url.shortUrl.replace(/^https?:\/\//, '')}</Link></div></td><td><span className="destination">{shortenText(url.originalUrl, 42)}</span></td><td><strong>{url.clicks}</strong></td><td>{formatDate(url.createdAt, { month: 'short', day: 'numeric' })}</td><td><Link to={`/dashboard/urls/${url.id}/analytics`} className="text-link">Details <ArrowRight size={13}/></Link></td><td/></tr>)}</tbody></table></div>{!urls.length && !loading && <div className="empty-state analytics-empty"><strong>No link data yet</strong><span>Once you create and share a link, its clicks will appear here.</span><Link to="/dashboard" className="text-link">Create a link <ArrowRight size={14}/></Link></div>}</section></>;
}
