// FRONTEND/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DocumentUpload from "./pages/DocumentUpload";
import Report from "./pages/Report";
import ProtectedRoute from "./components/ProtectedRoute";
import AddUser from "./pages/AddUser";
import TrafficLight from "./components/TrafficLight"; // standalone (optional)

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute role="user">
              <DocumentUpload />
            </ProtectedRoute>
          }
        />

        {/* Report page (user‑only, as you had) */}
        <Route
          path="/report/:id"
          element={
            <ProtectedRoute role="user">
              <Report />
            </ProtectedRoute>
          }
        />

        {/* If you want BOTH user and admin to access the same report page, 
            replace the route above with this version:
        <Route
          path="/report/:id"
          element={
            <ProtectedRoute roles={['user', 'admin']}>
              <Report />
            </ProtectedRoute>
          }
        />
        */}

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-user"
          element={
            <ProtectedRoute role="admin">
              <AddUser />
            </ProtectedRoute>
          }
        />

        {/* Optional standalone traffic-light demo page (your separate component).
            Note: The Report page already includes BigTrafficLight with the 12s sequence. */}
        <Route
          path="/traffic-light"
          element={
            <ProtectedRoute role="user">
              <TrafficLight />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;