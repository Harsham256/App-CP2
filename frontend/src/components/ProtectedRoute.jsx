// FRONTEND/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Usage:
 *  <ProtectedRoute>...children...</ProtectedRoute>                   // any authenticated role
 *  <ProtectedRoute role="user">...children...</ProtectedRoute>       // single role
 *  <ProtectedRoute roles={['user','admin']}>...children...</ProtectedRoute> // multiple roles
 */
const normalize = (s) => (s ?? "").toString().trim().toLowerCase();

const ProtectedRoute = ({ children, role, roles }) => {
  const token = localStorage.getItem("token");
  const userRole = normalize(localStorage.getItem("role"));
  const location = useLocation();

  // Must have token
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Single or multiple roles
  const allowed = roles?.map(normalize) ?? (role ? [normalize(role)] : []);
  if (allowed.length > 0 && !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
