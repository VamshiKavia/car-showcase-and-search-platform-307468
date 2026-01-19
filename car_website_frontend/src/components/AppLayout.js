import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * AppLayout provides the primary application shell:
 * - Sticky top navbar (brand + search entry point)
 * - Sidebar placeholder for filters
 * - Main content area for routed pages
 *
 * It is intentionally presentational only (no API calls).
 */
export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") ?? "";

  // PUBLIC_INTERFACE
  function onSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();

    // For now we keep search state in the URL on the home route.
    // This creates a clear entry point for future search behavior without API calls yet.
    navigate("/");
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="app">
      <header className="app-navbar" role="banner">
        <div className="ds-container app-navbar-inner">
          <Link to="/" className="brand" aria-label="Car Showcase home">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              Car Showcase
              <span className="brand-subtitle">Minimalist explorer</span>
            </span>
          </Link>

          <form className="nav-search" role="search" onSubmit={onSearchSubmit}>
            <label className="ds-sr-only" htmlFor="global-search">
              Search cars
            </label>
            <input
              id="global-search"
              className="ds-input"
              type="search"
              value={query}
              placeholder="Search cars (model, brand, feature)…"
              onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
              autoComplete="off"
            />
            <button className="ds-btn ds-btn-primary" type="submit">
              Search
            </button>
          </form>

          <div className="nav-actions" aria-label="Primary actions">
            <Link className="ds-btn ds-btn-ghost" to="/" aria-label="Go to home">
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="ds-container">
        <div className="app-shell">
          <aside className="sidebar" aria-label="Filters">
            <div className="ds-card">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Filters</h2>
                <span className="ds-chip" aria-label="Filters placeholder">
                  Placeholder
                </span>
              </div>
              <p className="ds-body ds-muted" style={{ marginTop: 12 }}>
                Filter controls (price, body type, brand, etc.) will live here.
              </p>
            </div>
          </aside>

          <main className="main" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
