import {
  useEffect,
  useMemo,
  useRef,
  useState
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
const EXAGGERATION = 1.0;
const SEGMENTS_WIDTH = 1024;
const SEGMENTS_HEIGHT = 512;

// =====================================================
// INTERFACE
// =====================================================

export interface LandingSite {
  id: number;
  name: string;
  lat: number;
  lon: number;
  slope: number;
  illuminationHours: number;
  commsQuality: number;
  earthLosPercentage: number;
  waterIceDistanceKm: number;
  description: string;
  safetyScore?: number;
  recommendation?: string;
}

export function latLonToVector3(lat: number, lon: number, radius: number = RADIUS, alt: number = 0.03): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = radius + alt;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = (r * Math.sin(phi) * Math.sin(theta));
  const y = (r * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}

// =====================================================
// CINEMATIC RIPPLE WAVE MARKER COMPONENT
// =====================================================

interface LandingMarkerProps {
  site: LandingSite;
  isSelected: boolean;
  onSelect: (site: LandingSite) => void;
}

function LandingMarker({ site, isSelected, onSelect }: LandingMarkerProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const position = useMemo(() => latLonToVector3(site.lat, site.lon, RADIUS, 0.03), [site]);

  const rotation = useMemo(() => {
    const normal = position.clone().normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [position]);

  useFrame(({ clock }) => {
    if (ringRef.current && materialRef.current) {
      const elapsedTime = clock.getElapsedTime();
      const speed = isSelected ? 2.6 : 1.8;
      const progress = (elapsedTime * speed + site.id * 0.5) % 2;
      
      const scale = (isSelected ? 0.7 : 0.5) + progress * 0.85;
      ringRef.current.scale.set(scale, scale, scale);

      const opacity = Math.max(0, 1 - progress / 1.8);
      materialRef.current.opacity = opacity;
    }
  });

  const markerColor = isSelected ? "#00ff88" : "#00ffff";

  return (
    <group position={position} rotation={rotation}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(site);
        }}
      >
        <sphereGeometry args={[isSelected ? 0.024 : 0.018, 16, 16]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>

      <mesh
        ref={ringRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(site);
        }}
      >
        <ringGeometry args={[0.02, 0.0235, 32]} />
        <meshBasicMaterial
          ref={materialRef}
          color={markerColor}
          side={THREE.DoubleSide}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  );
}

// =====================================================
// ELEVATION LOADER
// =====================================================

let elevationPromise: Promise<Uint16Array> | null = null;

function loadElevation(): Promise<Uint16Array> {
  if (!elevationPromise) {
    elevationPromise = fetch("/textures/ldem_2048x1024_uint16.bin")
      .then((response) => {
        if (!response.ok) throw new Error(`Elevation HTTP error: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const expectedSize = WIDTH * HEIGHT * 2;
        if (buffer.byteLength !== expectedSize) throw new Error(`Invalid elevation file size: ${buffer.byteLength}`);
        const view = new DataView(buffer);
        const elevation = new Uint16Array(WIDTH * HEIGHT);
        for (let i = 0; i < elevation.length; i++) {
          elevation[i] = view.getUint16(i * 2, true);
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

function sampleElevation(data: Uint16Array, u: number, v: number, northAverage: number, southAverage: number): number {
  const x = (((u % 1) + 1) % 1) * WIDTH;
  const y = THREE.MathUtils.clamp((1 - v) * (HEIGHT - 1), 0, HEIGHT - 1);
  if (v >= 0.999999) return northAverage;
  if (v <= 0.000001) return southAverage;

  const x0 = Math.floor(x);
  const x1 = (x0 + 1) % WIDTH;
  const y0 = Math.floor(y);
  const y1 = Math.min(y0 + 1, HEIGHT - 1);
  const fx = x - x0;
  const fy = y - y0;

  const a = data[y0 * WIDTH + x0];
  const b = data[y0 * WIDTH + x1];
  const c = data[y1 * WIDTH + x0];
  const d = data[y1 * WIDTH + x1];

  const top = a * (1 - fx) + b * fx;
  const bottom = c * (1 - fx) + d * fx;
  return top * (1 - fy) + bottom * fy;
}

// =====================================================
// MOON COMPONENT
// =====================================================

interface MoonProps {
  selectedSite: LandingSite | null;
  onSelectSite?: (site: LandingSite) => void;
  moonGroupRef: React.RefObject<THREE.Group | null>;
  onSitesLoaded?: (sites: LandingSite[]) => void;
}

export default function Moon({ selectedSite, onSelectSite, moonGroupRef, onSitesLoaded }: MoonProps) {
  const [sites, setSites] = useState<LandingSite[]>([]);
  const colorMap = useTexture("/textures/lroc_color_16bit_srgb_4k.png");

  // جلب البيانات من سيرفر بايثون FastAPI
  useEffect(() => {
    fetch("http://localhost:8000/api/sites")
      .then((res) => res.json())
      .then((data) => {
        setSites(data);
        if (onSitesLoaded) onSitesLoaded(data);
      })
      .catch((err) => console.error("Failed to fetch landing sites from FastAPI:", err));
  }, [onSitesLoaded]);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(RADIUS, SEGMENTS_WIDTH, SEGMENTS_HEIGHT);
  }, []);

  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
    colorMap.needsUpdate = true;
  }, [colorMap]);

  useEffect(() => {
    let cancelled = false;
    async function buildTerrain() {
      try {
        const elevation = await loadElevation();
        if (cancelled) return;

        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;

        let northSum = 0;
        let southSum =0;
        for (let x = 0; x < WIDTH; x++) {
          northSum += elevation[x];
          southSum += elevation[(HEIGHT - 1) * WIDTH + x];
        }
        const northAverage = northSum / WIDTH;
        const southAverage = southSum / WIDTH;

        for (let i = 0; i < positions.count; i++) {
          const u = uvs.getX(i);
          const v = uvs.getY(i);
          const raw = sampleElevation(elevation, u, v, northAverage, southAverage);
          const meters = (raw - 20000) * 0.5;

          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);

          const displacement = (meters / MOON_RADIUS_METERS) * RADIUS * EXAGGERATION;
          const scale = (RADIUS + displacement) / RADIUS;

          positions.setXYZ(i, x * scale, y * scale, z * scale);
        }

        if (cancelled) return;
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
      } catch (error) {
        console.error("MOON TERRAIN ERROR:", error);
      }
    }

    buildTerrain();
    return () => { cancelled = true; };
  }, [geometry]);

  useFrame((_, delta) => {
    if (moonGroupRef.current && !selectedSite) {
      moonGroupRef.current.rotation.y += delta * 0.010;
    }
  });

  return (
    <group ref={moonGroupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={colorMap} roughness={1} metalness={0} />
      </mesh>

      {sites.map((site) => (
        <LandingMarker
          key={site.id}
          site={site}
          isSelected={selectedSite?.id === site.id}
          onSelect={(s) => {
            if (onSelectSite) onSelectSite(s);
          }}
        />
      ))}
    </group>
  );
}