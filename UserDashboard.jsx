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
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Home.css";// ✅ fixed import path

/* Local storage helpers for per-user acknowledgements */
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

const UserDashboard = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [ackSet, setAckSet] = useState(new Set());
  const userId = useMemo(() => localStorage.getItem("userId"), []);

  useEffect(() => {
    setAckSet(loadAckSet(userId));
    const fetchDocuments = async () => {
      try {
        const url = userId ? `/document/my?userId=${userId}` : "/document/my";
        const response = await api.get(url);
        const data = Array.isArray(response?.data) ? response.data : [];
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
              History <span className="badge bg-dark ms-1">{historyDocs.length}</span>
            </button>
            <button className="btn btn-outline-danger" onClick={logout}>
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
              Logout
            </button>
          </div>
        </div>

        {/* UPDATES */}
        <div className="card shadow-lg bg-dark bg-opacity-50 mb-4 border-light">
          <div className="card-header border-0 bg-transparent text-glow fw-bold">
            🔔 Updates (Approved / Rejected)
          </div>
          <div className="card-body p-0">
            {decisionsUnread.length ? (
              <>
                <table className="table table-dark align-middle mb-0">
                  <thead>
                    <tr>
                      <th></th>
                      <th>ID</th>
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
                            className="btn btn-sm btn-success"
                            onClick={() => markRead(doc.documentID)}
                            title="Mark as Read"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        </td>
                        <td>{doc.documentID}</td>
                        <td className="text-truncate">{doc.filePath}</td>
                        <td>{getStatusBadge(doc.status)}</td>
                        <td>{fmtDate(doc.updatedAt || doc.uploadedAt)}</td>
                        <td>
                          {String(doc.status).toLowerCase() === "approved" ? (
                            <Link
                              to={`/report/${doc.documentID}`}
                              className="btn btn-sm btn-outline-info me-2"
                            >
                              <FontAwesomeIcon icon={faEye} /> View Report
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => markRead(doc.documentID)}
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Mark Read
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 text-end">
                  <button className="btn btn-glow-green" onClick={markAllRead}>
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Mark All as Read
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-muted">No unread updates.</div>
            )}
          </div>
        </div>

        {/* PENDING */}
        <div className="card shadow-lg bg-dark bg-opacity-50 mb-4 border-light">
          <div className="card-header border-0 bg-transparent text-glow fw-bold">
            🗂️ Pending Documents
          </div>
          <div className="card-body p-0">
            <table className="table table-dark align-middle mb-0">
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
                      <td className="text-truncate">{doc.filePath}</td>
                      <td>{getStatusBadge(doc.status)}</td>
                      <td>{fmtDate(doc.uploadedAt)}</td>
                      <td className="text-muted">—</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
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
          <>
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowHistory(false)}
            />
            <div
              className="modal fade show d-block"
              onClick={() => setShowHistory(false)}
            >
              <div
                className="modal-dialog modal-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content bg-dark text-white border border-light">
                  <div className="modal-header border-0">
                    <h5 className="text-glow">📝 Document History</h5>
                    <button
                      className="btn-close"
                      onClick={() => setShowHistory(false)}
                    ></button>
                  </div>
                  <div className="modal-body p-0">
                    <div className="p-3 d-flex justify-content-between">
                      <span className="text-muted">
                        Showing {historyDocs.length} records
                      </span>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => deleteMany(Array.from(selected))}
                        disabled={busy || selected.size === 0}
                      >
                        {busy ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin /> Deleting...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTrash} /> Delete Selected
                          </>
                        )}
                      </button>
                    </div>
                    <table className="table table-dark table-hover mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>
                            {historyDocs.length > 0 && (
                              <input
                                type="checkbox"
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
                                    checked={isSelected(id)}
                                    onChange={() => toggleSelect(id)}
                                    disabled={rowIsBusy || busy}
                                  />
                                </td>
                                <td>{id}</td>
                                <td className="text-truncate">{doc.filePath}</td>
                                <td>{getStatusBadge(doc.status)}</td>
                                <td>{fmtDate(doc.updatedAt)}</td>
                                <td>
                                  {String(doc.status).toLowerCase() ===
                                  "approved" ? (
                                    <Link
                                      to={`/report/${id}`}
                                      className="btn btn-sm btn-outline-info me-2"
                                    >
                                      <FontAwesomeIcon icon={faEye} /> View Report
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
                                        <FontAwesomeIcon icon={faSpinner} spin />{" "}
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <FontAwesomeIcon icon={faTrash} /> Delete
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-3">
                              No history records yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="modal-footer border-0">
                    <button
                      className="btn btn-outline-light"
                      onClick={() => setShowHistory(false)}
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
    </div>
  );
};

export default UserDashboard;
