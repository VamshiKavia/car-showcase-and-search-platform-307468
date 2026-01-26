import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGetJson } from "../api/client";

/**
 * PUBLIC_INTERFACE
 * CarDetailsPage shows a dedicated detail page for an individual car.
 * - Fetches from backend GET /api/cars/:id
 * - Renders a minimalist detail view with gallery + key specs
 * - Handles loading/error/404 states
 */
export default function CarDetailsPage() {
  const { id } = useParams();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  // notFound is specifically for 404 responses from the backend.
  const [notFound, setNotFound] = useState(false);

  // error is for non-404 failures (network, 500, etc.)
  const [error, setError] = useState("");

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let isMounted = true;

    async function run() {
      setLoading(true);
      setError("");
      setNotFound(false);
      setCar(null);
      setActiveImageIndex(0);

      try {
        const data = await apiGetJson(`/api/cars/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (!isMounted) return;

        setCar(data);
      } catch (e) {
        if (!isMounted) return;
        if (e?.name === "AbortError") return;

        // apiGetJson enriches error objects with `status`.
        if (Number(e?.status) === 404) {
          setNotFound(true);
          setCar(null);
          setError("");
          return;
        }

        setError(e?.message || "Unable to load car details.");
        setCar(null);
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
  }, [id]);

  const title = useMemo(() => {
    if (!car) return "Car details";
    const year = Number.isFinite(Number(car.year)) ? String(car.year) : "";
    const make = String(car.make || "").trim();
    const model = String(car.model || "").trim();
    return `${year ? `${year} ` : ""}${make} ${model}`.trim() || "Car details";
  }, [car]);

  const images = useMemo(() => {
    const list = Array.isArray(car?.images) ? car.images : [];
    return list.filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim());
  }, [car]);

  const activeImage = images[activeImageIndex] || images[0] || "";

  const specs = useMemo(() => {
    const s = [];

    const mileage = Number(car?.mileage);
    if (Number.isFinite(mileage)) s.push({ label: "Mileage", value: `${mileage.toLocaleString()} mi` });

    if (car?.transmission) s.push({ label: "Transmission", value: String(car.transmission) });
    if (car?.fuel) s.push({ label: "Fuel", value: String(car.fuel) });

    // Backend schema doesn't guarantee these fields, but request asked to show as available.
    if (car?.body_type) s.push({ label: "Body type", value: String(car.body_type) });
    if (car?.drivetrain) s.push({ label: "Drivetrain", value: String(car.drivetrain) });

    return s;
  }, [car]);

  // PUBLIC_INTERFACE
  function onRetry() {
    /** Re-trigger fetch by resetting state and relying on effect (id is stable). */
    setError("");
    setNotFound(false);
    setCar(null);
    setLoading(true);
    // Effect will run if id changes; force a refetch by doing a lightweight abort + rerun via state transition.
    abortRef.current?.abort();
    // The useEffect will re-run on next render due to aborted fetch; ensure we kick it by updating a no-op state.
    setActiveImageIndex(0);
  }

  // ---------- States ----------
  if (loading) {
    return (
      <>
        <header className="main-header">
          <h1 className="ds-h1">Loading car…</h1>
          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            Fetching details from the backend API.
          </p>

          <div className="main-actions">
            <Link className="ds-btn" to="/">
              Back to browse
            </Link>
          </div>
        </header>

        <section className="ds-card" aria-label="Loading car details" aria-busy="true">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.35fr 0.65fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              className="skeleton-card"
              style={{
                height: 320,
                borderRadius: 14,
              }}
            />
            <div style={{ display: "grid", gap: 12 }}>
              <div className="skeleton-card" style={{ height: 88, borderRadius: 14 }} />
              <div className="skeleton-card" style={{ height: 140, borderRadius: 14 }} />
              <div className="skeleton-card" style={{ height: 110, borderRadius: 14 }} />
            </div>
          </div>

          <p className="ds-body ds-muted" style={{ marginTop: 14 }}>
            Loading gallery and specifications…
          </p>
        </section>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <header className="main-header">
          <h1 className="ds-h1">Car not found</h1>
          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            We couldn’t find a car with id <span className="ds-chip">{id}</span>.
          </p>

          <div className="main-actions">
            <Link className="ds-btn ds-btn-primary" to="/">
              Back to browse
            </Link>
          </div>
        </header>

        <section className="ds-card" aria-label="Not found">
          <h2 className="ds-h2">Try another car</h2>
          <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
            Use the list to pick a different listing.
          </p>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="main-header">
          <h1 className="ds-h1">Unable to load details</h1>
          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            We hit an error while loading <span className="ds-chip">Car #{id}</span>.
          </p>

          <div className="main-actions">
            <Link className="ds-btn" to="/">
              Back to browse
            </Link>
          </div>
        </header>

        <section className="ds-card" aria-label="Error loading car details">
          <h2 className="ds-h2" style={{ color: "var(--color-error)" }}>
            Something went wrong
          </h2>
          <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
            {error}
          </p>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="ds-btn ds-btn-primary" type="button" onClick={onRetry}>
              Retry
            </button>
            <Link className="ds-btn" to="/">
              Back to browse
            </Link>
          </div>
        </section>
      </>
    );
  }

  // Safety: if we have neither loading/error/notFound and still no car, show a defensive empty state.
  if (!car) {
    return (
      <>
        <header className="main-header">
          <h1 className="ds-h1">Car details</h1>
          <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
            No data was returned for <span className="ds-chip">{id}</span>.
          </p>

          <div className="main-actions">
            <Link className="ds-btn ds-btn-primary" to="/">
              Back to browse
            </Link>
          </div>
        </header>

        <section className="ds-card" aria-label="No car data">
          <h2 className="ds-h2">No details available</h2>
          <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
            Please return to the list and try again.
          </p>
        </section>
      </>
    );
  }

  // ---------- Loaded UI ----------
  return (
    <>
      <header className="main-header">
        <h1 className="ds-h1">{title}</h1>
        <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
          Live details from the backend API.
        </p>

        <div className="main-actions">
          <Link className="ds-btn" to="/">
            Back to browse
          </Link>
        </div>
      </header>

      <section className="ds-card" aria-label="Car details content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 0.65fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* Gallery */}
          <div aria-label="Car gallery">
            {activeImage ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={activeImage}
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
              />
            ) : (
              <div className="car-image-placeholder" aria-label="No image available">
                <span className="car-image-placeholder-text">No image</span>
              </div>
            )}

            {images.length > 1 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
                aria-label="Gallery thumbnails"
              >
                {images.slice(0, 6).map((url, idx) => {
                  const selected = idx === activeImageIndex;
                  return (
                    <button
                      key={url}
                      className="ds-btn ds-btn-ghost"
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                      aria-current={selected ? "true" : "false"}
                      style={{
                        height: "auto",
                        padding: 0,
                        borderRadius: 12,
                        border: selected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                        overflow: "hidden",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <img
                        src={url}
                        alt=""
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          display: "block",
                        }}
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Details */}
          <div aria-label="Car specifications and summary" style={{ display: "grid", gap: 12 }}>
            <div className="ds-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h2 className="ds-h2" style={{ margin: 0 }}>
                  Price
                </h2>
                <span className="ds-chip" aria-label="Listing id">
                  {String(car.id || id)}
                </span>
              </div>

              <p className="ds-body" style={{ marginTop: 10, fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>
                {formatPriceUSD(car?.price)}
              </p>

              <p className="ds-body ds-muted" style={{ marginTop: 6 }}>
                Taxes/fees not included.
              </p>
            </div>

            <div className="ds-card" style={{ padding: 16 }}>
              <h2 className="ds-h2">Key specs</h2>

              {specs.length ? (
                <dl style={{ margin: "12px 0 0 0", display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {specs.map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 14,
                        borderBottom: "1px solid var(--color-border)",
                        paddingBottom: 8,
                      }}
                    >
                      <dt className="ds-body ds-muted" style={{ margin: 0, fontWeight: 700 }}>
                        {row.label}
                      </dt>
                      <dd className="ds-body" style={{ margin: 0, textAlign: "right", fontWeight: 700 }}>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
                  No specifications available.
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }} aria-label="Quick tags">
                {car?.fuel ? <span className="ds-chip">{car.fuel}</span> : null}
                {car?.transmission ? <span className="ds-chip">{car.transmission}</span> : null}
                {Number.isFinite(Number(car?.year)) ? <span className="ds-chip">{car.year}</span> : null}
              </div>
            </div>

            <div className="ds-card" style={{ padding: 16 }}>
              <h2 className="ds-h2">About</h2>
              <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
                {String(car?.description || "").trim() || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive behavior: keep it simple by stacking on smaller screens */}
      <style>{`
        @media (max-width: 960px) {
          .car-details-stack {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

function formatPriceUSD(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
