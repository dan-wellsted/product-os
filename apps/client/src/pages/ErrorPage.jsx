import React from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="stack">
      <h1>Something went wrong</h1>
      <pre>{error?.statusText || error?.message || "Unknown error"}</pre>
    </div>
  );
}
