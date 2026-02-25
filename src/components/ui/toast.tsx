'use client';

import { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = !toast.type || toast.type === 'success';

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        isSuccess
          ? 'border-green-200 bg-green-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isSuccess ? 'bg-green-200 text-green-700' : 'bg-blue-200 text-blue-700'
        }`}
      >
        {isSuccess ? '✓' : 'i'}
      </div>
      <p className={`text-sm font-medium ${isSuccess ? 'text-green-800' : 'text-blue-800'}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`ml-auto flex-shrink-0 rounded p-0.5 text-xs ${
          isSuccess ? 'text-green-400 hover:text-green-600' : 'text-blue-400 hover:text-blue-600'
        }`}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
