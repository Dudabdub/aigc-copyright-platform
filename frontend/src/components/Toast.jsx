import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`toast toast-${toast.type || 'info'}`} role="status">
      <Icon size={18} /><span>{toast.message}</span><button aria-label="关闭提示" onClick={onClose}><X size={16} /></button>
    </div>
  );
}
