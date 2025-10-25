import React from "react";
export default function Card({ title, description, children, actions }) {
  return (
    <section className="card">
      {title ? <h2>{title}</h2> : null}
      {description ? <p className="muted">{description}</p> : null}
      <div className="card-body">{children}</div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </section>
  );
}
