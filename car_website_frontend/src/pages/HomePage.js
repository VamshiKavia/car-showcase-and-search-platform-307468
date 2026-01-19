import React from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * HomePage is the landing page: car grid placeholder and quick navigation.
 * No API calls yet; uses lightweight placeholders.
 */
export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <>
      <header className="main-header">
        <h1 className="ds-h1">Browse cars</h1>
        <p className="ds-body ds-muted">
          Explore models and details. Search and filters are wired for structure only.
          {query ? (
            <>
              {" "}
              Current query: <span className="ds-chip">{query}</span>
            </>
          ) : null}
        </p>

        <div className="main-actions" aria-label="Quick links">
          <Link className="ds-btn" to="/cars/1">
            Example detail: Car #1
          </Link>
          <Link className="ds-btn" to="/cars/2">
            Example detail: Car #2
          </Link>
        </div>
      </header>

      <section aria-label="Car results">
        <div className="placeholder-grid">
          {Array.from({ length: 6 }).map((_, idx) => {
            const id = idx + 1;
            return (
              <article key={id} className="ds-card" aria-label={`Car placeholder ${id}`}>
                <h3 className="placeholder-card-title">Car #{id}</h3>
                <p className="placeholder-card-body">
                  Minimal placeholder card. Replace with real car data and images later.
                </p>
                <div style={{ marginTop: 12 }}>
                  <Link className="ds-btn ds-btn-primary" to={`/cars/${id}`} aria-label={`View details for car ${id}`}>
                    View details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
