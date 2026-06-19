import React from "react";
import ReactDOM from "react-dom/client";

// Sprint 0's only job here: prove the frontend builds and renders
// something in the browser, and can successfully call the backend's
// /health endpoint. No real UI (gigs, profiles, forms) yet.

function App() {
  const [status, setStatus] = React.useState("checking...");

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("backend unreachable"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>NexGiG</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
