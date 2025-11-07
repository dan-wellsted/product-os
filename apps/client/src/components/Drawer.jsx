import React, { useEffect } from "react";

export default function Drawer({ open, title, onClose, children, footer, position = "right" }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    if (open) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true">
      <div className={`drawer-panel drawer-${position}`}>
        <header className="drawer-header">
          <h2>{title}</h2>
          <button type="button" className="toast-dismiss" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
