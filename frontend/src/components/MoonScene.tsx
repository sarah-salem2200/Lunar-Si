
import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

import Moon from "./Moon";
import MoonControls from "./MoonControls";

interface MoonSceneProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
}

export default function MoonScene({ controlsRef }: MoonSceneProps) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 7],
        fov: 45,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#02030a"]} />

      <ambientLight intensity={0.15} />

      <directionalLight
        position={[5, 3, 5]}
        intensity={3}
      />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        fade
      />

      <Moon />

      <MoonControls controlsRef={controlsRef} />
    </Canvas>
  );
}
