
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import MoonScene from "./components/MoonScene";
import "./App.css";

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const zoomIn = () => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.dollyIn(1.3);
    controls.update();
  };

  const zoomOut = () => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.dollyOut(1.3);
    controls.update();
  };

  const resetView = () => {
    controlsRef.current?.reset();
  };

  return (
    <main className="moon-app">

      <header className="top-bar">
        <div className="logo">LUNAR-SI</div>
        <div className="subtitle">
          INTERACTIVE LUNAR EXPLORATION
        </div>
      </header>

      <section className="moon-view">
        <MoonScene controlsRef={controlsRef} />
      </section>

      <div className="moon-toolbar">
        <button onClick={zoomIn} title="Zoom In">
          +
        </button>

        <button onClick={zoomOut} title="Zoom Out">
          −
        </button>

        <button onClick={resetView} title="Reset View">
          ↺
        </button>
      </div>

      <div className="instructions">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>

    </main>
  );
}
