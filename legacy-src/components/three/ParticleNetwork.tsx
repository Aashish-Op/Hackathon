"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 150;
const CONNECTION_DISTANCE = 2.5;

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { positions, colors, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);

    const safeColor = new THREE.Color("#10B981");
    const riskColor = new THREE.Color("#F59E0B");
    const dangerColor = new THREE.Color("#F43F5E");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 12;
      pos[i3 + 1] = (Math.random() - 0.5) * 8;
      pos[i3 + 2] = (Math.random() - 0.5) * 6;

      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.002;

      const rand = Math.random();
      const color = rand < 0.45 ? safeColor : rand < 0.75 ? riskColor : dangerColor;
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
    }

    return { positions: pos, colors: col, velocities: vel };
  }, []);

  const linePositions = useMemo(
    () => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6),
    []
  );
  const lineColors = useMemo(
    () => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6),
    []
  );

  useFrame((state) => {
    if (!meshRef.current || !linesRef.current) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      positions[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.1) * 0.001;
      positions[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.15) * 0.001;
      positions[i3 + 2] += velocities[i3 + 2];

      for (let axis = 0; axis < 3; axis++) {
        const bound = axis === 2 ? 3 : axis === 1 ? 4 : 6;
        if (Math.abs(positions[i3 + axis]) > bound) {
          velocities[i3 + axis] *= -1;
        }
      }

      dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      const scale = 0.04 + Math.sin(time * 1.5 + i) * 0.01;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    let lineIndex = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = positions[i3] - positions[j3];
        const dy = positions[i3 + 1] - positions[j3 + 1];
        const dz = positions[i3 + 2] - positions[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE;
          const li = lineIndex * 6;

          linePositions[li] = positions[i3];
          linePositions[li + 1] = positions[i3 + 1];
          linePositions[li + 2] = positions[i3 + 2];
          linePositions[li + 3] = positions[j3];
          linePositions[li + 4] = positions[j3 + 1];
          linePositions[li + 5] = positions[j3 + 2];

          const midR = (colors[i3] + colors[j3]) * 0.5 * alpha;
          const midG = (colors[i3 + 1] + colors[j3 + 1]) * 0.5 * alpha;
          const midB = (colors[i3 + 2] + colors[j3 + 2]) * 0.5 * alpha;

          lineColors[li] = midR;
          lineColors[li + 1] = midG;
          lineColors[li + 2] = midB;
          lineColors[li + 3] = midR;
          lineColors[li + 4] = midG;
          lineColors[li + 5] = midB;

          lineIndex++;
        }
      }
    }

    const lineGeom = linesRef.current.geometry;
    lineGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions.slice(0, lineIndex * 6), 3)
    );
    lineGeom.setAttribute(
      "color",
      new THREE.BufferAttribute(lineColors.slice(0, lineIndex * 6), 3)
    );
    lineGeom.attributes.position.needsUpdate = true;
    lineGeom.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#818CF8" transparent opacity={0.8} />
      </instancedMesh>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial vertexColors transparent opacity={0.25} />
      </lineSegments>
    </>
  );
}

export function ParticleNetwork() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
        gl={{ antialias: false, alpha: true }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
