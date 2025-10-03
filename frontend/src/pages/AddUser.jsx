// File: src/pages/AddUser.jsx
import React, { useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faArrowLeft, faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    aadhaarNumber: "",
    address: "",
    role: "User"
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFileChange = (e) => setFile(e.target.files?.[0] ?? null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email || undefined,
        password: form.password,
        aadhaarNumber: form.aadhaarNumber,
        address: form.address || undefined,
        role: form.role || undefined
      };

      // 1) Create user
      const { data: created } = await api.post("/admin/users", payload);

      // 2) Optional document upload
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("userId", created.userID);
        await api.post("/document/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // 3) Back to dashboard
      navigate("/admin");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Failed to create user";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="text-primary">➕ Add User</h3>
          <button className="btn btn-outline-secondary" onClick={() => navigate("/admin")}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="card p-3" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Name</label>
              <input className="form-control" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Username</label>
              <input className="form-control" name="username" value={form.username} onChange={onChange} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email (optional)</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" name="password" value={form.password} onChange={onChange} required minLength={6} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Aadhaar Number (12 digits)</label>
              <input className="form-control" name="aadhaarNumber" value={form.aadhaarNumber} onChange={onChange} required maxLength={12} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Role</label>
              <select className="form-select" name="role" value={form.role} onChange={onChange}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <input className="form-control" name="address" value={form.address} onChange={onChange} />
            </div>
            <div className="col-12">
              <label className="form-label">KYC / Document (optional)</label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="form-control" onChange={onFileChange} />
              <small className="text-muted">
                <FontAwesomeIcon icon={faFileUpload} /> PDF/JPG/PNG
              </small>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-success" type="submit" disabled={saving}>
              <FontAwesomeIcon icon={faSave} /> {saving ? "Saving..." : "Save User"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;