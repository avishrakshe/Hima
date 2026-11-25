"use client";

/**
 * The hero's 3D scene: an animated *illustration* of a 3-of-5 FROST signing round.
 *
 *  - The glass icosahedron is the group verifying key. Nobody holds it whole.
 *  - Five octahedra on the ring are participants' key shares.
 *  - Each round, three shares "sign": a signature share travels down a beam
 *    into the key. When the threshold (3) is reached, the core flashes brass
 *    and a shockwave marks the aggregated signature.
 *
 * No cryptography runs here. The scene only visualises the protocol.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

import { PLAYERS, THRESHOLD, type CeremonyPhase } from "./ceremony";

const N = PLAYERS.length;
const RING_RADIUS = 2.6;
const KEY_RADIUS = 1.02;
const CYCLE = 7.5; // seconds per round
const SIGN_AT = [0.9, 1.9, 2.9] as const; // when each signer fires
const TRAVEL = 0.55; // seconds for a signature share to reach the key
const COMPLETE_AT = SIGN_AT[THRESHOLD - 1] + TRAVEL;
const RESET_AT = 6.3;

const GLACIER = new THREE.Color("#9fe7d4");
const BRASS = new THREE.Color("#e8b65a");
const SPRUCE = new THREE.Color("#244039");

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

/** Rotate which three players sign each round so every share gets a turn. */
function signersFor(round: number): number[] {
  const k = round % N;
  return [k, (k + 2) % N, (k + 4) % N];
}

type SceneProps = {
  onPhase?: (phase: CeremonyPhase) => void;
  /** Slows everything down for `prefers-reduced-motion`. */
  calm?: boolean;
};

/* ------------------------------------------------------------------ */

