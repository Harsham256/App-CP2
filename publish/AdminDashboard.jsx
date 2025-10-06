import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
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
import "../Home.css"; 

const FILE_BASE_URL = "http://localhost:5093";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

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

  const safe = (v, fallback = "-") =>
    v === null || v === undefined || v === "" ? fallback : v;

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
      Swal.fire("Error", "Failed to load admin data. Please refresh.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const approveDoc = async (id) => {
    Swal.fire("Success", "Approved Successfully", "success");
    setBusyId(id);
    try {
      await api.post(`/admin/documents/${id}/approve`);
      setDocuments((docs) =>
        docs.map((d) =>
          d.documentID === id ? { ...d, status: "Approved" } : d
        )
      );
    } catch {
      Swal.fire("Error", "Approve failed. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const rejectDoc = async (id) => {
    Swal.fire("Success", "Rejected Successfully", "success");
    setBusyId(id);
    try {
      await api.post(`/admin/documents/${id}/reject`);
      setDocuments((docs) =>
        docs.map((d) =>
          d.documentID === id ? { ...d, status: "Rejected" } : d
        )
      );
    } catch {
      Swal.fire("Error", "Reject failed. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const deleteDoc = async (id) => {
    const doc = documents.find((d) => d.documentID === id);
    const label = doc ? `${doc.filePath || doc.fileUrl || id}` : id;
    const ok = await Swal.fire({
      title: "Are you sure?",
      text: `Delete this document?\n${label}`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    setBusyId(id);
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocuments((docs) => docs.filter((d) => d.documentID !== id));
    } catch {
      Swal.fire("Error", "Delete failed. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const pendingDocuments = documents.filter(
    (doc) => String(doc.status).toLowerCase() === "pending"
  );
  const historyDocuments = documents.filter((doc) =>
    ["approved", "rejected"].includes(String(doc.status).toLowerCase())
  );

  const openPreview = (doc) => {
    setSelectedDoc({
      ...doc,
      previewUrl: fileHref(doc),
      isPdf: String(doc?.filePath || doc?.fileUrl || "").toLowerCase().endsWith(".pdf"),
    });
  };
  const closePreview = () => setSelectedDoc(null);

  return (
    <div className="home-bg text-white min-vh-100">
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="text-glow">🛠️ Admin Dashboard</h3>
          <button className="btn btn-glow-green" onClick={logout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="table-responsive card p-3 mb-4">
          <h5 className="text-glow">👥 Users</h5>
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Aadhaar</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((u) => (
                  <tr key={u.userID}>
                    <td>{safe(u.userID)}</td>
                    <td>{safe(u.name)}</td>
                    <td>{safe(u.username)}</td>
                    <td>{safe(u.aadhaarNumber)}</td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={async () => {
                          const ok = await Swal.fire({
                            title: "Confirm Delete",
                            text: `Remove user ${u.name || u.username}?`,
                            icon: "warning",
                            showCancelButton: true,
                          });
                          if (!ok.isConfirmed) return;
                          await api.delete(`/admin/users/${u.userID}`);
                          setUsers((prev) =>
                            prev.filter((x) => x.userID !== u.userID)
                          );
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Remove
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

        {/* DOCUMENTS */}
        <div className="table-responsive card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="text-glow">📄 Documents</h5>
            <button
              className="btn btn-outline-light"
              onClick={() => setShowHistory(!showHistory)}
            >
              <FontAwesomeIcon icon={faHistory} className="me-2" />
              {showHistory ? "Hide History" : "Show History"}
            </button>
          </div>

          <table className="table table-dark table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>File</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingDocuments.length ? (
                pendingDocuments.map((doc) => (
                  <tr key={doc.documentID}>
                    <td>{safe(doc.documentID)}</td>
                    <td>{safe(doc.userName || doc.userID)}</td>
                    <td>{safe(doc.filePath || doc.fileUrl)}</td>
                    <td>
                      <span className="badge bg-warning text-dark">Pending</span>
                    </td>
                    <td>
                      {isPreviewable(doc.filePath || doc.fileUrl) ? (
                        <button
                          className="btn btn-outline-info btn-sm me-2"
                          onClick={() => openPreview(doc)}
                        >
                          <FontAwesomeIcon icon={faEye} /> View
                        </button>
                      ) : (
                        <a
                          href={fileHref(doc)}
                          className="btn btn-outline-secondary btn-sm me-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FontAwesomeIcon icon={faDownload} /> Download
                        </a>
                      )}
                      <button
                        className="btn btn-outline-success btn-sm me-2"
                        onClick={() => approveDoc(doc.documentID)}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Approve
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => rejectDoc(doc.documentID)}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    {loading ? "Loading..." : "No pending documents"}
                  </td>
                </tr>
              )}

              {showHistory &&
                historyDocuments.map((doc) => (
                  <tr key={doc.documentID}>
                    <td>{doc.documentID}</td>
                    <td>{safe(doc.userName || doc.userID)}</td>
                    <td>{safe(doc.filePath || doc.fileUrl)}</td>
                    <td>
                      <span
                        className={`badge ${
                          String(doc.status).toLowerCase() === "approved"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => deleteDoc(doc.documentID)}
                      >
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {selectedDoc && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              background: "rgba(0,0,0,0.7)",
              zIndex: 1050,
            }}
            onClick={closePreview}
          >
            <div
              className="modal-dialog modal-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content bg-dark text-white">
                <div className="modal-header border-0">
                  <h5 className="modal-title text-glow">
                    📄 Preview — {selectedDoc.documentID}
                  </h5>
                  <button className="btn-close" onClick={closePreview}></button>
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
                      alt="Preview"
                      className="img-fluid"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
