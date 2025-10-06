import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faUserShield } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Admin shortcut login
    if (username === "admin" && password === "admin") {
      localStorage.setItem("role", "admin");
      navigate("/admin");
      return;
    }

    try {
      const response = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("username", response.data.username);
      navigate("/dashboard");
    } catch {
      setError("Invalid login credentials");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "url('/trustdoc-bg.jpg') no-repeat center center/cover",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        className="p-4 rounded-4 shadow-lg text-white"
        style={{
          width: "25rem",
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 className="text-center mb-4 text-glow">🔐 TrustDoc Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent text-white border-secondary">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                className="form-control bg-transparent text-white border-secondary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent text-white border-secondary">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                className="form-control bg-transparent text-white border-secondary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-glow-green w-100 mb-3">
            Login
          </button>

          <button
            type="button"
            className="btn btn-outline-light w-100 mb-3"
            onClick={() => navigate("/admin")}
          >
            <FontAwesomeIcon icon={faUserShield} className="me-2" />
            Admin Login
          </button>

          <div className="text-center">
            <button
              className="btn btn-link text-decoration-none text-light"
              onClick={() => navigate("/register")}
            >
              New user? Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