function Ring({ onPhase, calm }: SceneProps) {
  const group = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const halos = useRef<(THREE.Mesh | null)[]>([]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const core = useRef<THREE.Mesh>(null);
  const shock = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  const lastPhaseKey = useRef("");

  // Static geometry for each share: position on the ring plus its beam to the key.
  const layout = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const pos = new THREE.Vector3(Math.cos(a) * RING_RADIUS, 0, Math.sin(a) * RING_RADIUS);
      const dir = pos.clone().normalize();
      const start = KEY_RADIUS + 0.05;
      const end = RING_RADIUS - 0.2;
      return {
        pos,
        dir,
        start,
        end,
        beamPos: dir.clone().multiplyScalar((start + end) / 2),
        beamQuat: new THREE.Quaternion().setFromUnitVectors(up, dir),
        beamLen: end - start,
      };
    });
  }, []);

  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.05) * (calm ? 0.5 : 1);
    const t = time.current;
    const round = Math.floor(t / CYCLE);
    const local = t % CYCLE;
    const signers = signersFor(round);
    const fade = local > RESET_AT ? 1 - smooth((local - RESET_AT) / (CYCLE - RESET_AT)) : 1;

    if (group.current) group.current.rotation.y = t * 0.12;

    let arrived = 0;
    for (let i = 0; i < N; i++) {
      const order = signers.indexOf(i);
      const fired = order >= 0 ? local - SIGN_AT[order] : -1;
      const lit = order >= 0 ? smooth(fired / 0.35) * fade : 0;
      const travel = fired / TRAVEL;
      if (order >= 0 && travel >= 1 && local < RESET_AT) arrived++;

      const node = nodes.current[i];
      if (node) {
        const m = node.material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 0.12 + lit * 0.9;
        m.color.copy(SPRUCE).lerp(GLACIER, 0.3 + lit * 0.6);
        node.rotation.y = t * 0.8 + i;
        node.rotation.x = t * 0.5;
        node.scale.setScalar(1 + lit * 0.25);
      }

      const halo = halos.current[i];
      if (halo) {
        (halo.material as THREE.MeshBasicMaterial).opacity = lit * 0.1;
        halo.scale.setScalar(0.6 + lit * 0.5 + Math.sin(t * 4 + i) * 0.04 * lit);
      }

      const beam = beams.current[i];
      if (beam) (beam.material as THREE.MeshBasicMaterial).opacity = 0.07 + lit * 0.5;

      const packet = packets.current[i];
      if (packet) {
        const visible = order >= 0 && travel > 0 && travel < 1;
        packet.visible = visible;
        if (visible) {
          const { dir, start } = layout[i];
          const r = THREE.MathUtils.lerp(RING_RADIUS - 0.15, start, smooth(travel));
          packet.position.copy(dir).multiplyScalar(r);
        }
      }
    }

    const done = smooth((local - COMPLETE_AT) / 0.25) * fade;
    if (core.current) {
      const m = core.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.7 + done * 2.2 + Math.sin(t * 2) * 0.1;
      m.emissive.copy(BRASS);
      core.current.scale.setScalar(1 + done * 0.45);
    }

    if (shock.current) {
      const w = clamp01((local - COMPLETE_AT) / 1.6);
      const active = local >= COMPLETE_AT && local < RESET_AT;
      shock.current.visible = active;
      shock.current.scale.setScalar(1 + smooth(w) * 2.4);
      (shock.current.material as THREE.MeshBasicMaterial).opacity = (1 - w) * 0.55;
    }

    if (onPhase) {
      const complete = local >= COMPLETE_AT && local < RESET_AT;
      const key = `${signers.join("")}:${arrived}:${complete}`;
      if (key !== lastPhaseKey.current) {
        lastPhaseKey.current = key;
        onPhase({ signers, arrived, complete });
      }
    }
  });

  return (
    <group rotation={[0.42, 0, -0.08]}>
      {/* Orbit guides */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS, 0.006, 8, 220]} />
        <meshBasicMaterial color={GLACIER} transparent opacity={0.28} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RING_RADIUS + 0.9, 0.004, 8, 220]} />
        <meshBasicMaterial color={GLACIER} transparent opacity={0.08} />
      </mesh>

      {/* Aggregation shockwave, in the ring plane */}
      <mesh ref={shock} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[KEY_RADIUS + 0.1, KEY_RADIUS + 0.16, 96]} />
        <meshBasicMaterial
          color={BRASS}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* The group key: never held whole by anyone */}
      <Crystal coreRef={core} />

      <group ref={group}>
        {layout.map((l, i) => (
          <group key={PLAYERS[i]}>
            <mesh
              ref={(m) => {
                beams.current[i] = m;
              }}
              position={l.beamPos}
              quaternion={l.beamQuat}
            >
              <cylinderGeometry args={[0.008, 0.008, l.beamLen, 6]} />
              <meshBasicMaterial
                color={GLACIER}
                transparent
                opacity={0.07}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            <mesh
              ref={(m) => {
                nodes.current[i] = m;
              }}
              position={l.pos}
            >
              <octahedronGeometry args={[0.17, 0]} />
              <meshStandardMaterial
                color={GLACIER}
                emissive={GLACIER}
                emissiveIntensity={0.2}
                roughness={0.25}
                metalness={0.3}
                flatShading
              />
            </mesh>

            <mesh
              ref={(m) => {
                halos.current[i] = m;
              }}
              position={l.pos}
            >
              <sphereGeometry args={[0.3, 24, 24]} />
              <meshBasicMaterial
                color={GLACIER}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            <mesh
              ref={(m) => {
                packets.current[i] = m;
              }}
              visible={false}
            >
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshBasicMaterial color="#e9fff8" blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Crystal({ coreRef }: { coreRef: RefObject<THREE.Mesh | null> }) {
  const shell = useRef<THREE.Mesh>(null);
  const cage = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    if (shell.current) {
      shell.current.rotation.y += d * 0.22;
      shell.current.rotation.x += d * 0.08;
    }
    if (cage.current) {
      cage.current.rotation.y -= d * 0.1;
      cage.current.rotation.z += d * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.22, 3]} />
        <meshStandardMaterial color="#1a1206" emissive={BRASS} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      <mesh ref={shell}>
        <icosahedronGeometry args={[KEY_RADIUS, 0]} />
        <meshPhysicalMaterial
          color="#f2fffb"
          transmission={1}
          thickness={0.6}
          roughness={0.04}
          ior={1.45}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          specularIntensity={1}
          attenuationColor="#c9f6ea"
          attenuationDistance={6}
          flatShading
        />
      </mesh>
      <mesh rotation={[0.3, 0.6, 0]}>
        <icosahedronGeometry args={[KEY_RADIUS * 1.001, 0]} />
        <meshBasicMaterial color={GLACIER} wireframe transparent opacity={0.35} />
      </mesh>

      <mesh ref={cage}>
        <icosahedronGeometry args={[KEY_RADIUS + 0.36, 1]} />
        <meshBasicMaterial color={GLACIER} wireframe transparent opacity={0.09} />
      </mesh>
    </group>
  );
}

function FrostDust({ count = 700 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    // Deterministic pseudo-random so server and client agree and reloads look identical.
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.6 + rand() * 6;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += Math.min(delta, 0.05) * 0.015;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={GLACIER}
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Pulls the camera back on narrow/tall canvases so the whole orbit always fits.
 * Visible half-width at distance z is z * tan(fov/2) * aspect; solve for z.
 */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const halfFov = THREE.MathUtils.degToRad(cam.fov / 2);
    const needHalfWidth = RING_RADIUS + 0.85; // ring + node halos + parallax headroom
    const z = needHalfWidth / (Math.tan(halfFov) * aspect);
    cam.position.set(0, 0.35, THREE.MathUtils.clamp(z, 7.2, 12));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** Eases the whole scene toward the cursor for a subtle parallax. */
function Rig({ children, calm }: { children: ReactNode; calm?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 2.5);
    const amp = calm ? 0.08 : 0.3;
    ref.current.rotation.y += (pointer.current.x * amp - ref.current.rotation.y) * k;
    ref.current.rotation.x += (pointer.current.y * amp * 0.5 - ref.current.rotation.x) * k;
  });

  return <group ref={ref}>{children}</group>;
}

export default function CeremonyScene({
  onPhase,
  calm,
  active = true,
}: SceneProps & { active?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 7.6], fov: 36 }}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={null}
      aria-hidden="true"
    >
      <FitCamera />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 5, 3]} intensity={1.3} color="#e6fff8" />
      <pointLight position={[-3.5, -2.5, 2.5]} intensity={18} distance={12} color="#ff7a45" />
      <pointLight position={[3, 1.5, -2]} intensity={10} distance={10} color="#9fe7d4" />

      {/* Local light-formers give the glass something to reflect, with no HDR download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#9fe7d4" position={[0, 4, -6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ff7a45" position={[-6, -1, 2]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
        <Lightformer form="ring" intensity={1.4} color="#eee9df" position={[5, 2, 4]} scale={2.5} />
      </Environment>

      <Rig calm={calm}>
        <Ring onPhase={onPhase} calm={calm} />
        <FrostDust />
      </Rig>
    </Canvas>
  );
}
