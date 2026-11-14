
import { OrbitControls } from "@react-three/drei";
import type { Ref } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface MoonControlsProps {
  controlsRef?: Ref<OrbitControlsImpl>;
}

export default function MoonControls({
  controlsRef,
}: MoonControlsProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={2.5}
      maxDistance={15}
      zoomSpeed={0.7}
      rotateSpeed={0.6}
      enableDamping
      dampingFactor={0.05}
    />
  );
}
