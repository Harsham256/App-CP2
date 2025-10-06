import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faSignOutAlt,
  faEye,
  faHistory,
  faTrash,
  faSpinner,
  faCheck,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Home.css";

/* ---------- Local storage helpers to remember which decisions user has acknowledged ---------- */
const ackKey = (userId) => `ack:${userId || "anon"}`;
const loadAckSet = (userId) => {
  try {
    const raw = localStorage.getItem(ackKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};
const saveAckSet = (userId, set) => {
  try {
    localStorage.setItem(ackKey(userId), JSON.stringify(Array.from(set)));
  } catch {}
};

/* ---------- UI helpers ---------- */
const badge = (className, children) => (
  <span className={`badge ${className}`} style={{ fontSize: "0.85rem" }}>
    {children}
  </span>
);

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved")
    return badge(
      "text-bg-success",
      <>
        <FontAwesomeIcon icon={faCheckCircle} /> Approved
      </>
    );
  if (s === "rejected")
    return badge(
      "text-bg-danger",
      <>
        <FontAwesomeIcon icon={faTimesCircle} /> Rejected
      </>
    );
  return badge(
    "text-bg-warning",
    <>
      <FontAwesomeIcon icon={faHourglassHalf} /> Pending
    </>
  );
};

const ts = (doc) => {
  const d =
    doc?.updatedAt ||
    doc?.decisionAt ||
    doc?.reviewedAt ||
    doc?.uploadedAt ||
    doc?.createdAt;
  const t = Date.parse(d || "");
  return Number.isFinite(t) ? t : 0;
};

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "-");

/* ============================================================================================== */
/*                                          COMPONENT                                            */
/* ============================================================================================== */

