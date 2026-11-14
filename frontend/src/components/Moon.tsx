
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function Moon() {
  const moonRef = useRef<THREE.Mesh>(null);

  const [colorMap, heightMap] = useTexture([
    "/textures/lroc_color_16bit_srgb_4k.png",
    "/textures/ldem_16_uint.png",
  ]);

  colorMap.colorSpace = THREE.SRGBColorSpace;
  heightMap.colorSpace = THREE.NoColorSpace;

  useFrame((_, delta) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[2, 512, 512]} />

      <meshStandardMaterial
        map={colorMap}
        displacementMap={heightMap}
        displacementScale={0.015}
        displacementBias={-0.0075}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}
