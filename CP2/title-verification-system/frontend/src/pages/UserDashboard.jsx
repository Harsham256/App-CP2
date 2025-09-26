import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload, faCheckCircle, faTimesCircle, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";

const UserDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const url = userId ? `/document/my?userId=${userId}` : "/document/my";
        const response = await api.get(url);
        setDocuments(response.data);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    };
    fetchDocuments();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return <span className="badge bg-success"><FontAwesomeIcon icon={faCheckCircle} /> Approved</span>;
      case "Rejected":
        return <span className="badge bg-danger"><FontAwesomeIcon icon={faTimesCircle} /> Rejected</span>;
      default:
        return <span className="badge bg-warning text-dark"><FontAwesomeIcon icon={faHourglassHalf} /> Pending</span>;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <h3 className="mb-4 text-primary">👤 User Dashboard</h3>

        <div className="mb-3">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/upload")}
          >
            <FontAwesomeIcon icon={faFileUpload} className="me-2" />
            Apply Document for Verification
          </button>
        </div>

        <h5>📂 My Documents</h5>
        <table className="table table-bordered table-hover mt-2">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>File</th>
              <th>Status</th>
              <th>Uploaded At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.documentID}>
                  <td>{doc.documentID}</td>
                  <td>{doc.filePath}</td>
                  <td>{getStatusBadge(doc.status)}</td>
                  <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                  <td>
                    {doc.status === "Approved" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => navigate(`/report/${doc.documentID}`)}
                      >
                        View Report
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDashboard;
