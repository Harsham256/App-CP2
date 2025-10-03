import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Admin shortcut login (local dev)
    if (username === "admin" && password === "admin") {
      localStorage.setItem("role", "admin");
      // Note: we don't set token here because real admin user exists in DB seeded with "Admin@123"
      navigate("/admin");
      return;
    }

    try {
      // send Username and Password (backend expects Username)
      const response = await api.post("/auth/login", {
        username, // JSON will be case-insensitive mapped to Username in C#
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("username", response.data.username);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid login credentials");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4" style={{ width: "25rem" }}>
        <h3 className="text-center text-primary mb-3">🔐 Login</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            className="btn btn-link text-decoration-none"
            onClick={() => navigate("/register")}
          >
            New user? Register here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
