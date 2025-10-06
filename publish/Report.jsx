import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BigTrafficLight from "../components/BigTrafficLight";
import MapView from "../components/MapView";
import { getReport } from "../api/api";
import Navbar from "../components/Navbar";
import "../Home.css"; // ✅ fixed import path

export default function Report() {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [finalStatus, setFinalStatus] = useState(null);
  const [finalLabel, setFinalLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReport(id)
      .then((data) => !cancelled && setReport(data))
      .catch((err) => !cancelled && setError(err?.message || "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => (cancelled = true);
  }, [id]);

  const handleIntroComplete = () => {
    const isGreen = (report?.trafficLightStatus || "").toLowerCase() === "green";
    setFinalStatus(isGreen ? "green" : "red");
    setFinalLabel(isGreen ? "Verified" : "Issues Found");
    setIsPlaying(false);
    setShowReport(true);
  };

  const badge = (color) => {
    const val = String(color || "").toLowerCase();
    if (val === "green")
      return <span className="badge bg-success px-3 py-2">✅ Passed</span>;
    if (val === "red")
      return <span className="badge bg-danger px-3 py-2">❌ Failed</span>;
    return <span className="badge bg-warning text-dark px-3 py-2">Pending</span>;
  };

  const condition = useMemo(() => report?.conditionResults || {}, [report]);
  const mapInfo = useMemo(() => report?.map || {}, [report]);
  const land = useMemo(() => report?.matchedLand || {}, [report]);
  const extracted = useMemo(() => report?.extracted || {}, [report]);

  const passedCount = useMemo(() => {
    return Object.values(condition).filter(
      (v) => String(v).toLowerCase() === "green"
    ).length;
  }, [condition]);

  return (
    <div className="home-bg text-white min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container py-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-glow">🧾 Verification Report</h2>
          <Link to="/dashboard" className="btn btn-glow-green">
            ← Back to Dashboard
          </Link>
        </div>

        <BigTrafficLight
          isPlaying={isPlaying}
          onSequenceComplete={handleIntroComplete}
          finalStatus={finalStatus}
          finalLabel={finalLabel}
        />

        {loading && (
          <div className="text-center text-muted fs-5 my-4">
            <i className="fa-solid fa-spinner fa-spin me-2"></i> Loading report…
          </div>
        )}
        {error && (
          <div className="alert alert-danger text-center shadow-sm my-3">
            {error}
          </div>
        )}

        {showReport && report && (
          <div className="animate-fade-in">
            {/* SUMMARY */}
            <div className="card bg-dark bg-opacity-75 text-light border-light shadow-lg mb-4">
              <div className="card-body d-flex align-items-center">
                <i
                  className={`fa-solid fa-circle me-3 fs-3 ${
                    report.trafficLightStatus === "Green"
                      ? "text-success-glow"
                      : "text-danger-glow"
                  }`}
                ></i>
                <div>
                  <h5 className="fw-bold text-glow mb-1">{report.summary}</h5>
                  <small className="text-secondary">
                    Document ID: {report.documentID}
                  </small>
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card bg-dark bg-opacity-75 text-light border-light h-100 shadow-sm">
                  <div className="card-header border-0 text-glow fw-bold">
                    Extracted Details
                  </div>
                  <div className="card-body">
                    <p>
                      <strong className="text-info">Name:</strong>{" "}
                      {extracted?.nameFromDocument || "—"}
                    </p>
                    <p>
                      <strong className="text-info">Land ID:</strong>{" "}
                      <code>{extracted?.landIdFromDocument || "—"}</code>
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card bg-dark bg-opacity-75 text-light border-light h-100 shadow-sm">
                  <div className="card-header border-0 text-glow fw-bold">
                    Matched Land
                  </div>
                  <div className="card-body">
                    <p>
                      <strong className="text-info">Owner:</strong>{" "}
                      {land?.ownerNameDb || "Unknown"}
                    </p>
                    <p>
                      <strong className="text-info">Address:</strong>{" "}
                      {land?.address || "Unknown"}
                    </p>
                    <p>
                      <strong className="text-info">Type:</strong>{" "}
                      {land?.landType || "—"}
                    </p>
                    <p>
                      <strong className="text-info">Aadhaar:</strong>{" "}
                      {land?.aadhaarNumber || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CONDITIONS */}
            <div className="card bg-dark bg-opacity-75 text-light border-light shadow-sm mt-4">
              <div className="card-header border-0 text-glow fw-bold">
                Verification Conditions
              </div>
              <div className="card-body table-responsive">
                <table className="table table-dark align-middle mb-0">
                  <thead>
                    <tr className="text-info">
                      <th>#</th>
                      <th>Condition</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Owner Name Match</td>
                      <td>{badge(condition.ownerNameMatch)}</td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Family Settlement</td>
                      <td>{badge(condition.siblingApproval)}</td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>No Loan Check</td>
                      <td>{badge(condition.ongoingLoan)}</td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>No Litigation</td>
                      <td>{badge(condition.anyDisputes)}</td>
                    </tr>
                    <tr>
                      <td>5</td>
                      <td>Land Type Approved</td>
                      <td>{badge(condition.typeApproved)}</td>
                    </tr>
                    <tr className="fw-bold text-warning">
                      <td colSpan="2">Total Passed</td>
                      <td>{passedCount}/5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MAP */}
            <div className="card bg-dark bg-opacity-75 text-light border-light shadow-sm mt-4">
              <div className="card-header border-0 text-glow fw-bold">
                Land Location Map
              </div>
              <div className="card-body">
                <MapView
                  latitude={mapInfo?.latitude || 0}
                  longitude={mapInfo?.longitude || 0}
                  polygonColor={mapInfo?.polygonColor || "#00ff99"}
                  areaMeters={70}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