const UserDashboard = () => {
  const navigate = useNavigate();

  // Data and UI state preserved from your original dashboard
  const [documents, setDocuments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [ackSet, setAckSet] = useState(new Set());
  const userId = useMemo(() => localStorage.getItem("userId"), []);

  // NEW: Inline upload files
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch documents (your existing GET /document/my)
  const refreshDocuments = useCallback(async () => {
    try {
      const url = userId ? `/document/my?userId=${userId}` : "/document/my";
      const response = await api.get(url);
      const data = Array.isArray(response?.data) ? response.data : [];

      // Keep only acks for docs that still exist
      const existingIds = new Set(data.map((d) => d.documentID));
      setAckSet((prev) => {
        const next = new Set([...prev].filter((id) => existingIds.has(id)));
        if (next.size !== prev.size) saveAckSet(userId, next);
        return next;
      });

      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  }, [userId]);

  useEffect(() => {
    setAckSet(loadAckSet(userId));
    refreshDocuments();
  }, [userId, refreshDocuments]);

  // Buckets
  const toLower = (s) => String(s || "").toLowerCase();

  const pendingDocs = useMemo(
    () =>
      documents
        .filter((d) => toLower(d.status) === "pending")
        .sort((a, b) => ts(b) - ts(a)),
    [documents]
  );

  const decisionsUnread = useMemo(
    () =>
      documents
        .filter(
          (d) =>
            ["approved", "rejected"].includes(toLower(d.status)) &&
            !ackSet.has(d.documentID)
        )
        .sort((a, b) => ts(b) - ts(a)),
    [documents, ackSet]
  );

  const historyDocs = useMemo(
    () =>
      documents
        .filter(
          (d) =>
            ["approved", "rejected"].includes(toLower(d.status)) &&
            ackSet.has(d.documentID)
        )
        .sort((a, b) => ts(b) - ts(a)),
    [documents, ackSet]
  );

  // Selection & acknowledgements
  const isSelected = (id) => selected.has(id);
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (selected.size === historyDocs.length) setSelected(new Set());
    else setSelected(new Set(historyDocs.map((d) => d.documentID)));
  };

  const markRead = async (id) => {
    setAckSet((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveAckSet(userId, next);
      return next;
    });
  };

  const markAllRead = async () => {
    if (decisionsUnread.length === 0) return;
    const ids = decisionsUnread.map((d) => d.documentID);
    setAckSet((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      saveAckSet(userId, next);
      return next;
    });
  };

  // Delete
  const deleteOne = async (id) => {
    const doc = historyDocs.find((d) => d.documentID === id);
    const label = doc ? `${doc.filePath || id}` : id;
    const ok = window.confirm(
      `Delete this record?\n\n${label}\n\nThis action cannot be undone.`
    );
    if (!ok) return;
    setRowBusy((prev) => new Set(prev).add(id));
    try {
      await api.delete(`/document/${id}`);
      setDocuments((prev) => prev.filter((d) => d.documentID !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setAckSet((prev) => {
        const next = new Set(prev);
        next.delete(id);
        saveAckSet(userId, next);
        return next;
      });
    } catch (err) {
      alert("Delete failed. Try again.");
    } finally {
      setRowBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteMany = async (ids) => {
    if (!ids.length) return;
    const ok = window.confirm(`Delete ${ids.length} selected record(s)?`);
    if (!ok) return;
    setBusy(true);
    try {
      await Promise.all(ids.map((id) => api.delete(`/document/${id}`)));
      setDocuments((prev) => prev.filter((d) => !ids.includes(d.documentID)));
      setSelected(new Set());
      setAckSet((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        saveAckSet(userId, next);
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/");
  };

  // NEW: Submit Aadhaar + PAN upload (PNG only)
  const submitIdentity = async (e) => {
    e.preventDefault();
    if (!aadhaarFile || !panFile)
      return alert("Please select both Aadhaar and PAN files.");
    const allowed = (f) => f && /\.png$/i.test(f.name);
    if (!allowed(aadhaarFile) || !allowed(panFile))
      return alert("Aadhaar and PAN must be PNG images (.png).");

    const form = new FormData();
    form.append("aadhaar", aadhaarFile);
    form.append("pan", panFile);

    setUploading(true);
    try {
      const res = await api.post("/document/verify-identity", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Optional: inspect extracted output
      console.log("Extracted:", res.data);

      // Refresh your lists (in case backend creates DB entries)
      await refreshDocuments();

      // Reset file inputs
      setAadhaarFile(null);
      setPanFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------------------------------------- RENDER ---------------------------------------------- */

  return (
    <div className="home-bg text-white min-vh-100 d-flex flex-column">
      <Navbar />

      <div className="container py-4 flex-grow-1">
        {/* HEADER */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="m-0 text-glow">👤 User Dashboard</h4>

          <div className="d-flex gap-2">
            <button
              className="btn btn-glow-green"
              onClick={() => navigate("/upload")}
            >
              Apply Document for Verification
            </button>

            <button
              className="btn btn-outline-light"
              onClick={() => setShowHistory(true)}
            >
              <FontAwesomeIcon icon={faHistory} className="me-2" />
              History{" "}
              <span className="badge bg-dark ms-1">{historyDocs.length}</span>
            </button>

            <button className="btn btn-outline-danger" onClick={logout}>
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
              Logout
            </button>
          </div>
        </div>

        {/* INLINE UPLOAD: Aadhaar + PAN */}
        <form onSubmit={submitIdentity} className="card p-3 mb-4 shadow-sm">
          <h6 className="mb-3">
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Upload Aadhaar &amp; PAN for Verification
          </h6>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Aadhaar (PNG)</label>
              <input
                type="file"
                accept=".png,image/png"
                className="form-control"
                onChange={(e) => setAadhaarFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">PAN (PNG)</label>
              <input
                type="file"
                accept=".png,image/png"
                className="form-control"
                onChange={(e) => setPanFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                  Uploading…
                </>
              ) : (
                <>Submit for Verification</>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setAadhaarFile(null);
                setPanFile(null);
              }}
              disabled={uploading}
            >
              Reset
            </button>
          </div>
        </form>

        {/* UPDATES (Approved / Rejected) */}
        <div className="mb-4">
          <h6 className="mb-3">🔔 Updates (Approved / Rejected)</h6>

          {decisionsUnread.length ? (
            <>
              <div className="table-responsive">
                <table className="table table-dark table-striped align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}></th>
                      <th style={{ whiteSpace: "nowrap" }}>ID</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Updated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisionsUnread.map((doc) => (
                      <tr key={doc.documentID}>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => markRead(doc.documentID)}
                            title="Mark as Read"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        </td>
                        <td>{doc.documentID}</td>
                        <td>{doc.filePath}</td>
                        <td>{getStatusBadge(doc.status)}</td>
                        <td>{fmtDate(doc.updatedAt || doc.uploadedAt)}</td>
                        <td>
                          {String(doc.status).toLowerCase() === "approved" ? (
                            <Link
                              className="btn btn-sm btn-outline-info"
                              to={`/report/${doc.documentID}`}
                              title="View Report"
                            >
                              <FontAwesomeIcon icon={faEye} className="me-2" />
                              View Report
                            </Link>
                          ) : (
                            "—"
                          )}
                          <button
                            className="btn btn-sm btn-secondary ms-2"
                            onClick={() => markRead(doc.documentID)}
                          >
                            Mark Read
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-outline-light" onClick={markAllRead}>
                Mark All as Read
              </button>
            </>
          ) : (
            <div className="text-muted">No unread updates.</div>
          )}
        </div>

        {/* PENDING */}
        <div className="mb-4">
          <h6 className="mb-3">🗂️ Pending Documents</h6>

          <div className="table-responsive">
            <table className="table table-dark table-striped align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Uploaded At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingDocs.length ? (
                  pendingDocs.map((doc) => (
                    <tr key={doc.documentID}>
                      <td>{doc.documentID}</td>
                      <td>{doc.filePath}</td>
                      <td>{getStatusBadge(doc.status)}</td>
                      <td>{fmtDate(doc.uploadedAt)}</td>
                      <td>—</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No pending documents.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* HISTORY MODAL */}
        {showHistory && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1050 }}
            onClick={() => setShowHistory(false)}
          >
            <div
              className="bg-white text-dark rounded shadow"
              style={{ width: "min(1100px, 95vw)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <h6 className="m-0">📝 Document History</h6>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>

              <div className="px-3 py-2 d-flex align-items-center gap-2">
                <div className="text-muted flex-grow-1">
                  Showing {historyDocs.length} records
                </div>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => deleteMany(Array.from(selected))}
                  disabled={busy || selected.size === 0}
                >
                  {busy ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                      Deleting...
                    </>
                  ) : (
                    <>Delete Selected</>
                  )}
                </button>
              </div>

              <div className="table-responsive p-3">
                <table className="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        {historyDocs.length > 0 && (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selected.size === historyDocs.length}
                            onChange={toggleSelectAll}
                          />
                        )}
                      </th>
                      <th>ID</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Updated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyDocs.length ? (
                      historyDocs.map((doc) => {
                        const id = doc.documentID;
                        const rowIsBusy = rowBusy.has(id);

                        return (
                          <tr key={id}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected(id)}
                                onChange={() => toggleSelect(id)}
                                disabled={rowIsBusy || busy}
                              />
                            </td>
                            <td>{id}</td>
                            <td>{doc.filePath}</td>
                            <td>{getStatusBadge(doc.status)}</td>
                            <td>{fmtDate(doc.updatedAt)}</td>
                            <td>
                              {String(doc.status).toLowerCase() === "approved" ? (
                                <Link
                                  className="btn btn-sm btn-outline-info me-2"
                                  to={`/report/${id}`}
                                  title="View Report"
                                >
                                  <FontAwesomeIcon icon={faEye} className="me-1" />
                                  View Report
                                </Link>
                              ) : (
                                "—"
                              )}

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteOne(id)}
                                disabled={rowIsBusy || busy}
                              >
                                {rowIsBusy ? (
                                  <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          No history records yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-top text-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;