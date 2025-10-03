// FRONTEND/src/components/MapView.jsx
import React, { useEffect, useRef } from "react";

export default function MapView({ latitude, longitude, polygonColor = "#16a34a", areaMeters = 60 }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!window.L || !containerRef.current) return;

    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const L = window.L;
    const center = [latitude || 0, longitude || 0];
    const map = L.map(containerRef.current, { center, zoom: 17, attributionControl: false });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    L.marker(center).addTo(map);
    const circle = L.circle(center, { radius: areaMeters, color: polygonColor, weight: 3, fill: false }).addTo(map);

    map.fitBounds(circle.getBounds(), { padding: [20, 20] });

    return () => map.remove();
  }, [latitude, longitude, polygonColor, areaMeters]);

  return <div ref={containerRef} style={{ width: "100%", height: "360px", borderRadius: 8, border: "1px solid #e5e7eb" }} />;
}
