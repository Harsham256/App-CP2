// src/pages/Report.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Navbar from "../components/Navbar";

const Report = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/report/${id}`);
        setReport(response.data);
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <p className="text-center mt-5">Loading report...</p>;
  if (!report) return <p className="text-center mt-5">❌ Report not found</p>;

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <h3 className="text-primary mb-3">📑 Verification Report</h3>

        <div className="card shadow-sm p-3 mb-4">
          <h5>Details</h5>
          <p><b>Name:</b> {report.name}</p>
          <p><b>Land ID:</b> {report.landId}</p>
          <p><b>Address:</b> {report.address}</p>
          <p><b>Status:</b> {report.trafficLightStatus}</p>
        </div>

        <h5>Condition Checks</h5>
        <ul className="list-group mb-3">
          {report.conditionResults &&
            Object.entries(report.conditionResults).map(([key, value]) => (
              <li
                key={key}
                className={`list-group-item ${
                  value === "Green"
                    ? "list-group-item-success"
                    : value === "Red"
                    ? "list-group-item-danger"
                    : "list-group-item-warning"
                }`}
              >
                {key}: {value}
              </li>
            ))}
        </ul>

        <h5>📍 Map</h5>
        <iframe
          title="land-map"
          width="100%"
          height="400"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude-0.01},${report.latitude-0.01},${report.longitude+0.01},${report.latitude+0.01}&layer=mapnik&marker=${report.latitude},${report.longitude}`}
        />
      </div>
    </div>
  );
};

export default Report;
