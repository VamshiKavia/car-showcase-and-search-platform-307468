import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGetJson } from "../api/client";

/**
 * PUBLIC_INTERFACE
 * HomePage is the landing page for browsing cars.
 * - Fetches from backend GET /api/cars
 * - Syncs search/filter/sort/pagination with URL query params
 * - Renders live car data with robust loading/error/empty states
 */
export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mobile UX: allow collapsing the in-page filters.
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ids = {
    search: useId(),
    make: useId(),
    model: useId(),
    yearMin: useId(),
    yearMax: useId(),
    priceMin: useId(),
    priceMax: useId(),
    sort: useId(),
    pageSize: useId(),
    resultsHeading: useId(),
    filtersRegion: useId(),
    activeSummary: useId(),
  };

  // ---------- URL <-> UI state helpers ----------
  const urlState = useMemo(() => {
    const get = (k) => searchParams.get(k) ?? "";

    // Backend uses snake_case.
    const q = get("q");
    const make = get("make");
    const model = get("model");
    const yearMin = get("year_min");
    const yearMax = get("year_max");
    const priceMin = get("price_min");
    const priceMax = get("price_max");
    const sort = get("sort") || "-year";

    const page = clampInt(get("page"), 1, 999999, 1);
    const pageSize = clampInt(get("page_size"), 1, 50, 12);

    return {
      q,
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      sort,
      page,
      pageSize,
    };
  }, [searchParams]);

  const [formState, setFormState] = useState(() => ({
    q: urlState.q,
    make: urlState.make,
    model: urlState.model,
    yearMin: urlState.yearMin,
    yearMax: urlState.yearMax,
    priceMin: urlState.priceMin,
    priceMax: urlState.priceMax,
    sort: urlState.sort,
    pageSize: String(urlState.pageSize),
  }));

  // Keep form inputs in sync when URL changes (e.g., back/forward, top nav search).
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      q: urlState.q,
      make: urlState.make,
      model: urlState.model,
      yearMin: urlState.yearMin,
      yearMax: urlState.yearMax,
      priceMin: urlState.priceMin,
      priceMax: urlState.priceMax,
      sort: urlState.sort,
      pageSize: String(urlState.pageSize),
    }));
    // If make was cleared via URL, ensure model doesn't stay “stuck”.
    if (!urlState.make) {
      setFormState((prev) => ({ ...prev, model: "" }));
    }
  }, [
    urlState.q,
    urlState.make,
    urlState.model,
    urlState.yearMin,
    urlState.yearMax,
    urlState.priceMin,
    urlState.priceMax,
    urlState.sort,
    urlState.pageSize,
  ]);

  const activeFilterCount = useMemo(() => {
    const values = [
      urlState.q,
      urlState.make,
      urlState.model,
      urlState.yearMin,
      urlState.yearMax,
      urlState.priceMin,
      urlState.priceMax,
    ]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return values.length;
  }, [urlState]);

  const activeSummaryText = useMemo(() => {
    const parts = [];
    if (urlState.q.trim()) parts.push(`Search: "${urlState.q.trim()}"`);
    if (urlState.make) parts.push(`Make: ${urlState.make}`);
    if (urlState.model) parts.push(`Model: ${urlState.model}`);
    if (urlState.yearMin || urlState.yearMax) parts.push(`Year: ${urlState.yearMin || "—"}–${urlState.yearMax || "—"}`);
    if (urlState.priceMin || urlState.priceMax) {
      parts.push(
        `Price: ${urlState.priceMin ? formatPriceUSD(urlState.priceMin) : "—"}–${
          urlState.priceMax ? formatPriceUSD(urlState.priceMax) : "—"
        }`
      );
    }
    if (!parts.length) return "No filters applied.";
    return parts.join(" • ");
  }, [urlState]);

  // ---------- Data fetching ----------
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: urlState.page, pageSize: urlState.pageSize });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let isMounted = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const data = await apiGetJson("/api/cars", {
          query: {
            q: urlState.q || undefined,
            make: urlState.make || undefined,
            model: urlState.model || undefined,
            year_min: normalizeNumberish(urlState.yearMin),
            year_max: normalizeNumberish(urlState.yearMax),
            price_min: normalizeNumberish(urlState.priceMin),
            price_max: normalizeNumberish(urlState.priceMax),
            sort: urlState.sort || "-year",
            page: urlState.page,
            page_size: urlState.pageSize,
          },
          signal: controller.signal,
        });

        if (!isMounted) return;

        const items = Array.isArray(data?.items) ? data.items : [];
        setCars(items);
        setMeta({
          total: Number(data?.total ?? items.length ?? 0),
          page: Number(data?.page ?? urlState.page),
          pageSize: Number(data?.page_size ?? urlState.pageSize),
        });
      } catch (e) {
        if (!isMounted) return;
        if (e?.name === "AbortError") return;
        setCars([]);
        setMeta({ total: 0, page: urlState.page, pageSize: urlState.pageSize });
        setError(e?.message || "Unable to load cars.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [urlState]);

  const empty = !loading && !error && cars.length === 0;

  const totalPages = useMemo(() => {
    const total = Number(meta.total || 0);
    const ps = Number(meta.pageSize || urlState.pageSize);
    return Math.max(1, Math.ceil(total / Math.max(1, ps)));
  }, [meta.total, meta.pageSize, urlState.pageSize]);

  const resultsCountText = useMemo(() => {
    if (loading) return "Loading cars…";
    if (error) return "Unable to load results.";
    if (empty) return "No cars match your criteria.";
    return `${meta.total.toLocaleString()} cars`;
  }, [loading, error, empty, meta.total]);

  // ---------- URL mutation helpers ----------
  // PUBLIC_INTERFACE
  function setUrlParams(next, { replace = false } = {}) {
    /** Update URL search params (omits empty values). */
    const sp = new URLSearchParams();

    // Preserve only known keys in a predictable order.
    const entries = [
      ["q", next.q],
      ["make", next.make],
      ["model", next.model],
      ["year_min", next.yearMin],
      ["year_max", next.yearMax],
      ["price_min", next.priceMin],
      ["price_max", next.priceMax],
      ["sort", next.sort],
      ["page", String(next.page ?? 1)],
      ["page_size", String(next.pageSize ?? 12)],
    ];

    for (const [k, v] of entries) {
      if (v === null || v === undefined) continue;
      const s = String(v).trim();
      if (!s) continue;

      // Avoid redundant default values (keeps URLs clean).
      if (k === "sort" && s === "-year") continue;
      if (k === "page" && s === "1") continue;
      if (k === "page_size" && s === "12") continue;

      sp.set(k, s);
    }

    setSearchParams(sp, { replace });
  }

  // PUBLIC_INTERFACE
  function onApplyFilters(e) {
    /** Apply the current in-form inputs to the URL and reset to page 1. */
    e.preventDefault();

    const nextMake = formState.make;
    const nextModel = nextMake ? formState.model : "";

    setUrlParams({
      q: formState.q,
      make: nextMake,
      model: nextModel,
      yearMin: formState.yearMin,
      yearMax: formState.yearMax,
      priceMin: formState.priceMin,
      priceMax: formState.priceMax,
      sort: formState.sort || "-year",
      page: 1,
      pageSize: clampInt(formState.pageSize, 1, 50, 12),
    });
  }

  // PUBLIC_INTERFACE
  function onClearFilters() {
    /** Clears all filter inputs and URL params (keeps defaults). */
    setFormState({
      q: "",
      make: "",
      model: "",
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
      sort: "-year",
      pageSize: "12",
    });
    setUrlParams({
      q: "",
      make: "",
      model: "",
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
      sort: "-year",
      page: 1,
      pageSize: 12,
    });
  }

  // PUBLIC_INTERFACE
  function onRetry() {
    /** Retries by re-setting params to themselves (forces effect in edge cases). */
    setUrlParams(
      {
        q: urlState.q,
        make: urlState.make,
        model: urlState.model,
        yearMin: urlState.yearMin,
        yearMax: urlState.yearMax,
        priceMin: urlState.priceMin,
        priceMax: urlState.priceMax,
        sort: urlState.sort || "-year",
        page: urlState.page,
        pageSize: urlState.pageSize,
      },
      { replace: true }
    );
  }

  // PUBLIC_INTERFACE
  function goToPage(nextPage) {
    /** Navigate to a specific 1-based page via URL params. */
    const p = clampInt(nextPage, 1, totalPages, 1);
    setUrlParams({
      ...urlState,
      page: p,
      pageSize: urlState.pageSize,
    });
  }

  // PUBLIC_INTERFACE
  function onPageSizeChange(nextPageSizeRaw) {
    /** Update page size (URL) and reset to page 1. */
    const ps = clampInt(nextPageSizeRaw, 1, 50, 12);
    setUrlParams({
      ...urlState,
      page: 1,
      pageSize: ps,
    });
  }

  return (
    <div className="home-layout">
      {/* Sidebar (in-page; AppLayout's sidebar remains a placeholder for now) */}
      <aside className="home-filters" aria-label="Search and filters">
        <div className="ds-card">
          <div className="home-filters-header">
            <h2 className="ds-h2" style={{ margin: 0 }}>
              Filters
            </h2>

            <div className="home-filter-header-actions">
              <span className="ds-chip" aria-label={`Active filters: ${activeFilterCount}`}>
                {activeFilterCount} active
              </span>

              <button
                className="ds-btn home-filters-toggle"
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-controls={ids.filtersRegion}
                aria-expanded={filtersOpen}
              >
                {filtersOpen ? "Hide" : "Show"}
              </button>

              <button className="ds-btn" type="button" onClick={onClearFilters} aria-label="Clear all filters">
                Clear
              </button>
            </div>
          </div>

          <p className="ds-body ds-muted home-filters-subtitle" id={ids.activeSummary}>
            {activeSummaryText}
          </p>

          <div
            id={ids.filtersRegion}
            className={`home-filter-collapsible ${filtersOpen ? "is-open" : ""}`}
            aria-labelledby={ids.activeSummary}
          >
            <form className="home-filter-form" onSubmit={onApplyFilters}>
              <div className="home-filter-block" role="search" aria-label="Search cars">
                <label className="ds-label" htmlFor={ids.search}>
                  Search
                </label>
                <input
                  id={ids.search}
                  className="ds-input"
                  type="search"
                  value={formState.q}
                  placeholder="Search make, model, features…"
                  onChange={(e) => setFormState((p) => ({ ...p, q: e.target.value }))}
                  autoComplete="off"
                />
                <p className="ds-body ds-muted" style={{ margin: "8px 0 0 0", fontSize: 13 }}>
                  Syncs with the top-bar search and URL query (<span className="ds-chip">q</span>).
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
                    value={formState.make}
                    onChange={(e) => {
                      const nextMake = e.target.value;
                      setFormState((p) => ({
                        ...p,
                        make: nextMake,
                        model: nextMake ? p.model : "",
                      }));
                    }}
                    placeholder="Any make"
                    autoComplete="off"
                  />
                  <p className="ds-body ds-muted home-field-hint">
                    Tip: Exact match filter on backend (case-insensitive).
                  </p>
                </div>

                <div className="home-field">
                  <label className="ds-label" htmlFor={ids.model}>
                    Model
                  </label>
                  <input
                    id={ids.model}
                    className="ds-input"
                    value={formState.model}
                    onChange={(e) => setFormState((p) => ({ ...p, model: e.target.value }))}
                    disabled={!formState.make}
                    aria-describedby={!formState.make ? `${ids.model}-hint` : undefined}
                    placeholder={formState.make ? "Any model" : "Enter a make first"}
                    autoComplete="off"
                  />
                  {!formState.make ? (
                    <p className="ds-body ds-muted home-field-hint" id={`${ids.model}-hint`}>
                      Choose a make to enable the model filter.
                    </p>
                  ) : (
                    <p className="ds-body ds-muted home-field-hint">Tip: Exact match filter on backend (case-insensitive).</p>
                  )}
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
                        min="1886"
                        max="2100"
                        value={formState.yearMin}
                        placeholder="Min"
                        onChange={(e) => setFormState((p) => ({ ...p, yearMin: e.target.value }))}
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
                        min="1886"
                        max="2100"
                        value={formState.yearMax}
                        placeholder="Max"
                        onChange={(e) => setFormState((p) => ({ ...p, yearMax: e.target.value }))}
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
                        value={formState.priceMin}
                        placeholder="Min"
                        onChange={(e) => setFormState((p) => ({ ...p, priceMin: e.target.value }))}
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
                        value={formState.priceMax}
                        placeholder="Max"
                        onChange={(e) => setFormState((p) => ({ ...p, priceMax: e.target.value }))}
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="home-field">
                  <label className="ds-label" htmlFor={ids.sort}>
                    Sort
                  </label>
                  <select
                    id={ids.sort}
                    className="ds-input ds-select"
                    value={formState.sort || "-year"}
                    onChange={(e) => setFormState((p) => ({ ...p, sort: e.target.value }))}
                  >
                    <option value="-year">Newest year</option>
                    <option value="year">Oldest year</option>
                    <option value="-price">Highest price</option>
                    <option value="price">Lowest price</option>
                    <option value="-mileage">Highest mileage</option>
                    <option value="mileage">Lowest mileage</option>
                    <option value="make">Make (A–Z)</option>
                    <option value="-make">Make (Z–A)</option>
                    <option value="model">Model (A–Z)</option>
                    <option value="-model">Model (Z–A)</option>
                  </select>
                </div>

                <div className="home-field">
                  <label className="ds-label" htmlFor={ids.pageSize}>
                    Page size
                  </label>
                  <select
                    id={ids.pageSize}
                    className="ds-input ds-select"
                    value={formState.pageSize}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFormState((p) => ({ ...p, pageSize: next }));
                      // Update URL immediately for predictable paging behavior.
                      onPageSizeChange(next);
                    }}
                  >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="18">18</option>
                    <option value="24">24</option>
                    <option value="36">36</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>

              <div className="home-filter-actions" aria-label="Filter actions">
                <button className="ds-btn ds-btn-primary" type="submit" disabled={loading}>
                  Apply
                </button>

                <p className="ds-body ds-muted" style={{ margin: 0, fontSize: 13 }}>
                  Filters update the URL and trigger a refresh automatically.
                </p>
              </div>
            </form>
          </div>
        </div>
      </aside>

      <section className="home-results" aria-label="Car results">
        <header className="main-header" style={{ marginBottom: 16 }}>
          <h1 className="ds-h1" id={ids.resultsHeading}>
            Browse cars
          </h1>

          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            Live results from the backend API.
          </p>

          <div className="home-results-meta" aria-live="polite">
            <span className="ds-chip">{resultsCountText}</span>
            <span className="ds-chip">
              Page {urlState.page} / {totalPages}
            </span>
          </div>

          <div className="main-actions" aria-label="Pagination controls">
            <button className="ds-btn" type="button" onClick={() => goToPage(urlState.page - 1)} disabled={loading || urlState.page <= 1}>
              Previous
            </button>
            <button
              className="ds-btn"
              type="button"
              onClick={() => goToPage(urlState.page + 1)}
              disabled={loading || urlState.page >= totalPages}
            >
              Next
            </button>
          </div>
        </header>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState errorMessage={error} onRetry={onRetry} />
        ) : empty ? (
          <EmptyState />
        ) : (
          <div className="car-grid" role="list" aria-labelledby={ids.resultsHeading}>
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeNumberish(v) {
  const s = String(v ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function formatPriceUSD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function pickPrimaryImage(car) {
  const imgs = car?.images;
  if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === "string" && imgs[0].trim()) {
    return imgs[0].trim();
  }
  return "";
}

function carTitle(car) {
  const make = car?.make || "";
  const model = car?.model || "";
  return `${make} ${model}`.trim() || "Car";
}

function CarCard({ car }) {
  const title = carTitle(car);
  const img = pickPrimaryImage(car);
  const year = car?.year;
  const mileage = car?.mileage;

  return (
    <article className="car-card ds-card" role="listitem" aria-label={`${title}${year ? ` ${year}` : ""}`}>
      <div className="car-card-media">
        {img ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={img}
            alt={`${title} photo`}
            style={{
              width: "100%",
              aspectRatio: "16 / 10",
              objectFit: "cover",
              borderRadius: 14,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              display: "block",
            }}
            loading="lazy"
          />
        ) : (
          <div className="car-image-placeholder" aria-label="No image available">
            <span className="car-image-placeholder-text">No image</span>
          </div>
        )}
      </div>

      <div className="car-card-body">
        <h3 className="car-card-title">
          <span className="car-title-main">{title}</span>
          {Number.isFinite(Number(year)) ? <span className="car-title-year">{year}</span> : null}
        </h3>

        <p className="car-card-price">{formatPriceUSD(car?.price)}</p>

        <div className="car-card-badges" aria-label="Key attributes">
          {car?.fuel ? <span className="ds-chip">{car.fuel}</span> : null}
          {car?.transmission ? <span className="ds-chip">{car.transmission}</span> : null}
          {Number.isFinite(Number(mileage)) ? <span className="ds-chip">{Number(mileage).toLocaleString()} mi</span> : null}
        </div>

        <div className="car-card-actions" aria-label="Card actions">
          <Link className="ds-btn ds-btn-primary" to={`/cars/${car.id}`} aria-label={`View details for ${title}`}>
            View details
          </Link>

          <button
            className="ds-btn"
            type="button"
            aria-label={`Save ${title} (placeholder)`}
            disabled
            title="Save will be available when accounts are implemented"
          >
            Save
          </button>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="ds-card" aria-label="Loading cars" aria-busy="true">
      <h2 className="ds-h2">Loading</h2>
      <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
        Fetching results…
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

function ErrorState({ errorMessage, onRetry }) {
  return (
    <div className="ds-card" aria-label="Error loading cars">
      <h2 className="ds-h2" style={{ color: "var(--color-error)" }}>
        Something went wrong
      </h2>
      <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
        {errorMessage || "We couldn’t load results."}
      </p>
      <div style={{ marginTop: 12 }}>
        <button className="ds-btn ds-btn-primary" type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    </div>
  );
}
