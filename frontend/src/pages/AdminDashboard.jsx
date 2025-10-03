import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faTrash,
  faEye,
  faDownload,
  faSignOutAlt,
  faUserPlus,
  faHistory,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const FILE_BASE_URL = "http://localhost:5093"; // ⬅️ change if your backend base URL differs

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // per-row action busy
  const [showHistory, setShowHistory] = useState(false);

  // Preview modal state
  const [selectedDoc, setSelectedDoc] = useState(null);

  // ===== Helpers
  const isPreviewable = (filePath = "") => {
    const lower = String(filePath).toLowerCase();
    return (
      lower.endsWith(".pdf") ||
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp")
    );
  };

  const fileHref = (doc) =>
    doc?.fileUrl
      ? `${FILE_BASE_URL}${doc.fileUrl}`
      : doc?.filePath
      ? `${FILE_BASE_URL}${doc.filePath}`
      : "#";

  const safe = (v, fallback = "-") => (v === null || v === undefined || v === "" ? fallback : v);

  // ===== Data load
  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, docsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/documents"),
      ]);
      setUsers(usersRes?.data || []);
      setDocuments(docsRes?.data || []);
    } catch (err) {
      console.error("Failed to load admin data", err);
      alert("Failed to load admin data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ===== Actions
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const goToAddUser = () => navigate("/admin/add-user");

  const approveDoc = async (id) => {
    const ok = window.confirm("Approve this document?");
    if (!ok) return;
    setBusyId(id);
    try {
      await api.post(`/admin/documents/${id}/approve`);
      setDocuments((docs) =>
        docs.map((d) => (d.documentID === id ? { ...d, status: "Approved" } : d))
      );
    } catch (err) {
      console.error("Approve failed", err);
      alert("Approve failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectDoc = async (id) => {
    const ok = window.confirm("Reject this document?");
    if (!ok) return;
    setBusyId(id);
    try {
      await api.post(`/admin/documents/${id}/reject`);
      setDocuments((docs) =>
        docs.map((d) => (d.documentID === id ? { ...d, status: "Rejected" } : d))
      );
    } catch (err) {
      console.error("Reject failed", err);
      alert("Reject failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteDoc = async (id) => {
    const doc = documents.find((d) => d.documentID === id);
    const label = doc ? `${doc.filePath || doc.fileUrl || id}` : id;
    const ok = window.confirm(
      `Delete this document from history?\n\n${label}\n\nThis action cannot be undone.`
    );
    if (!ok) return;

    setBusyId(id);
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocuments((docs) => docs.filter((d) => d.documentID !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  // ===== Derived
  const pendingDocuments = documents.filter(
    (doc) => String(doc.status).toLowerCase() === "pending"
  );
  const historyDocuments = documents.filter(
    (doc) => ["approved", "rejected"].includes(String(doc.status).toLowerCase())
  );

  // ===== Preview modal
  const openPreview = (doc) => {
    const href = fileHref(doc);
    setSelectedDoc({
      ...doc,
      previewUrl: href,
      isPdf: String(doc?.filePath || doc?.fileUrl || "").toLowerCase().endsWith(".pdf"),
    });
  };
  const closePreview = () => setSelectedDoc(null);

  // ===== Render
  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="text-primary">🛠️ Admin Dashboard</h3>
          <button className="btn btn-outline-danger" onClick={logout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
            Logout
          </button>
        </div>

        {/* Users */}
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5>👥 Users</h5>
          <button className="btn btn-success" onClick={goToAddUser}>
            <FontAwesomeIcon icon={faUserPlus} className="me-2" />
            Add User
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Aadhaar</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.length ? (
                users.map((u) => (
                  <tr key={u.userID}>
                    <td>{safe(u.userID)}</td>
                    <td>{safe(u.name)}</td>
                    <td>{safe(u.username)}</td>
                    <td>{safe(u.aadhaarNumber)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          const ok = window.confirm(
                            `Remove user ${u.name || u.username || u.userID}?`
                          );
                          if (!ok) return;
                          try {
                            await api.delete(`/admin/users/${u.userID}`);
                            setUsers((prev) => prev.filter((x) => x.userID !== u.userID));
                          } catch (err) {
                            console.error("Remove user failed", err);
                            alert("Failed to remove user.");
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-1" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    {loading ? "Loading users..." : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Documents */}
        <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
          <h5>📄 Documents</h5>
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowHistory((v) => !v)}
          >
            <FontAwesomeIcon icon={faHistory} className="me-2" />
            {showHistory ? "Hide History" : "Show History"}
            <span className="badge bg-secondary ms-2">{historyDocuments.length}</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 80 }}>ID</th>
                <th style={{ minWidth: 120 }}>User</th>
                <th>File</th>
                <th style={{ minWidth: 100 }}>Status</th>
                <th style={{ minWidth: 280 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Pending first */}
              {pendingDocuments.length ? (
                pendingDocuments.map((doc) => (
                  <tr key={`p-${doc.documentID}`}>
                    <td>{safe(doc.documentID)}</td>
                    <td>{safe(doc.userName || doc.userID)}</td>
                    <td className="text-break">{safe(doc.filePath || doc.fileUrl)}</td>
                    <td>
                      <span className="badge bg-warning text-dark">Pending</span>
                    </td>
                    <td className="d-flex flex-wrap gap-2">
                      {isPreviewable(doc.filePath || doc.fileUrl) ? (
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => openPreview(doc)}
                          disabled={busyId === doc.documentID}
                          title="Preview"
                        >
                          <FontAwesomeIcon icon={faEye} className="me-1" />
                          View
                        </button>
                      ) : (
                        <a
                          href={fileHref(doc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Download"
                        >
                          <FontAwesomeIcon icon={faDownload} className="me-1" />
                          Download
                        </a>
                      )}

                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => approveDoc(doc.documentID)}
                        disabled={busyId === doc.documentID}
                        title="Approve"
                      >
                        {busyId === doc.documentID ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Approve
                          </>
                        )}
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectDoc(doc.documentID)}
                        disabled={busyId === doc.documentID}
                        title="Reject"
                      >
                        {busyId === doc.documentID ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="me-1" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                            Reject
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    {loading ? "Loading documents..." : "No pending documents"}
                  </td>
                </tr>
              )}

              {/* History (Approved/Rejected) */}
              {showHistory &&
                (historyDocuments.length ? (
                  historyDocuments.map((doc) => {
                    const isApproved =
                      String(doc.status).toLowerCase() === "approved";
                    const isRejected =
                      String(doc.status).toLowerCase() === "rejected";
                    return (
                      <tr key={`h-${doc.documentID}`}>
                        <td>{safe(doc.documentID)}</td>
                        <td>{safe(doc.userName || doc.userID)}</td>
                        <td className="text-break">{safe(doc.filePath || doc.fileUrl)}</td>
                        <td>
                          {isApproved ? (
                            <span className="badge bg-success">Approved</span>
                          ) : isRejected ? (
                            <span className="badge bg-danger">Rejected</span>
                          ) : (
                            safe(doc.status)
                          )}
                        </td>
                        <td className="d-flex flex-wrap gap-2">
                          {isPreviewable(doc.filePath || doc.fileUrl) ? (
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => openPreview(doc)}
                              disabled={busyId === doc.documentID}
                              title="Preview"
                            >
                              <FontAwesomeIcon icon={faEye} className="me-1" />
                              View
                            </button>
                          ) : (
                            <a
                              href={fileHref(doc)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              title="Download"
                            >
                              <FontAwesomeIcon icon={faDownload} className="me-1" />
                              Download
                            </a>
                          )}

                          {/* Delete: shown for history (Approved/Rejected) only */}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => deleteDoc(doc.documentID)}
                            disabled={busyId === doc.documentID}
                            title="Delete from history"
                          >
                            {busyId === doc.documentID ? (
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
                    <td colSpan="5" className="text-center text-muted">
                      No approved/rejected history yet.
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Quick refresh */}
        <div className="mt-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </div>

      {/* ===== Preview Modal (simple overlay, no Bootstrap JS needed) ===== */}
      {selectedDoc && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.6)", zIndex: 1050 }}
          onClick={closePreview} // click backdrop to close
        >
          <div
            className="modal-dialog modal-xl"
            onClick={(e) => e.stopPropagation()} // prevent close on content click
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  📄 Document Preview (ID: {safe(selectedDoc.documentID)})
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closePreview}
                />
              </div>
              <div className="modal-body" style={{ height: "80vh" }}>
                {selectedDoc.isPdf ? (
                  <iframe
                    src={selectedDoc.previewUrl}
                    title="PDF Preview"
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <img
                    src={selectedDoc.previewUrl}
                    alt="Document Preview"
                    className="img-fluid"
                    style={{ maxHeight: "100%", width: "100%", objectFit: "contain" }}
                  />
                )}
              </div>
              <div className="modal-footer">
                <a
                  className="btn btn-secondary"
                  href={selectedDoc.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  Open in new tab
                </a>
                <button className="btn btn-primary" onClick={closePreview}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;