import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCircle,
  faCheckCircle,
  faTimesCircle,
  faEnvelopeOpenText,
} from "@fortawesome/free-solid-svg-icons";
import {
  listNotifications,
  unreadCount,
  markAllRead,
  markRead,
  upsertFromDocuments,
} from "../services/notifications.local";

const POLL_MS = 20000; // 20s

const NotificationBell = () => {
  const navigate = useNavigate();
  const userId = useMemo(() => localStorage.getItem("userId"), []);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(listNotifications(userId));
  const [unread, setUnread] = useState(unreadCount(userId));
  const [loading, setLoading] = useState(false);

  const refreshFromDocuments = async () => {
    try {
      setLoading(true);
      const url = userId ? `/document/my?userId=${userId}` : "/document/my";
      const res = await api.get(url);
      const docs = Array.isArray(res.data) ? res.data : [];
      const newItems = upsertFromDocuments(userId, docs);
      setItems(newItems);
      setUnread(unreadCount(userId));
    } catch (e) {
      // silent fail is OK for badge; console for dev
      console.warn("Notif poll failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    refreshFromDocuments();
    // poll
    const id = setInterval(refreshFromDocuments, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const toggleOpen = () => setOpen((v) => !v);

  const onMarkAllRead = () => {
    markAllRead(userId);
    setItems(listNotifications(userId));
    setUnread(0);
  };

  const onItemClick = (n) => {
    markRead(userId, n.id);
    setItems(listNotifications(userId));
    setUnread(unreadCount(userId));

    // If Approved, go to report
    if (String(n.status).toLowerCase() === "approved") {
      navigate(`/report/${n.documentId}`);
    }
  };

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-outline-secondary position-relative"
        onClick={toggleOpen}
        title="Notifications"
      >
        <FontAwesomeIcon icon={faBell} />
        {unread > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.7rem" }}
            aria-label={`${unread} unread notifications`}
          >
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="card shadow position-absolute end-0 mt-2"
          style={{ width: 360, zIndex: 1080 }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="card-header d-flex align-items-center justify-content-between py-2">
            <strong>Recent Messages</strong>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-link btn-sm text-decoration-none"
                onClick={onMarkAllRead}
                disabled={unread === 0}
                title="Mark all as read"
              >
                <FontAwesomeIcon icon={faEnvelopeOpenText} className="me-1" />
                Mark all read
              </button>
              <button
                className="btn btn-link btn-sm text-decoration-none"
                onClick={() => navigate("/notifications")}
                title="View all"
              >
                View all
              </button>
            </div>
          </div>

          <div
            className="list-group list-group-flush"
            style={{ maxHeight: 420, overflowY: "auto" }}
          >
            {loading && (
              <div className="list-group-item small text-muted">Refreshing…</div>
            )}

            {items.length === 0 && !loading && (
              <div className="list-group-item small text-muted">
                No notifications yet.
              </div>
            )}

            {items.slice(0, 8).map((n) => {
              const isUnread = !n.read;
              const statusLower = String(n.status).toLowerCase();
              const isApproved = statusLower === "approved";
              const isRejected = statusLower === "rejected";

              return (
                <button
                  key={n.id}
                  className={`list-group-item list-group-item-action d-flex gap-2 ${
                    isUnread ? "bg-light" : ""
                  }`}
                  onClick={() => onItemClick(n)}
                  title={n.message}
                >
                  <div className="pt-1">
                    {isApproved ? (
                      <FontAwesomeIcon className="text-success" icon={faCheckCircle} />
                    ) : isRejected ? (
                      <FontAwesomeIcon className="text-danger" icon={faTimesCircle} />
                    ) : (
                      <FontAwesomeIcon className="text-secondary" icon={faCircle} />
                    )}
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold">
                      {isApproved ? "Approved" : isRejected ? "Rejected" : "Update"}
                    </div>
                    <div className="small text-muted">
                      Doc #{n.documentId} · {n.fileName}
                    </div>
                    <div className="small">{n.message}</div>
                  </div>
                  {isUnread && (
                    <div className="ms-auto pt-1">
                      <span className="badge bg-primary">New</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
