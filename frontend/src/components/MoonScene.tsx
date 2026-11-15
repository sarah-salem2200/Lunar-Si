import { useEffect, useRef, useImperativeHandle } from "react";
import type { RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

import Moon, { latLonToVector3 } from "./Moon";
import type { LandingSite } from "./Moon";
import MoonControls from "./MoonControls";

export interface CameraRigHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface CameraRigProps {
  selectedSite: LandingSite | null;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  moonGroupRef: RefObject<THREE.Group | null>;
  rigRef: RefObject<CameraRigHandle | null>;
}

function CameraRig({ selectedSite, controlsRef, moonGroupRef, rigRef }: CameraRigProps) {
  const { camera } = useThree();
  const targetDistanceRef = useRef(7);
  const isSiteTargetRef = useRef(false);

  useEffect(() => {
    if (selectedSite && moonGroupRef.current) {
      targetDistanceRef.current = 3.6;
      isSiteTargetRef.current = true;
    }
  }, [selectedSite, moonGroupRef]);

  useImperativeHandle(rigRef, () => ({
    zoomIn: () => {
      targetDistanceRef.current = Math.max(2.3, targetDistanceRef.current - 0.9);
      isSiteTargetRef.current = false;
    },
    zoomOut: () => {
      targetDistanceRef.current = Math.min(12, targetDistanceRef.current + 0.9);
      isSiteTargetRef.current = false;
    },
    resetView: () => {
      targetDistanceRef.current = 7;
      isSiteTargetRef.current = false;
    }
  }));

  useFrame((_, delta) => {
    if (controlsRef.current) {
      const controls = controlsRef.current;

      if (selectedSite && isSiteTargetRef.current && moonGroupRef.current) {
        const localPos = latLonToVector3(selectedSite.lat, selectedSite.lon, 2, 0.03);
        moonGroupRef.current.updateMatrixWorld();
        const worldPos = localPos.clone().applyMatrix4(moonGroupRef.current.matrixWorld);

        const dir = worldPos.clone().normalize();
        const idealCamPos = dir.multiplyScalar(targetDistanceRef.current);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, idealCamPos.x, 3.0, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, idealCamPos.y, 3.0, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, idealCamPos.z, 3.0, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, 0, 3.0, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, 0, 3.0, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, 0, 3.0, delta);
      } else {
        const currentDir = camera.position.clone().normalize();
        const idealCamPos = currentDir.multiplyScalar(targetDistanceRef.current);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, idealCamPos.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, idealCamPos.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, idealCamPos.z, 3.5, delta);
      }

      controls.update();
    }
  });

  return null;
}

interface MoonSceneProps {
  controlsRef: RefObject<OrbitControlsImpl | null>;
  selectedSite: LandingSite | null;
  onSelectSite?: (site: LandingSite) => void;
  rigRef: RefObject<CameraRigHandle | null>;
  onSitesLoaded?: (sites: LandingSite[]) => void;
}

export default function MoonScene({
  controlsRef,
  selectedSite,
  onSelectSite,
  rigRef,
  onSitesLoaded
}: MoonSceneProps) {
  const moonGroupRef = useRef<THREE.Group | null>(null);

  return (
    <Canvas
      camera={{
        position: [0, 0, 7],
        fov: 45,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#02030a"]} />

      <ambientLight intensity={0.2} />

      <directionalLight
        position={[5, -3, 5]}
        intensity={3}
      />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        fade
      />

      <Moon
        selectedSite={selectedSite}
        onSelectSite={onSelectSite}
        moonGroupRef={moonGroupRef}
        onSitesLoaded={onSitesLoaded}
      />

      <CameraRig
        selectedSite={selectedSite}
        controlsRef={controlsRef}
        moonGroupRef={moonGroupRef}
        rigRef={rigRef}
      />

      <MoonControls controlsRef={controlsRef} />
    </Canvas>
  );
}