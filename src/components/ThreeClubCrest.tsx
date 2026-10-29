import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export const ThreeClubCrest: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // PBR Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFCAF45, 2.5);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xDD2A7B, 2.0);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    // Composite 3-12 Part Procedural Model: Nexus Royal Crest
    const crestGroup = new THREE.Group();

    // 1. Primary Outer Beveled Ring
    const torusGeo = new THREE.TorusGeometry(2.2, 0.12, 16, 64);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xDD2A7B,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x441122,
      emissiveIntensity: 0.2
    });
    const outerRing = new THREE.Mesh(torusGeo, goldMaterial);
    crestGroup.add(outerRing);

    // 2. Secondary Inner Octagon Frame
    const ringGeo = new THREE.RingGeometry(1.6, 1.85, 8);
    const innerFrameMat = new THREE.MeshStandardMaterial({
      color: 0x8134AF,
      metalness: 0.8,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const innerFrame = new THREE.Mesh(ringGeo, innerFrameMat);
    crestGroup.add(innerFrame);

    // 3. Faceted Core Gem (Icosahedron)
    const gemGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xDD2A7B,
      metalness: 0.15,
      roughness: 0.1,
      transmission: 0.7,
      opacity: 0.95,
      transparent: true,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const centerGem = new THREE.Mesh(gemGeo, gemMat);
    crestGroup.add(centerGem);

    // 4. Floating Orbital Satellite Nodes (Accent Parts)
    const nodeCount = 6;
    const nodeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xFCAF45,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFCAF45,
      emissiveIntensity: 0.4
    });

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0);
      crestGroup.add(node);
    }

    // 5. Star Core Accent (Octahedron inside Gem)
    const starGeo = new THREE.OctahedronGeometry(0.5, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.9
    });
    const starCore = new THREE.Mesh(starGeo, starMat);
    crestGroup.add(starCore);

    scene.add(crestGroup);

    // Interactive pointer damping
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.8;
      targetRotationX = y * 0.8;
    };

    container.addEventListener('mousemove', onPointerMove);

    // Animation loop with exponential damping
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const dampingFactor = 1 - Math.exp(-5 * dt);
      currentRotationX += (targetRotationX - currentRotationX) * dampingFactor;
      currentRotationY += (targetRotationY - currentRotationY) * dampingFactor;

      if (isRotating) {
        crestGroup.rotation.z += 0.4 * speed * dt;
        centerGem.rotation.y += 0.8 * speed * dt;
        starCore.rotation.x -= 1.2 * speed * dt;
      }

      crestGroup.rotation.x = currentRotationX;
      crestGroup.rotation.y = currentRotationY;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      torusGeo.dispose();
      ringGeo.dispose();
      gemGeo.dispose();
      nodeGeo.dispose();
      starGeo.dispose();
      goldMaterial.dispose();
      innerFrameMat.dispose();
      gemMat.dispose();
      nodeMat.dispose();
      starMat.dispose();
    };
  }, [speed, isRotating]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-white to-[#F8F9FA] border border-[#DBDBDB] shadow-xs">
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        className={`w-full transition-all duration-300 relative cursor-grab active:cursor-grabbing ${
          isExpanded ? 'h-72 sm:h-80' : 'h-44 sm:h-52'
        }`}
      />

      {/* Floating Compact Control Dock */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#DBDBDB] text-xs shadow-xs">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Pause rotation' : 'Resume rotation'}
          className="p-1 rounded-lg text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA] transition cursor-pointer"
        >
          {isRotating ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button
          onClick={() => setSpeed(s => (s === 1.0 ? 2.0 : s === 2.0 ? 0.5 : 1.0))}
          title="Toggle rotation velocity"
          className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-[#DD2A7B] hover:bg-[#FAFAFA] transition cursor-pointer font-mono"
        >
          {speed}x
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          title="Toggle viewport size"
          className="p-1 rounded-lg text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA] transition cursor-pointer"
        >
          <Sparkles size={13} className="text-[#DD2A7B]" />
        </button>
      </div>

      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#DD2A7B] bg-[#DD2A7B]/10 px-2.5 py-0.5 rounded-full border border-[#DD2A7B]/20 inline-flex items-center gap-1">
          <Sparkles size={11} /> 3D Executive Seal
        </span>
      </div>
    </div>
  );
};
