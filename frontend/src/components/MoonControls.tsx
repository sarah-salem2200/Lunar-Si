import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";

interface MoonControlsProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}

export default function MoonControls({ controlsRef }: MoonControlsProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      minDistance={2.3}
      maxDistance={12}
      enableDamping={true}    
      dampingFactor={0.05}   
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  );
}