import { useEffect, useState, useRef } from "react";
import { getNotifications, clearNotifications } from "./api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function load() {
      getNotifications().then(setItems).catch((e) => console.error(e));
    }
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  // Dismiss on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleClear() {
    await clearNotifications();
    setItems([]);
  }

  return (
    <div className="notifications-container" ref={containerRef}>
      <button
        className="notifications-trigger-btn"
        onClick={() => setOpen(!open)}
        title="Notifications"
        aria-label="Toggle notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {items.length > 0 && (
          <span className="notifications-badge">
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h4>Notifications</h4>
            {items.length > 0 && (
              <button className="clear-btn" onClick={handleClear}>
                Clear all
              </button>
            )}
          </div>

          <div className="notifications-list">
            {items.length === 0 ? (
              <div className="notifications-empty">
                <span className="empty-icon">🔔</span>
                <p>All caught up!</p>
                <small>No new notifications</small>
              </div>
            ) : (
              items.map((n, i) => (
                <div key={i} className="notification-item">
                  <div className="notification-dot"></div>
                  <div className="notification-text">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
