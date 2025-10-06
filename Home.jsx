import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "../Home.css"; // ✅ fixed import path

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1200 });
  }, []);

  return (
    <div className="home-bg d-flex flex-column">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent px-4 py-3">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-glow fs-3">
            🛡️ TrustDoc
          </span>
          <div className="d-flex ms-auto gap-3">
            <button
              className="btn btn-outline-light px-4 fw-semibold"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="btn btn-light text-dark px-4 fw-semibold"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="container text-center text-white flex-grow-1 d-flex flex-column justify-content-center align-items-center">
        <h1
          className="display-3 fw-bold animate__animated animate__fadeInDown mb-3"
          data-aos="fade-up"
        >
          We are <span className="text-glow">TrustDoc</span>
        </h1>
        <div style={{ height: "10px" }}></div> 

        <button
         className="btn btn-xxl btn-glow-green fw-bold mt-3"

          onClick={() => navigate("/login")}
        >
           Verify Your Doc Now
        </button>

        <div style={{ height: "30px" }}></div>  

        <div style={{ height: "48px" }}></div>  
        <p
          className="lead mb-4 w-75 mx-auto animate__animated animate__fadeInUp"
          data-aos="fade-up"
        >
          Your smart and secure document verification companion — ensuring authenticity,
          integrity, and trust in every record you verify.
        </p>

      </div>

      {/* FOOTER */}
      <footer className="text-center text-white py-3 bg-transparent border-top border-light">
        <p className="mb-0 small">© 2025 TrustDoc. Built for trust, powered by technology.</p>
      </footer>
    </div>
  );
};

export default Home;