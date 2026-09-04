import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
}

export const ToastContainer: React.FC<ToastProps> = ({
  toasts,
  onDismiss,
  position = 'bottom-right',
}) => {
  const positionClass =
    position === 'bottom-left'
      ? 'bottom-5 left-5 md:left-72'
      : position === 'top-right'
      ? 'top-5 right-5'
      : 'bottom-5 right-5';

  return (
    <div
      className={`fixed ${positionClass} z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full transition-all duration-300`}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      border: 'border-zinc-200 bg-white/95 text-zinc-900',
      icon: CheckCircle,
      iconColor: 'text-zinc-900',
    },
    error: {
      border: 'border-zinc-200 bg-white/95 text-zinc-900',
      icon: AlertCircle,
      iconColor: 'text-black',
    },
    info: {
      border: 'border-zinc-200 bg-white/95 text-zinc-900',
      icon: Info,
      iconColor: 'text-zinc-700',
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-2xl border ${config.border} shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3`}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconColor}`} />
        <div>
          <h4 className="text-xs font-bold text-zinc-900 tracking-tight">{toast.title}</h4>
          {toast.message && <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{toast.message}</p>}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-zinc-400 hover:text-zinc-900 transition shrink-0 ml-2"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
