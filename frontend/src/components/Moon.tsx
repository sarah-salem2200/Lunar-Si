
import {
  useEffect,
  useMemo,
  useRef
} from "react";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

import * as THREE from "three";


// =====================================================
// MOON CONFIGURATION
// =====================================================

const RADIUS = 2;

const MOON_RADIUS_METERS = 1737400;

const WIDTH = 2048;
const HEIGHT = 1024;

// Start with realistic 1:1 elevation scale
const EXAGGERATION = 1.0;

// Geometry resolution
const SEGMENTS_WIDTH = 1024;
const SEGMENTS_HEIGHT = 512;


// =====================================================
// ELEVATION LOADER
// =====================================================

let elevationPromise: Promise<Uint16Array> | null = null;

function loadElevation(): Promise<Uint16Array> {

  if (!elevationPromise) {

    elevationPromise = fetch(
      "/textures/ldem_2048x1024_uint16.bin"
    )
      .then((response) => {

        if (!response.ok) {
          throw new Error(
            `Elevation HTTP error: ${response.status}`
          );
        }

        return response.arrayBuffer();
      })
      .then((buffer) => {

        const expectedSize = WIDTH * HEIGHT * 2;

        if (buffer.byteLength !== expectedSize) {
          throw new Error(
            `Invalid elevation file size: ${buffer.byteLength}`
          );
        }

        // Python exports little-endian uint16
        const view = new DataView(buffer);

        const elevation = new Uint16Array(
          WIDTH * HEIGHT
        );

        for (let i = 0; i < elevation.length; i++) {
          elevation[i] = view.getUint16(
            i * 2,
            true
          );
        }

        return elevation;
      })
      .catch((error) => {

        elevationPromise = null;

        throw error;
      });
  }

  return elevationPromise;
}


// =====================================================
// BILINEAR ELEVATION SAMPLING
// =====================================================

function sampleElevation(
  data: Uint16Array,
  u: number,
  v: number,
  northAverage: number,
  southAverage: number
): number {

  // Normalize longitude
  const x =
    (((u % 1) + 1) % 1) * WIDTH;

  // Convert UV coordinates to image coordinates
  const y = THREE.MathUtils.clamp(
    (1 - v) * (HEIGHT - 1),
    0,
    HEIGHT - 1
  );

  // Prevent different elevations at identical poles
  if (v >= 0.999999) {
    return northAverage;
  }

  if (v <= 0.000001) {
    return southAverage;
  }

  const x0 = Math.floor(x);

  const x1 = (x0 + 1) % WIDTH;

  const y0 = Math.floor(y);

  const y1 = Math.min(
    y0 + 1,
    HEIGHT - 1
  );

  const fx = x - x0;

  const fy = y - y0;

  const a = data[y0 * WIDTH + x0];

  const b = data[y0 * WIDTH + x1];

  const c = data[y1 * WIDTH + x0];

  const d = data[y1 * WIDTH + x1];

  const top =
    a * (1 - fx) +
    b * fx;

  const bottom =
    c * (1 - fx) +
    d * fx;

  return (
    top * (1 - fy) +
    bottom * fy
  );
}


// =====================================================
// MOON COMPONENT
// =====================================================

export default function Moon() {

  const moonRef = useRef<THREE.Mesh>(null);

  // Load lunar color texture
  const colorMap = useTexture(
    "/textures/lroc_color_16bit_srgb_4k.png"
  );

  // Create geometry once
  const geometry = useMemo(() => {

    return new THREE.SphereGeometry(
      RADIUS,
      SEGMENTS_WIDTH,
      SEGMENTS_HEIGHT
    );

  }, []);


  // Texture configuration
  useMemo(() => {

    colorMap.colorSpace = THREE.SRGBColorSpace;

    colorMap.anisotropy = 8;

    colorMap.needsUpdate = true;

  }, [colorMap]);


  // ===================================================
  // BUILD LUNAR TERRAIN
  // ===================================================

  useEffect(() => {

    let cancelled = false;

    async function buildTerrain() {

      try {

        console.log(
          "Loading lunar elevation..."
        );

        const elevation = await loadElevation();

        if (cancelled) return;

        console.log(
          "Building lunar terrain..."
        );


        const positions =
          geometry.attributes.position;

        const uvs =
          geometry.attributes.uv;


        // -----------------------------------------------
        // Calculate polar average elevations
        // -----------------------------------------------

        let northSum = 0;

        let southSum = 0;

        for (let x = 0; x < WIDTH; x++) {

          northSum += elevation[x];

          southSum += elevation[
            (HEIGHT - 1) * WIDTH + x
          ];
        }

        const northAverage =
          northSum / WIDTH;

        const southAverage =
          southSum / WIDTH;


        // -----------------------------------------------
        // Apply elevation displacement
        // -----------------------------------------------

        let minElevation = Infinity;

        let maxElevation = -Infinity;

        for (
          let i = 0;
          i < positions.count;
          i++
        ) {

          const u = uvs.getX(i);

          const v = uvs.getY(i);


          const raw = sampleElevation(
            elevation,
            u,
            v,
            northAverage,
            southAverage
          );


          // NASA LDEM encoding
          const meters =
            (raw - 20000) * 0.5;


          minElevation = Math.min(
            minElevation,
            meters
          );

          maxElevation = Math.max(
            maxElevation,
            meters
          );


          // ---------------------------------------------
          // Calculate radial displacement
          // ---------------------------------------------

          const x = positions.getX(i);

          const y = positions.getY(i);

          const z = positions.getZ(i);


          const displacement =
            (
              meters /
              MOON_RADIUS_METERS
            ) *
            RADIUS *
            EXAGGERATION;


          const scale =
            (
              RADIUS + displacement
            ) / RADIUS;


          positions.setXYZ(
            i,
            x * scale,
            y * scale,
            z * scale
          );
        }


        if (cancelled) return;


        // -----------------------------------------------
        // Update geometry
        // -----------------------------------------------

        positions.needsUpdate = true;

        geometry.computeVertexNormals();

        geometry.computeBoundingSphere();


        console.log(
          "MOON TERRAIN READY",
          {
            minElevation,
            maxElevation,
            northAverage,
            southAverage,
            vertices: positions.count,
            exaggeration: EXAGGERATION
          }
        );

      } catch (error) {

        console.error(
          "MOON TERRAIN ERROR:",
          error
        );
      }
    }


    buildTerrain();


    return () => {

      cancelled = true;

    };

  }, [geometry]);


  // ===================================================
  // ROTATION
  // ===================================================

  useFrame((_, delta) => {

    if (moonRef.current) {

      moonRef.current.rotation.y +=
        delta * 0.025;

    }

  });


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <mesh
      ref={moonRef}
      geometry={geometry}
    >

      <meshStandardMaterial
        map={colorMap}
        roughness={1}
        metalness={0}
      />

    </mesh>

  );
}
