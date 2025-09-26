import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Attach userId from localStorage (required by backend)
    const userId = localStorage.getItem("userId");
    if (userId) {
      formData.append("userId", userId);
    }

    try {
      await api.post("/document/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ File uploaded successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setMessage("❌ Upload failed. Try again.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <h3 className="text-primary mb-3">📤 Upload Document</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <input
              type="file"
              className="form-control"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
          </div>
          <button type="submit" className="btn btn-success">
            <FontAwesomeIcon icon={faUpload} className="me-2" />
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocumentUpload;
