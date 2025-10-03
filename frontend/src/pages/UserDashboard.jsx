// FRONTEND/src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  faCheck, // ✅ tick button for mark-as-read
} from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Local storage helpers for per-user acknowledgements (read flags).
 */
const ackKey = (userId) => `ack:${userId || "anon"}`;

function loadAckSet(userId) {
  try {
    const raw = localStorage.getItem(ackKey(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveAckSet(userId, set) {
  try {
    localStorage.setItem(ackKey(userId), JSON.stringify(Array.from(set)));
  } catch {
    // no-op
  }
}

const badge = (className, children) => (
  <span className={`badge ${className}`} style={{ fontSize: "0.85rem" }}>
    {children}
  </span>
);

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return badge("text-bg-success", <><FontAwesomeIcon icon={faCheckCircle} /> Approved</>);
  if (s === "rejected") return badge("text-bg-danger", <><FontAwesomeIcon icon={faTimesCircle} /> Rejected</>);
  return badge("text-bg-warning", <><FontAwesomeIcon icon={faHourglassHalf} /> Pending</>);
};

const ts = (doc) => {
  // Use the most relevant timestamp available.
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

const UserDashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false); // bulk busy
  const [rowBusy, setRowBusy] = useState(new Set()); // per-row busy
  const [selected, setSelected] = useState(new Set()); // selection in history
  const [ackSet, setAckSet] = useState(new Set()); // ✅ read/acknowledged decision ids

  const userId = useMemo(() => localStorage.getItem("userId"), []);

  // Load acks and documents
  useEffect(() => {
    setAckSet(loadAckSet(userId));

    const fetchDocuments = async () => {
      try {
        const url = userId ? `/document/my?userId=${userId}` : "/document/my";
        const response = await api.get(url);
        const data = Array.isArray(response?.data) ? response.data : [];

        // prune ack set to only keep IDs that still exist
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
    };
    fetchDocuments();
  }, [userId]);

  const toLower = (s) => String(s || "").toLowerCase();

  // Derived lists
  const pendingDocs = useMemo(
    () => documents.filter((d) => toLower(d.status) === "pending").sort((a, b) => ts(b) - ts(a)),
    [documents]
  );

  const decisionsUnread = useMemo(
    () =>
      documents
        .filter((d) => ["approved", "rejected"].includes(toLower(d.status)) && !ackSet.has(d.documentID))
        .sort((a, b) => ts(b) - ts(a)),
    [documents, ackSet]
  );

  const historyDocs = useMemo(
    () =>
      documents
        .filter((d) => ["approved", "rejected"].includes(toLower(d.status)) && ackSet.has(d.documentID))
        .sort((a, b) => ts(b) - ts(a)),
    [documents, ackSet]
  );

  // Selection (history only)
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

  // Mark-as-read (acknowledge)
  const markRead = async (id) => {
    setAckSet((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveAckSet(userId, next);
      return next;
    });

    // Optional: call backend to persist read state if available
    // try { await api.post(`/document/${id}/ack`); } catch (e) { /* fallback to local only */ }
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

    // Optional: bulk ack API if your backend supports it
    // try { await api.post(`/document/ack/bulk`, { ids }); } catch {}
  };

  // Delete handlers (history only)
  const deleteOne = async (id) => {
    const doc = historyDocs.find((d) => d.documentID === id);
    const label = doc ? `${doc.filePath || id}` : id;
    const ok = window.confirm(
      `Delete this history record?\n\n${label}\n\nThis action cannot be undone.`
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
      // Also drop from ACK set
      setAckSet((prev) => {
        const next = new Set(prev);
        next.delete(id);
        saveAckSet(userId, next);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete document", err);
      alert("Failed to delete. Please try again or contact support.");
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
    const ok = window.confirm(
      `Delete ${ids.length} selected record(s)?\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      await Promise.all(ids.map((id) => api.delete(`/document/${id}`)));
      setDocuments((prev) => prev.filter((d) => !ids.includes(d.documentID)));
      setSelected(new Set());
      // Also drop from ACK set
      setAckSet((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        saveAckSet(userId, next);
        return next;
      });
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some deletions may have failed. Please refresh and try again.");
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

  return (
    <>
      <Navbar />
      <div className="container py-4">

        {/* Header row */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="m-0">
            <span role="img" aria-label="user">👤</span> User Dashboard
          </h4>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/upload")}
              title="Apply Document for Verification"
            >
              Apply Document for Verification
            </button>

            <button
              className="btn btn-outline-secondary position-relative"
              onClick={() => setShowHistory(true)}
              title="See Approved/Rejected history"
            >
              <FontAwesomeIcon icon={faHistory} className="me-2" />
              See History
              <span className="badge text-bg-dark ms-2">{historyDocs.length}</span>
            </button>

            <button className="btn btn-outline-danger" onClick={logout} title="Logout">
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
              Logout
            </button>
          </div>
        </div>

        {/* ✅ Updates (Unread approvals/rejections) */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white">
            <h6 className="m-0">
              <span role="img" aria-label="bell">🔔</span> Updates (Approved / Rejected) — Unread
            </h6>
          </div>
          <div className="card-body p-0">
            {decisionsUnread.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>ID</th>
                        <th>File</th>
                        <th>Status</th>
                        <th>Updated At</th>
                        <th style={{ width: 200 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decisionsUnread.map((doc) => (
                        <tr key={doc.documentID}>
                          <td>
                            {/* Tick button to mark read */}
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => markRead(doc.documentID)}
                              title="Mark as read and move to History"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                          </td>
                          <td>{doc.documentID}</td>
                          <td className="text-truncate" style={{ maxWidth: 360 }}>
                            {doc.filePath}
                          </td>
                          <td>{getStatusBadge(doc.status)}</td>
                          <td>{fmtDate(doc.updatedAt || doc.uploadedAt)}</td>
                          <td className="d-flex gap-2">
                            {/* Only Approved: allow View Report */}
                            {String(doc.status).toLowerCase() === "approved" ? (
                              <Link to={`/report/${doc.documentID}`} className="btn btn-sm btn-outline-primary">
                                <FontAwesomeIcon icon={faEye} className="me-1" />
                                View Report
                              </Link>
                            ) : (
                              <span className="text-muted">—</span>
                            )}

                            {/* Convenience: Mark read here too */}
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => markRead(doc.documentID)}
                            >
                              <FontAwesomeIcon icon={faCheck} className="me-1" />
                              Mark as Read
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 d-flex justify-content-end">
                  <button className="btn btn-success" onClick={markAllRead}>
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Mark All as Read ({decisionsUnread.length})
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 text-muted">No unread updates.</div>
            )}
          </div>
        </div>

        {/* 📄 Pending Documents */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h6 className="m-0">
              <span role="img" aria-label="folder">🗂️</span> Pending Documents
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 120 }}>ID</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Uploaded At</th>
                    <th style={{ width: 200 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.length > 0 ? (
                    pendingDocs.map((doc) => (
                      <tr key={doc.documentID}>
                        <td>{doc.documentID}</td>
                        <td className="text-truncate" style={{ maxWidth: 420 }}>
                          {doc.filePath}
                        </td>
                        <td>{getStatusBadge(doc.status)}</td>
                        <td>{fmtDate(doc.uploadedAt)}</td>
                        <td className="text-muted">—</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-muted text-center py-3">
                        No pending documents.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== History Modal (Approved/Rejected that are READ) ===== */}
        {showHistory && (
          <>
            {/* Backdrop */}
            <div
              className="modal-backdrop fade show"
              onClick={() => {
                setShowHistory(false);
                setSelected(new Set());
              }}
            />
            {/* Modal */}
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
              onClick={() => {
                setShowHistory(false);
                setSelected(new Set());
              }}
            >
              <div
                className="modal-dialog modal-xl modal-dialog-scrollable"
                role="document"
                onClick={(e) => e.stopPropagation()} // prevent close on inside click
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h6 className="modal-title">
                      <span role="img" aria-label="doc">📝</span> Document History (Approved / Rejected)
                    </h6>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowHistory(false);
                        setSelected(new Set());
                      }}
                    />
                  </div>

                  <div className="modal-body p-0">
                    <div className="p-3 d-flex justify-content-between align-items-center">
                      <div className="small text-muted">
                        Showing {historyDocs.length} records
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => deleteMany(Array.from(selected))}
                        title={selected.size === 0 ? "Select rows to enable bulk delete" : "Delete selected"}
                        disabled={busy || selected.size === 0}
                      >
                        {busy ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTrash} className="me-2" />
                            Delete Selected ({selected.size})
                          </>
                        )}
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 42 }}>
                              {historyDocs.length > 0 && (
                                <input
                                  type="checkbox"
                                  checked={selected.size === historyDocs.length}
                                  onChange={toggleSelectAll}
                                  aria-label="Select all"
                                />
                              )}
                            </th>
                            <th>ID</th>
                            <th>File</th>
                            <th>Status</th>
                            <th>Updated At</th>
                            <th style={{ width: 220 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyDocs.length > 0 ? (
                            historyDocs.map((doc) => {
                              const id = doc.documentID;
                              const rowIsBusy = rowBusy.has(id);
                              return (
                                <tr key={id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={isSelected(id)}
                                      onChange={() => toggleSelect(id)}
                                      disabled={rowIsBusy || busy}
                                      aria-label={`Select ${id}`}
                                    />
                                  </td>
                                  <td>{id}</td>
                                  <td className="text-truncate" style={{ maxWidth: 360 }}>
                                    {doc.filePath}
                                  </td>
                                  <td>{getStatusBadge(doc.status)}</td>
                                  <td>{fmtDate(doc.updatedAt || doc.uploadedAt)}</td>
                                  <td className="d-flex gap-2">
                                    {String(doc.status).toLowerCase() === "approved" ? (
                                      <Link to={`/report/${id}`} className="btn btn-sm btn-outline-primary">
                                        <FontAwesomeIcon icon={faEye} className="me-1" />
                                        View Report
                                      </Link>
                                    ) : (
                                      <span className="text-muted">—</span>
                                    )}
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => deleteOne(id)}
                                      disabled={rowIsBusy || busy}
                                    >
                                      {rowIsBusy ? (
                                        <>
                                          <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
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
                              <td colSpan={6} className="text-muted text-center py-3">
                                No approved or rejected documents in history yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowHistory(false);
                        setSelected(new Set());
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Small style touch for white + dark blue glow accents */}
      <style>{`
        .card {
          border-radius: 10px;
        }
        .card-header h6 {
          color: #0a2a66;
          text-shadow: 0 0 6px rgba(14, 56, 164, 0.25);
        }
        .btn-outline-primary:hover {
          box-shadow: 0 0 10px rgba(14, 56, 164, 0.35);
        }
        .badge.text-bg-success, .badge.text-bg-danger, .badge.text-bg-warning {
          border-radius: 6px;
        }
      `}</style>
    </>
  );
};

export default UserDashboard;