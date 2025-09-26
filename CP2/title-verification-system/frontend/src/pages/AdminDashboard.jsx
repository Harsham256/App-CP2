import React, { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faTrash,
  faEye,
  faClose,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); // for modal preview

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await api.get("/admin/users");
        setUsers(usersRes.data);

        const docsRes = await api.get("/admin/documents");
        setDocuments(docsRes.data);
      } catch (err) {
        console.error("Failed to load admin data", err);
      }
    };
    fetchData();
  }, []);

  const approveDoc = async (id) => {
    const confirmApprove = window.confirm(
      "Are you sure you want to APPROVE this document?"
    );
    if (!confirmApprove) return;

    await api.post(`/admin/documents/${id}/approve`);
    setDocuments((docs) =>
      docs.map((d) =>
        d.documentID === id ? { ...d, status: "Approved" } : d
      )
    );
  };

  const rejectDoc = async (id) => {
    const confirmReject = window.confirm(
      "Are you sure you want to REJECT this document?"
    );
    if (!confirmReject) return;

    await api.post(`/admin/documents/${id}/reject`);
    setDocuments((docs) =>
      docs.map((d) =>
        d.documentID === id ? { ...d, status: "Rejected" } : d
      )
    );
  };

  const removeUser = async (id) => {
    await api.delete(`/admin/users/${id}`);
    setUsers(users.filter((u) => u.userID !== id));
  };

  const openDocument = (doc) => {
    setSelectedDoc({
      ...doc,
      previewUrl: `/api/document/view/${doc.documentID}`, // updated endpoint
    });
  };

  const closeModal = () => {
    setSelectedDoc(null);
  };

  const isPreviewable = (filePath) => {
    const lower = filePath.toLowerCase();
    return lower.endsWith(".pdf") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <h3 className="text-primary mb-3">🛠️ Admin Dashboard</h3>

        {/* Users Table */}
        <h5>👥 Users</h5>
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
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.userID}>
                  <td>{u.userID}</td>
                  <td>{u.name}</td>
                  <td>{u.username}</td>
                  <td>{u.aadhaarNumber}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeUser(u.userID)}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Documents Table */}
        <h5 className="mt-4">📄 Documents</h5>
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>File</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.documentID}>
                  <td>{doc.documentID}</td>
                  <td>{doc.userID}</td>
                  <td>{doc.filePath}</td>
                  <td>{doc.status}</td>
                  <td>
                    {/* View/Download Button */}
                    {isPreviewable(doc.filePath) ? (
                      <button
                        className="btn btn-info btn-sm me-2"
                        onClick={() => openDocument(doc)}
                      >
                        <FontAwesomeIcon icon={faEye} /> View
                      </button>
                    ) : (
                      <a
                        href={`/api/document/view/${doc.documentID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm me-2"
                      >
                        <FontAwesomeIcon icon={faDownload} /> Download
                      </a>
                    )}

                    {/* Approve & Reject only if status is Pending */}
                    {doc.status === "Pending" && (
                      <>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => approveDoc(doc.documentID)}
                        >
                          <FontAwesomeIcon icon={faCheck} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => rejectDoc(doc.documentID)}
                        >
                          <FontAwesomeIcon icon={faTimes} /> Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  No documents uploaded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Preview */}
      {selectedDoc && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Document Preview (ID: {selectedDoc.documentID})
                </h5>
                <button className="btn btn-close" onClick={closeModal}>
                  <FontAwesomeIcon icon={faClose} />
                </button>
              </div>
              <div className="modal-body" style={{ height: "80vh" }}>
                {selectedDoc.filePath.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={selectedDoc.previewUrl}
                    title="PDF Preview"
                    width="100%"
                    height="100%"
                  ></iframe>
                ) : (
                  <img
                    src={selectedDoc.previewUrl}
                    alt="Document Preview"
                    className="img-fluid"
                    style={{
                      maxHeight: "100%",
                      width: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
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
