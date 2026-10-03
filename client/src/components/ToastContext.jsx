import { createContext, useCallback, useContext, useState } from 'react';
import { Check, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3800);
  }, []);
  return <ToastContext.Provider value={toast}>{children}<div className="toast-stack" role="status" aria-live="polite">{items.map((item) => <div key={item.id} className={`toast toast-${item.type}`}>{item.type === 'error' ? <CircleAlert size={17}/> : item.type === 'info' ? <Info size={17}/> : <Check size={17}/>}<span>{item.message}</span><button onClick={() => setItems((current) => current.filter((toastItem) => toastItem.id !== item.id))} aria-label="Dismiss"><X size={15}/></button></div>)}</div></ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
