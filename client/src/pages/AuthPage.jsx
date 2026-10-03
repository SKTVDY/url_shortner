import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff, Link2, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || '/dashboard';
  if (user) return <Navigate to="/dashboard" replace/>;
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { if (isRegister) await register({ name: values.name, email: values.email, password: values.password }); else await login({ email: values.email, password: values.password }); toast(isRegister ? 'Your space is ready. Welcome to Shortly!' : 'Welcome back.'); navigate(from, { replace: true }); }
    catch (cause) {
      const message = cause.response?.data?.message
        || (cause.request
          ? 'The API is not responding. Check the server terminal for “MongoDB connected” and make sure it is running on port 5000.'
          : 'We couldn’t complete that request. Please try again.');
      setError(message);
    }
    finally { setSubmitting(false); }
  }
  return <main className="auth-page"><div className="auth-topbar"><Brand/><Link to="/" className="auth-back"><ArrowLeft size={14}/> Back to home</Link></div><div className="auth-layout"><section className="auth-story"><div className="auth-story-inner"><div className="eyebrow"><Sparkles size={13}/> A SMALLER LINK. A BIGGER REACH.</div><h1>Good links go<br/><span>great places.</span></h1><p>Shorten, share, and see the little things travel a long way.</p><div className="story-link-card"><span className="story-link-icon"><Link2 size={16}/></span><div><strong>shortly.link/your-next-big-thing</strong><span>Created just for you</span></div><span className="story-check"><Check size={14}/></span></div><div className="story-note"><div className="story-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><span>Made with care for <strong>curious people</strong></span></div><div className="auth-decoration deco-one"/><div className="auth-decoration deco-two"/></div></section><section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><Brand/></div><div className="auth-form-heading"><span className="auth-icon"><UserRound size={18}/></span><h2>{isRegister ? 'Make yourself at home.' : 'Lovely to see you again.'}</h2><p>{isRegister ? 'Create your free account and start sharing.' : 'Pick up right where you left off.'}</p></div><form onSubmit={submit} className="auth-form" noValidate>{isRegister && <label className="auth-field"><span>Your name</span><div><UserRound size={16}/><input name="name" type="text" autoComplete="name" placeholder="How should we call you?" required maxLength={80}/></div></label>}<label className="auth-field"><span>Email address</span><div><Mail size={16}/><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></div></label><label className="auth-field"><span>Password</span><div><LockKeyhole size={16}/><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required minLength={isRegister ? 8 : undefined}/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>{isRegister && <p className="password-hint"><Check size={13}/> 8+ characters, with uppercase, lowercase, and a number</p>}{error && <div className="auth-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={submitting}>{submitting ? <span className="spinner spinner-light"/> : <>{isRegister ? 'Create my free account' : 'Sign in to Shortly'} <ArrowRight size={16}/></>}</button></form><div className="auth-switch">{isRegister ? <>Already with us? <Link to="/login">Sign in <ArrowUpRight size={13}/></Link></> : <>New around here? <Link to="/register">Create a free account <ArrowUpRight size={13}/></Link></>}</div><p className="auth-terms">By continuing, you agree to our <a href="/">Terms</a> and <a href="/">Privacy Policy</a>.</p></div><footer className="auth-footer">© {new Date().getFullYear()} Shortly, made for sharing.</footer></section></div></main>;
}
