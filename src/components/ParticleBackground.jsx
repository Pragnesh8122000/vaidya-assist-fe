import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField({ mousePosition }) {
  const ref = useRef();
  const particleCount = 150;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, mousePosition.y * 0.3, 0.02);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mousePosition.x * 0.3, 0.02);
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#42A5F5"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function ConnectionLines({ mousePosition }) {
  const lineRef = useRef();

  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.x = THREE.MathUtils.lerp(lineRef.current.rotation.x, mousePosition.y * 0.2, 0.02);
      lineRef.current.rotation.y = THREE.MathUtils.lerp(lineRef.current.rotation.y, mousePosition.x * 0.2, 0.02);
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={6}
          array={new Float32Array([
            -5, -5, 0,
            5, 5, 0,
            -5, 5, 0,
            5, -5, 0,
            0, -5, 0,
            0, 5, 0,
          ])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#1565C0" opacity={0.15} transparent />
    </line>
  );
}

export default function ParticleBackground({ mousePosition = { x: 0, y: 0 } }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <ParticleField mousePosition={mousePosition} />
      <ConnectionLines mousePosition={mousePosition} />
    </Canvas>
  );
}
