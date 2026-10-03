import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Brand({ dark = false, compact = false }) {
  return <Link className={`brand ${dark ? 'brand-dark' : ''}`} to="/" aria-label="Shortly home"><span className="brand-mark">s</span><span>shortly<span className="brand-period">.</span></span>{compact && <ArrowUpRight size={14} className="brand-arrow" />}</Link>;
}
