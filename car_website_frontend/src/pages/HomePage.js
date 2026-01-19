import React, { useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * HomePage is the landing page for browsing cars.
 * This implementation is UI-only scaffolding (no API calls yet):
 * - Search input
 * - Filter sidebar (Make/Model/Year min/max/Price min/max + Clear)
 * - Responsive grid with placeholder cards
 * - Loading / empty / error state blocks (to be wired to data later)
 */
export default function HomePage() {
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";

  // Local UI-only state (will later map to URL params and/or API calls).
  const [searchText, setSearchText] = useState(queryFromUrl);
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
  });

  // State scaffolds (these will later be controlled by data fetching).
  const [uiState, setUiState] = useState("ready"); // "ready" | "loading" | "empty" | "error"

  const ids = {
    search: useId(),
    make: useId(),
    model: useId(),
    yearMin: useId(),
    yearMax: useId(),
    priceMin: useId(),
    priceMax: useId(),
    resultsHeading: useId(),
  };

  const placeholderCars = useMemo(() => {
    const makes = ["Astra", "Nord", "Crest", "Vale", "Orion", "Drift", "Cobalt", "Reef", "Arc"];
    const models = ["S", "Sport", "Touring", "SE", "LX", "Premium", "GT", "Limited", "Eco"];
    const badges = ["Hybrid", "AWD", "Low miles", "1-owner", "Certified", "New arrival", "Great value"];

    return Array.from({ length: 9 }).map((_, idx) => {
      const id = idx + 1;
      const make = makes[idx % makes.length];
      const model = models[(idx + 2) % models.length];
      const year = 2016 + (idx % 9);
      const price = 18950 + idx * 1750;
      const pickedBadges = [badges[idx % badges.length], badges[(idx + 3) % badges.length]];

      return { id, make, model, year, price, badges: pickedBadges };
    });
  }, []);

  const visibleItems = uiState === "ready" ? placeholderCars : [];

  // PUBLIC_INTERFACE
  function onClearFilters() {
    /** Clears all filter inputs (UI-only scaffolding). */
    setFilters({
      make: "",
      model: "",
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
    });
  }

  // PUBLIC_INTERFACE
  function onSubmitSearch(e) {
    /** UI-only submit handler: prevents navigation; API wiring comes later. */
    e.preventDefault();
  }

  const resultsCountText = (() => {
    if (uiState === "loading") return "Loading cars…";
    if (uiState === "error") return "Unable to load results.";
    if (uiState === "empty") return "No cars match your criteria.";
    return `${visibleItems.length} cars`;
  })();

  return (
    <div className="home-layout">
      {/* Sidebar (in-page; AppLayout's sidebar remains a placeholder for now) */}
      <aside className="home-filters" aria-label="Search and filters">
        <div className="ds-card">
          <div className="home-filters-header">
            <h2 className="ds-h2" style={{ margin: 0 }}>
              Filters
            </h2>

            <button className="ds-btn" type="button" onClick={onClearFilters} aria-label="Clear all filters">
              Clear
            </button>
          </div>

          <form className="home-filter-form" onSubmit={onSubmitSearch}>
            <div className="home-filter-block" role="search" aria-label="Search cars">
              <label className="ds-label" htmlFor={ids.search}>
                Search
              </label>
              <input
                id={ids.search}
                className="ds-input"
                type="search"
                value={searchText}
                placeholder="Search make, model, features…"
                onChange={(e) => setSearchText(e.target.value)}
                autoComplete="off"
              />
              <p className="ds-body ds-muted" style={{ margin: "8px 0 0 0", fontSize: 13 }}>
                Tip: URL search remains in the top bar. This input is UI-only for now.
              </p>
            </div>

            <div className="home-filter-grid" aria-label="Filter fields">
              <div className="home-field">
                <label className="ds-label" htmlFor={ids.make}>
                  Make
                </label>
                <input
                  id={ids.make}
                  className="ds-input"
                  type="text"
                  value={filters.make}
                  placeholder="e.g., Toyota"
                  onChange={(e) => setFilters((p) => ({ ...p, make: e.target.value }))}
                />
              </div>

              <div className="home-field">
                <label className="ds-label" htmlFor={ids.model}>
                  Model
                </label>
                <input
                  id={ids.model}
                  className="ds-input"
                  type="text"
                  value={filters.model}
                  placeholder="e.g., Camry"
                  onChange={(e) => setFilters((p) => ({ ...p, model: e.target.value }))}
                />
              </div>

              <fieldset className="home-fieldset" aria-label="Year range">
                <legend className="ds-label">Year</legend>
                <div className="home-range">
                  <div>
                    <label className="ds-sr-only" htmlFor={ids.yearMin}>
                      Minimum year
                    </label>
                    <input
                      id={ids.yearMin}
                      className="ds-input"
                      inputMode="numeric"
                      type="number"
                      min="1900"
                      max="2100"
                      value={filters.yearMin}
                      placeholder="Min"
                      onChange={(e) => setFilters((p) => ({ ...p, yearMin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="ds-sr-only" htmlFor={ids.yearMax}>
                      Maximum year
                    </label>
                    <input
                      id={ids.yearMax}
                      className="ds-input"
                      inputMode="numeric"
                      type="number"
                      min="1900"
                      max="2100"
                      value={filters.yearMax}
                      placeholder="Max"
                      onChange={(e) => setFilters((p) => ({ ...p, yearMax: e.target.value }))}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="home-fieldset" aria-label="Price range">
                <legend className="ds-label">Price</legend>
                <div className="home-range">
                  <div>
                    <label className="ds-sr-only" htmlFor={ids.priceMin}>
                      Minimum price
                    </label>
                    <input
                      id={ids.priceMin}
                      className="ds-input"
                      inputMode="numeric"
                      type="number"
                      min="0"
                      value={filters.priceMin}
                      placeholder="Min"
                      onChange={(e) => setFilters((p) => ({ ...p, priceMin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="ds-sr-only" htmlFor={ids.priceMax}>
                      Maximum price
                    </label>
                    <input
                      id={ids.priceMax}
                      className="ds-input"
                      inputMode="numeric"
                      type="number"
                      min="0"
                      value={filters.priceMax}
                      placeholder="Max"
                      onChange={(e) => setFilters((p) => ({ ...p, priceMax: e.target.value }))}
                    />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="home-filter-actions" aria-label="Filter actions">
              <button className="ds-btn ds-btn-primary" type="submit">
                Apply (UI only)
              </button>

              {/* Scaffolding toggles to visually verify state blocks without real data */}
              <div className="home-state-toggles" aria-label="State scaffolding controls">
                <button className="ds-btn ds-btn-ghost" type="button" onClick={() => setUiState("ready")}>
                  Ready
                </button>
                <button className="ds-btn ds-btn-ghost" type="button" onClick={() => setUiState("loading")}>
                  Loading
                </button>
                <button className="ds-btn ds-btn-ghost" type="button" onClick={() => setUiState("empty")}>
                  Empty
                </button>
                <button className="ds-btn ds-btn-ghost" type="button" onClick={() => setUiState("error")}>
                  Error
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>

      <section className="home-results" aria-label="Car results">
        <header className="main-header" style={{ marginBottom: 16 }}>
          <h1 className="ds-h1" id={ids.resultsHeading}>
            Browse cars
          </h1>
          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            Explore models and details. UI scaffolding only — no API calls yet.
            {queryFromUrl ? (
              <>
                {" "}
                Current URL query: <span className="ds-chip">{queryFromUrl}</span>
              </>
            ) : null}
          </p>

          <div className="home-results-meta" aria-live="polite">
            <span className="ds-chip">{resultsCountText}</span>
          </div>
        </header>

        {uiState === "loading" ? (
          <LoadingState />
        ) : uiState === "error" ? (
          <ErrorState />
        ) : uiState === "empty" ? (
          <EmptyState />
        ) : (
          <div className="car-grid" role="list" aria-labelledby={ids.resultsHeading}>
            {visibleItems.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatPriceUSD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function CarCard({ car }) {
  return (
    <article className="car-card ds-card" role="listitem" aria-label={`${car.make} ${car.model} ${car.year}`}>
      <div className="car-card-media" aria-hidden="true">
        <div className="car-image-placeholder">
          <span className="car-image-placeholder-text">Image</span>
        </div>
      </div>

      <div className="car-card-body">
        <h3 className="car-card-title">
          <span className="car-title-main">
            {car.make} {car.model}
          </span>
          <span className="car-title-year">{car.year}</span>
        </h3>

        <p className="car-card-price">{formatPriceUSD(car.price)}</p>

        <div className="car-card-badges" aria-label="Key highlights">
          {car.badges.map((b) => (
            <span className="ds-chip" key={b}>
              {b}
            </span>
          ))}
        </div>

        <div className="car-card-actions" aria-label="Card actions">
          <Link className="ds-btn ds-btn-primary" to={`/cars/${car.id}`} aria-label={`View details for ${car.make} ${car.model}`}>
            View details
          </Link>
          <button className="ds-btn" type="button" aria-label={`Save ${car.make} ${car.model} (placeholder)`} disabled>
            Save
          </button>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="ds-card" aria-label="Loading cars">
      <h2 className="ds-h2">Loading</h2>
      <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
        Fetching results… (placeholder)
      </p>
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ds-card" aria-label="No cars found">
      <h2 className="ds-h2">No results</h2>
      <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
        Try adjusting Make/Model, expanding year range, or widening price range.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="ds-card" aria-label="Error loading cars">
      <h2 className="ds-h2" style={{ color: "var(--color-error)" }}>
        Something went wrong
      </h2>
      <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
        We couldn’t load results. This is a placeholder error state until APIs are wired.
      </p>
      <div style={{ marginTop: 12 }}>
        <button className="ds-btn ds-btn-primary" type="button">
          Retry (placeholder)
        </button>
      </div>
    </div>
  );
}

