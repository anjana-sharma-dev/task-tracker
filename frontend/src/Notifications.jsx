import { useEffect, useState } from "react";
import { getNotifications, clearNotifications } from "./api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function load() {
      getNotifications().then(setItems).catch((e) => console.error(e));
    }
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  async function handleClear() {
    await clearNotifications();
    setItems([]);
  }

  return (
    <span style={{ position: "relative", marginRight: 12 }}>
      <button onClick={() => setOpen(!open)}>Notifications ({items.length})</button>
      {open && (
        <div style={{ position: "absolute", right: 0, background: "white", border: "1px solid #ddd", padding: 8, minWidth: 240, zIndex: 10 }}>
          {items.length === 0 && <div>No notifications</div>}
          {items.map((n, i) => (
            <div key={i} style={{ marginBottom: 6 }}>{n.message}</div>
          ))}
          {items.length > 0 && <button onClick={handleClear}>Clear all</button>}
        </div>
      )}
    </span>
  );
}