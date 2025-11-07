import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    const payload = {
      id,
      status: "info",
      duration: 6000,
      ...toast,
    };
    setToasts((current) => [...current, payload]);

    if (payload.duration !== null) {
      window.setTimeout(() => {
        removeToast(id);
      }, payload.duration);
    }

    return () => removeToast(id);
  }, [removeToast]);

  const contextValue = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.status}`}>
            <div className="toast-content">
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            {toast.actions?.length ? (
              <div className="toast-actions">
                {toast.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      action.onClick?.();
                      if (action.dismiss !== false) {
                        removeToast(toast.id);
                      }
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
            <button type="button" className="toast-dismiss" aria-label="Dismiss" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
