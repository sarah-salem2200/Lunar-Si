import { useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import MoonScene from "./components/MoonScene";
import type { CameraRigHandle } from "./components/MoonScene";
import type { LandingSite } from "./components/Moon";
import "./App.css";

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRigRef = useRef<CameraRigHandle | null>(null);
  const [selectedSite, setSelectedSite] = useState<LandingSite | null>(null);
  const [sitesList, setSitesList] = useState<LandingSite[]>([]);
  const [isPickingMode, setIsPickingMode] = useState<boolean>(false);

  const zoomIn = () => { cameraRigRef.current?.zoomIn(); };
  const zoomOut = () => { cameraRigRef.current?.zoomOut(); };
  
  const resetView = () => {
    cameraRigRef.current?.resetView();
    setSelectedSite(null);
    setIsPickingMode(false);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = Number(e.target.value);
    if (!siteId) {
      setSelectedSite(null);
      return;
    }
    const found = sitesList.find((s) => s.id === siteId) || null;
    setSelectedSite(found);
    setIsPickingMode(false);
  };

  return (
    <main className="moon-app" style={{ cursor: isPickingMode ? "crosshair" : "default" }}>
      <header className="top-bar">
        <div className="logo">LUNAR-SI</div>
        <div className="subtitle">
          INTERACTIVE LUNAR EXPLORATION & AI LANDING NAVIGATOR
        </div>
      </header>

      <section className="moon-view">
        <MoonScene
          controlsRef={controlsRef}
          selectedSite={selectedSite}
          onSelectSite={setSelectedSite}
          rigRef={cameraRigRef}
          onSitesLoaded={setSitesList}
          isPickingMode={isPickingMode}
          onExitPickingMode={() => setIsPickingMode(false)}
        />
      </section>

      {/* Left Sidebar */}
      <aside
        style={{
          position: "absolute",
          top: "80px",
          left: "25px",
          width: "300px",
          background: "rgba(10, 15, 28, 0.88)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(0, 255, 255, 0.35)",
          borderRadius: "12px",
          padding: "16px",
          color: "#ffffff",
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.55)",
          direction: "ltr",
          textAlign: "left"
        }}
      >
        <label
          htmlFor="site-selector"
          style={{
            display: "block",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#00ffff",
            fontWeight: 600,
            marginBottom: "8px"
          }}
        >
          🛰️ Artemis III Candidate Sites (13)
        </label>

        <select
          id="site-selector"
          value={selectedSite?.id && selectedSite.id !== 999 ? selectedSite.id : ""}
          onChange={handleDropdownChange}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(15, 23, 42, 0.95)",
            color: "#f8fafc",
            border: "1px solid rgba(0, 255, 255, 0.4)",
            fontSize: "0.88rem",
            outline: "none",
            cursor: "pointer",
            marginBottom: "12px"
          }}
        >
          <option value="">-- Select a Landing Region --</option>
          {sitesList.map((site) => (
            <option key={site.id} value={site.id}>
              {site.id}. {site.name} ({site.safetyScore}%)
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setIsPickingMode(!isPickingMode);
            setSelectedSite(null);
          }}
          style={{
            width: "100%",
            padding: "10px",
            background: isPickingMode ? "rgba(0, 255, 136, 0.25)" : "rgba(0, 255, 255, 0.15)",
            border: `1px solid ${isPickingMode ? "#00ff88" : "rgba(0, 255, 255, 0.4)"}`,
            borderRadius: "8px",
            color: isPickingMode ? "#00ff88" : "#00ffff",
            fontSize: "0.83rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {isPickingMode ? "📍 Click Anywhere on Moon..." : "📍 Pick Custom Location"}
        </button>

        {selectedSite && (
          <button
            onClick={resetView}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "7px",
              background: "rgba(0, 255, 255, 0.12)",
              border: "1px solid rgba(0, 255, 255, 0.3)",
              borderRadius: "6px",
              color: "#00ffff",
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            ↺ Resume Orbit & Clear Selection
          </button>
        )}
      </aside>

      {/* Right Sidebar */}
      {selectedSite && (
        <aside
          style={{
            position: "absolute",
            top: "80px",
            right: "25px",
            width: "350px",
            background: "rgba(10, 15, 28, 0.88)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0, 255, 255, 0.4)",
            borderRadius: "12px",
            padding: "20px",
            color: "#ffffff",
            zIndex: 100,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            direction: "ltr",
            textAlign: "left"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "#00ffff", fontSize: "1.15rem" }}>
              {selectedSite.name}
            </h3>
            <button
              onClick={() => setSelectedSite(null)}
              style={{ background: "transparent", border: "none", color: "#aaa", fontSize: "1.2rem", cursor: "pointer" }}
              title="Close"
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: "0.83rem", color: "#cbd5e1", lineHeight: "1.4", marginTop: "10px" }}>
            {selectedSite.description}
          </p>

          <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.15)", margin: "12px 0" }} />

          <div style={{ fontSize: "0.83rem", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>🌐 Coordinates:</span>
              <span>Lat: {selectedSite.lat}°, Lon: {selectedSite.lon}°</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>📐 Slope Angle:</span>
              <span>{selectedSite.slope !== null && selectedSite.slope !== undefined ? `${selectedSite.slope}°` : "Not Available"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>☀️ Solar Illumination:</span>
              <span>{selectedSite.illuminationHours !== null && selectedSite.illuminationHours !== undefined ? `${selectedSite.illuminationHours} hrs/day` : "Not Available"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>📡 Earth Link (LOS):</span>
              <span style={{ color: "#38bdf8" }}>{selectedSite.earthLosPercentage !== null && selectedSite.earthLosPercentage !== undefined ? `${selectedSite.earthLosPercentage}% uptime` : "Not Available"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>💧 Nearest Water Ice:</span>
              <span style={{ color: "#38bdf8" }}>{selectedSite.waterIceDistanceKm !== null && selectedSite.waterIceDistanceKm !== undefined ? `~${selectedSite.waterIceDistanceKm} km away` : "Not Available"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <span style={{ color: "#94a3b8" }}>🤖 AI Safety Score:</span>
              <span style={{ color: selectedSite.safetyScore ? "#00ff88" : "#f59e0b", fontWeight: "bold", fontSize: "1.15rem" }}>
                {selectedSite.safetyScore !== null && selectedSite.safetyScore !== undefined ? `${selectedSite.safetyScore}%` : "Not Available"}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              background: "rgba(0, 255, 136, 0.12)",
              borderLeft: "3px solid #00ff88",
              fontSize: "0.78rem",
              borderRadius: "4px",
              color: "#e2e8f0"
            }}
          >
            {selectedSite.recommendation || "Not Available"}
          </div>
        </aside>
      )}

      <div className="moon-toolbar">
        <button onClick={zoomIn} title="Zoom In">+</button>
        <button onClick={zoomOut} title="Zoom Out">−</button>
        <button onClick={resetView} title="Reset View">↺</button>
      </div>

      <div className="instructions">
        {isPickingMode
          ? "🎯 PICKING MODE ACTIVE: CLICK ANYWHERE ON THE MOON SURFACE"
          : "DRAG TO ROTATE · SCROLL TO ZOOM · SELECT OR CLICK MARKERS FOR AI ANALYSIS"}
      </div>
    </main>
  );
}