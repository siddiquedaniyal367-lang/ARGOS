"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { Maximize2, Minimize2, Layers, RotateCcw } from "lucide-react";

interface WP {
  x: number;
  y: number;
  laser: boolean;
  f: number;
}

interface Stacked3DModelProps {
  wps: WP[];
  bedW: number;
  bedH: number;
  passes: number;
  thickness?: number; // Thickness in mm
  onClose: () => void;
}

export default function Stacked3DModel({ wps, bedW, bedH, passes, thickness = 3, onClose }: Stacked3DModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layerCount, setLayerCount] = useState(0); // For animation
  const maxLayers = Math.max(1, Math.min(passes, 20)); // Cap layers to 20 for performance

  // Refs for cleanup
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || wps.length === 0) return;

    let width = containerRef.current.clientWidth || 800;
    let height = containerRef.current.clientHeight || 500;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Setup Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 15, 20);
    camera.lookAt(0, 0, 0);

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    scene.add(dirLight);
    
    const pointLight = new THREE.PointLight(0xf97316, 1.5, 50); // Orange tint
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // 5. Generate SVG String from unique passes
    // A 'pass' is one full loop of the shape. Since wps contains multiple passes (if passes > 1),
    // we only need the FIRST pass to generate the base shape.
    const wpsPerPass = wps.length / passes;
    const baseWps = passes > 1 ? wps.slice(0, Math.ceil(wpsPerPass)) : wps;

    let svgPath = "";
    const scale = 0.035; // Scale down for 3D world (400mm -> 14 units)
    let isDrawing = false;
    
    // We must close paths to make solid shapes. We can track the start of the current subpath.
    let subpathStartX = 0;
    let subpathStartY = 0;

    for (let i = 0; i < baseWps.length; i++) {
      const p = baseWps[i];
      const prev = i > 0 ? baseWps[i - 1] : null;
      
      const x = (p.x - bedW / 2) * scale;
      const y = (p.y - bedH / 2) * scale;
      
      if (p.laser) {
        if (!isDrawing) {
          svgPath += `M ${x} ${y} `;
          subpathStartX = x;
          subpathStartY = y;
          isDrawing = true;
        } else {
          svgPath += `L ${x} ${y} `;
        }
      } else {
        if (isDrawing) {
          // Close the path
          svgPath += `L ${subpathStartX} ${subpathStartY} Z `;
          isDrawing = false;
        }
      }
    }
    if (isDrawing) {
      svgPath += `L ${subpathStartX} ${subpathStartY} Z `;
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd"><path d="${svgPath}" /></svg>`;

    // 6. Parse SVG and Create Extruded Shapes
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    
    const allShapes: THREE.Shape[] = [];
    for (const path of svgData.paths) {
      const shapes = SVGLoader.createShapes(path);
      for (const shape of shapes) {
        allShapes.push(shape);
      }
    }

    const layerThickness = thickness * scale; // Convert mm to 3D units
    const gap = 0.05;
    
    // Material (Frosted / Glowing Orange acrylic look)
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.8, // glass-like
      thickness: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    // Add wireframe edge for contrast
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffedd5, opacity: 0.5, transparent: true });

    const layers: THREE.Group[] = [];

    if (allShapes.length > 0) {
      const extrudeSettings = {
        depth: layerThickness,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(allShapes, extrudeSettings);
      // Center the geometry vertically on its own layer
      geometry.translate(0, 0, -layerThickness / 2);
      
      const edges = new THREE.EdgesGeometry(geometry);

      for (let i = 0; i < maxLayers; i++) {
        const group = new THREE.Group();
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        const line = new THREE.LineSegments(edges, edgeMaterial);
        
        group.add(mesh);
        group.add(line);
        
        // Final position should be stacked on Y axis
        // We start them high up for animation
        const finalY = i * (layerThickness + gap);
        group.position.set(0, finalY + 15 + i * 2, 0); // Start high up
        
        // Rotate flat so it looks like it's cut on a bed
        group.rotation.x = Math.PI / 2;
        
        // Save target Y in userData for animation
        group.userData.targetY = finalY;
        
        scene.add(group);
        layers.push(group);
      }
    }

    // Add a base plate (CNC Bed proxy)
    const bedGeo = new THREE.BoxGeometry(bedW * scale + 2, 0.5, bedH * scale + 2);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.y = -0.5;
    bedMesh.receiveShadow = true;
    scene.add(bedMesh);

    const bedGrid = new THREE.GridHelper(bedW * scale + 2, 20, 0x334155, 0x1e293b);
    bedGrid.position.y = -0.24;
    scene.add(bedGrid);

    // 7. Load OrbitControls
    let controls: any = null;
    const initControls = async () => {
      try {
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2; // Don't go below ground
      } catch (err) {
        console.error("OrbitControls failed to load", err);
      }
    };
    initControls();

    // 8. Animation Loop
    let animationTime = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      animationTime += 0.016;

      // Drop layers one by one
      let settledCount = 0;
      layers.forEach((layer, i) => {
        // Stagger the drops
        if (animationTime > i * 0.3) {
          const target = layer.userData.targetY;
          // Easing drop
          layer.position.y += (target - layer.position.y) * 0.15;
          if (Math.abs(layer.position.y - target) < 0.01) {
            layer.position.y = target;
            settledCount++;
          }
        }
      });
      setLayerCount(settledCount);

      if (controls) controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [wps, bedW, bedH, passes]);

  return (
    <div className={`transition-all duration-300 relative rounded-xl border border-slate-700 bg-slate-950 flex flex-col shadow-2xl overflow-hidden [transform:translateZ(0)] ${
      isFullscreen 
        ? "fixed inset-0 z-[9999] w-screen h-screen rounded-none border-none" 
        : "w-full h-[500px] lg:h-[600px]"
    }`}>
      
      {/* Viewport Labels / Overlays */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-[9px] text-orange-400 bg-black/80 border border-orange-500/30 px-3 py-1.5 rounded transition-colors duration-300">
          <Layers className="w-3 h-3" />
          3D STACK PREVIEW
        </div>
        <div className="font-mono text-[10px] text-slate-300 bg-black/80 px-3 py-1.5 rounded border border-slate-700">
          LAYERS: {layerCount} / {maxLayers}
        </div>
      </div>

      {/* Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg shadow-md transition-all cursor-pointer font-mono"
        >
          CLOSE 3D VIEW
        </button>
        <button 
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
          }}
          className="p-2 text-slate-300 hover:text-orange-400 bg-slate-900 border border-slate-700 hover:border-orange-400/50 rounded-lg shadow-md transition-all cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Three.js Container */}
      <div ref={containerRef} className="w-full flex-grow cursor-grab active:cursor-grabbing" />

      {/* Bottom Status bar */}
      <div className="absolute bottom-0 inset-x-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md py-3 px-6 flex items-center justify-between font-mono text-[10px] text-slate-500 z-20 transition-colors duration-300">
        <div>Total simulated height: {maxLayers * thickness} mm</div>
        <div className="text-right">Rotate: Left Click & Drag | Zoom: Scroll</div>
      </div>
    </div>
  );
}
