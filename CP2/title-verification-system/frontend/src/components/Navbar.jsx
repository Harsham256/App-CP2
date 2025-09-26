import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCog, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
      <span className="navbar-brand fw-bold">🏠 Title Verification</span>

      <div className="ms-auto d-flex align-items-center">
        <button className="btn btn-link text-white me-3">
          <FontAwesomeIcon icon={faBell} size="lg" />
        </button>

        <div className="dropdown">
          <button
            className="btn btn-link text-white dropdown-toggle"
            id="settingsMenu"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <FontAwesomeIcon icon={faCog} size="lg" />
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
