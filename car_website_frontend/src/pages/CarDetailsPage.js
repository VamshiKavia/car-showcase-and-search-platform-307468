import React from "react";
import { Link, useParams } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * CarDetailsPage shows a dedicated detail page for an individual car.
 * Data is placeholder-only for now (no API calls).
 */
export default function CarDetailsPage() {
  const { id } = useParams();

  return (
    <>
      <header className="main-header">
        <h1 className="ds-h1">Car details</h1>
        <p className="ds-body ds-muted">
          Placeholder details for <span className="ds-chip">Car #{id}</span>.
        </p>

        <div className="main-actions">
          <Link className="ds-btn" to="/">
            Back to browse
          </Link>
        </div>
      </header>

      <section className="ds-card" aria-label="Car details content">
        <h2 className="ds-h2">Overview</h2>
        <p className="ds-body ds-muted" style={{ marginTop: 8 }}>
          This is where specifications, features, and photos will appear.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div className="ds-card" style={{ padding: 16 }}>
            <h3 className="placeholder-card-title">Key specs</h3>
            <p className="placeholder-card-body">Year, engine, drivetrain, mileage, etc.</p>
          </div>
          <div className="ds-card" style={{ padding: 16 }}>
            <h3 className="placeholder-card-title">Highlights</h3>
            <p className="placeholder-card-body">Notable features and options.</p>
          </div>
        </div>
      </section>
    </>
  );
}
