// FRONTEND/src/pages/Report.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BigTrafficLight from "../components/BigTrafficLight.jsx";
import MapView from "../components/MapView.jsx";
import { getReport } from "../api/api.js";

export default function Report() {
  const { id } = useParams(); 
  const [isPlaying, setIsPlaying] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [finalStatus, setFinalStatus] = useState(null);
  const [finalLabel, setFinalLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  // ✅ Fetch report
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getReport(id)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  // ✅ Handle traffic light completion
  const handleIntroComplete = () => {
    setShowReport(true);
    const isGreen = (report?.trafficLightStatus || "").toLowerCase() === "green";
    setFinalStatus(isGreen ? "green" : "red");
    setFinalLabel(isGreen ? "Verified" : "Issues Found");
    setIsPlaying(false);
  };

  // ✅ Badge helper with icons + friendly labels
  const badge = (color) => {
    const value = String(color || "").toLowerCase();
    return value === "green" ? (
      <span className="badge rounded-pill bg-success px-3 py-2 shadow-sm">
        ✅ Passed
      </span>
    ) : (
      <span className="badge rounded-pill bg-danger px-3 py-2 shadow-sm">
        ❌ Failed
      </span>
    );
  };

  // ✅ Memoized props for children
  const condition = useMemo(() => report?.conditionResults || {}, [report]);
  const mapInfo = useMemo(() => report?.map || {}, [report]);
  const land = useMemo(() => report?.matchedLand || {}, [report]);
  const extracted = useMemo(() => report?.extracted || {}, [report]);

  // ✅ Count total passed checks
  const passedCount = useMemo(() => {
    return Object.values(condition).filter(
      (c) => String(c).toLowerCase() === "green"
    ).length;
  }, [condition]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-primary">
          <i className="fa-solid fa-file-shield me-2"></i> Verification Report
        </h2>
        <Link to="/dashboard" className="btn btn-gradient">
          <i className="fa-solid fa-arrow-left me-2"></i>Back to Dashboard
        </Link>
      </div>

      {/* Traffic Light */}
      <BigTrafficLight
        isPlaying={isPlaying}
        onSequenceComplete={handleIntroComplete}
        finalStatus={finalStatus}
        finalLabel={finalLabel}
      />

      {loading && (
        <div className="text-center text-muted my-3 fs-5">
          <i className="fa-solid fa-spinner fa-spin me-2"></i>Fetching verification data…
        </div>
      )}
      {error && (
        <div className="alert alert-danger my-3 shadow-sm">
          <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
        </div>
      )}

      {showReport && report && (
        <div className="animate-fade-in">
          {/* Summary */}
          <div className="card shadow-lg border-0 mb-4 report-card">
            <div className="card-body d-flex align-items-center">
              <i
                className={`fa-solid fa-circle me-3 fs-3 ${
                  report.trafficLightStatus === "Green" ? "text-success" : "text-danger"
                }`}
              ></i>
              <div>
                <h5 className="card-title fw-bold mb-1">{report.summary}</h5>
                <div className="small text-muted">Document ID: {report.documentID}</div>
              </div>
            </div>
          </div>

          {/* Extracted + Matched Land */}
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100 report-card">
                <div className="card-header bg-gradient-primary text-white fw-bold">
                  <i className="fa-solid fa-magnifying-glass me-2"></i>Extracted (from document)
                </div>
                <div className="card-body">
                  <p><span className="text-muted">Name(#):</span> <strong>{extracted?.nameFromDocument || "—"}</strong></p>
                  <p><span className="text-muted">LandId(-):</span> <code>{extracted?.landIdFromDocument || "—"}</code></p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm border-0 h-100 report-card">
                <div className="card-header bg-gradient-success text-white fw-bold">
                  <i className="fa-solid fa-database me-2"></i>Matched Land (from database)
                </div>
                <div className="card-body">
                  <p><span className="text-muted">LandId:</span> <code>{land?.landId || "Unknown"}</code></p>
                  <p><span className="text-muted">Owner Name*:</span> <strong>{land?.ownerNameDb || "Unknown"}</strong></p>
                  <p><span className="text-muted">Address:</span> {land?.address || "Unknown"}</p>
                  <p><span className="text-muted">Coords:</span> {land?.coordinates?.latitude}, {land?.coordinates?.longitude}</p>
                  <p><span className="text-muted">Year of Existence:</span> {land?.yearOfExistence ?? "—"}</p>
                  <p><span className="text-muted">Ownership:</span> {land?.ownership ?? land?.ownershipType ?? "—"}</p>
                  <p><span className="text-muted">Land Type:</span> {land?.landType || "—"} {land?.restrictedType ? `(${land.restrictedType})` : ""}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="card shadow-sm border-0 my-4 report-card">
            <div className="card-header bg-gradient-warning text-dark fw-bold">
              <i className="fa-solid fa-traffic-light me-2"></i>Verification Conditions
            </div>
            <div className="card-body table-responsive">
              <table className="table align-middle mb-0 table-hover">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Condition</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>OwnerName Match</td><td>{badge(condition.ownerNameMatch)}</td></tr>
                  <tr><td>2</td><td>Family Settlement</td><td>{badge(condition.siblingApproval)}</td></tr>
                  <tr><td>3</td><td>No Loan Check</td><td>{badge(condition.ongoingLoan)}</td></tr>
                  <tr><td>4</td><td>No Letigation Check</td><td>{badge(condition.anyDisputes)}</td></tr>
                  <tr><td>5</td><td>Landtype Check</td><td>{badge(condition.typeApproved)}</td></tr>
                  {/* ✅ Summary Row */}
                  <tr className="table-info fw-bold">
                    <td colSpan="2">Summary</td>
                    <td>{passedCount}/5 Checks Passed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Map */}
          <div className="card shadow-sm border-0 report-card">
            <div className="card-header bg-gradient-info text-white fw-bold">
              <i className="fa-solid fa-map-location-dot me-2"></i>Location (OpenStreetMap)
            </div>
            <div className="card-body">
              <MapView
                latitude={mapInfo?.latitude || 0}
                longitude={mapInfo?.longitude || 0}
                polygonColor={mapInfo?.polygonColor || "#16a34a"}
                areaMeters={70}
              />
              <div className="small text-muted mt-2">
                Outline color shows permitted (green) vs restricted (red: Forest/Military/Govt).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        .btn-gradient {
          background: linear-gradient(45deg, #1d4ed8, #3b82f6);
          color: white;
          border: none;
          transition: all 0.3s ease;
        }
        .btn-gradient:hover {
          background: linear-gradient(45deg, #2563eb, #60a5fa);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .report-card {
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .report-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        }
        .bg-gradient-primary {
          background: linear-gradient(90deg, #2563eb, #3b82f6);
        }
        .bg-gradient-success {
          background: linear-gradient(90deg, #16a34a, #22c55e);
        }
        .bg-gradient-warning {
          background: linear-gradient(90deg, #facc15, #fbbf24);
        }
        .bg-gradient-info {
          background: linear-gradient(90deg, #0ea5e9, #38bdf8);
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
