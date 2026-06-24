"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Info, X, Zap, Maximize2, Minimize2 } from "lucide-react";
import { usePlotter } from "@/context/PlotterContext";

interface SimulationProps {
  theme?: "dark" | "light";
}

export default function Simulation({ theme = "dark" }: SimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { plotterImage, setPlotterImage } = usePlotter();
  const [cutProgress, setCutProgress] = useState(0);
  const [isCutting, setIsCutting] = useState(false);
  const cutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Simulation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState("STANDBY"); // STANDBY, PLOTTING, TRAVELING
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [feedRate, setFeedRate] = useState(0);
  const [laserPower, setLaserPower] = useState(0);
  const [activeShape, setActiveShape] = useState("hexagon"); // hexagon, gear, star
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs for animation state to bypass closure issues in Three.js loop
  const stateRef = useRef({
    isPlaying: false,
    currentStep: 0,
    coords: { x: 0, y: 0 },
    shape: "hexagon",
    pathPoints: [] as THREE.Vector3[],
    showLabels: true,
  });

  // Dynamic label refs
  const labelArduinoRef = useRef<HTMLDivElement>(null);
  const labelLaserRef = useRef<HTMLDivElement>(null);
  const labelMotorRef = useRef<HTMLDivElement>(null);

  // Three.js object references for theme changes
  const sceneRef = useRef<THREE.Scene | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pathMatRef = useRef<THREE.LineBasicMaterial | null>(null);
  const arrowXRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowYRef = useRef<THREE.ArrowHelper | null>(null);
  const bedMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const carriageMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const imagePlaneRef = useRef<THREE.Mesh | null>(null);
  const imageMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  // Stores the raster-scan path for the image cut mode
  const imagePathRef = useRef<THREE.Vector3[]>([]);

  // G-code logger reference
  const logRef = useRef<(cmd: string) => void>(() => {});
  logRef.current = (cmd: string) => {
    if (terminalRef.current) {
      const newLog = document.createElement("div");
      let textClass = "text-foreground/80 font-medium";
      if (cmd.startsWith("M3") || cmd.startsWith("M5")) {
        textClass = "text-accent font-bold";
      } else if (cmd.startsWith("STATUS") || cmd.startsWith("[COM3] > $")) {
        textClass = "text-foreground/40";
      }
      newLog.className = `text-[9px] font-mono py-0.5 border-b border-border-card/25 border-dashed animate-fade-in ${textClass}`;
      newLog.textContent = `[COM3] > ${cmd}`;
      terminalRef.current.appendChild(newLog);
      while (terminalRef.current.childNodes.length > 25) {
        terminalRef.current.removeChild(terminalRef.current.firstChild!);
      }
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  // Keep refs in sync
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.shape = activeShape;
    stateRef.current.showLabels = showLabels;
  }, [isPlaying, activeShape, showLabels]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      logRef.current("M3 S85 (Engaging laser: 85% duty cycle)");
      logRef.current("G0 F3000 (Rapid positioning to toolpath start)");
    } else {
      logRef.current("M5 (Disengaging laser source)");
      logRef.current("STATUS: PAUSED");
    }
    setIsPlaying(!isPlaying);
  };

  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    setStatus("STANDBY");
    setCoords({ x: 0, y: 0 });
    setFeedRate(0);
    setLaserPower(0);
    stateRef.current.currentStep = 0;
    stateRef.current.pathPoints = [];
    logRef.current("$H (Homing mechanical gantry...)");
    logRef.current("G54 (Activating coordinate offset index 1)");
    logRef.current("STATUS: READY");
  };

  // Start/stop cut animation when plotterImage changes
  useEffect(() => {
    if (plotterImage) {
      setCutProgress(0);
      setIsCutting(false);
    } else {
      if (cutIntervalRef.current) clearInterval(cutIntervalRef.current);
      setIsCutting(false);
      setCutProgress(0);
    }
  }, [plotterImage]);

  const startCutAnimation = () => {
    if (isCutting) return;
    setIsCutting(true);
    setCutProgress(0);
    let p = 0;
    cutIntervalRef.current = setInterval(() => {
      p += 0.4;
      setCutProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(cutIntervalRef.current!);
        setIsCutting(false);
      }
    }, 80);
  };

  const ejectPlotterImage = () => {
    if (cutIntervalRef.current) clearInterval(cutIntervalRef.current);
    setIsCutting(false);
    setCutProgress(0);
    setPlotterImage(null);
  };

  // Generate a raster-scan toolpath across the full bed (zigzag, 80 passes)
  const generateImageRasterPath = () => {
    const pts = [];
    const halfBed = 4.0;
    const rows = 40;
    const cols = 40;
    for (let r = 0; r <= rows; r++) {
      const z = -halfBed + (r / rows) * halfBed * 2;
      const leftToRight = r % 2 === 0;
      for (let c = 0; c <= cols; c++) {
        const t = leftToRight ? c / cols : 1 - c / cols;
        const x = -halfBed + t * halfBed * 2;
        pts.push(new THREE.Vector3(x, 0.02, z));
      }
    }
    return pts;
  };

  const generateOutlinePath = (ctx: CanvasRenderingContext2D, size: number) => {
    // Extract raw pixel data
    const imgData = ctx.getImageData(0, 0, size, size).data;
    const darkPoints: THREE.Vector3[] = [];
    
    // Sample every Nth pixel (effectively 128x128 resolution for pathfinding)
    const step = Math.floor(size / 128); 
    
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const i = (y * size + x) * 4;
        const r = imgData[i];
        const g = imgData[i+1];
        const b = imgData[i+2];
        const brightness = (r + g + b) / 3;
        
        // Threshold for dark lines (ignoring white background)
        if (brightness < 120) {
          // Map to 10.5x10.5 bed coordinates matching the PlaneGeometry
          const mapX = (x / size) * 10.5 - 5.25;
          const mapZ = (y / size) * 10.5 - 5.25;
          darkPoints.push(new THREE.Vector3(mapX, 0.02, mapZ));
        }
      }
    }
    
    if (darkPoints.length === 0) return generateImageRasterPath();
    
    // Nearest neighbor sorting to simulate continuous CNC drawing strokes
    const sortedPoints: THREE.Vector3[] = [];
    let current = darkPoints.shift()!;
    sortedPoints.push(current);
    
    while (darkPoints.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      
      // True nearest neighbor (check all remaining points)
      const searchWindow = darkPoints.length;
      for (let i = 0; i < searchWindow; i++) {
        const dist = current.distanceToSquared(darkPoints[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      
      current = darkPoints[nearestIdx];
      sortedPoints.push(current);
      darkPoints.splice(nearestIdx, 1);
    }
    
    return sortedPoints;
  };

  // Dynamically load AI image as a texture onto the plotter bed
  useEffect(() => {
    // Clean up any existing plane
    if (imagePlaneRef.current && sceneRef.current) {
      sceneRef.current.remove(imagePlaneRef.current);
      imagePlaneRef.current.geometry.dispose();
      imageMatRef.current?.dispose();
      imagePlaneRef.current = null;
      imageMatRef.current = null;
    }
    if (!plotterImage || !sceneRef.current) return;

    // Use native Image + CanvasTexture — more reliable than TextureLoader for base64
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!sceneRef.current) return;

      // Draw image to canvas (apply grayscale + contrast filter)
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // White background first (image has transparent bg sometimes)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Apply outline filter via CSS canvas filter
      ctx.filter = "grayscale(1) contrast(6) brightness(1.15)";
      ctx.drawImage(img, 0, 0, size, size);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const planeGeo = new THREE.PlaneGeometry(10.5, 10.5);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2; // lay flat on bed
      plane.position.y = 0.15;          // above bed + grid (prevents z-fighting)
      sceneRef.current.add(plane);
      imagePlaneRef.current = plane;
      imageMatRef.current = planeMat;
      
      // Calculate optimized vector toolpath directly from pixel data
      imagePathRef.current = generateOutlinePath(ctx, size);
      
      // Trigger update
      stateRef.current.shape = "image";
      setActiveShape("image");
      setIsPlaying(false);
      stateRef.current.currentStep = 0;
      stateRef.current.pathPoints = [];
    };
    img.onerror = (e) => console.error("Image load failed:", e);
    img.src = plotterImage;
  }, [plotterImage]);

  // Listen to theme adjustments and dynamically modify WebGL scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const isDark = theme === "dark";

    sceneRef.current.background = new THREE.Color(isDark ? "#06060a" : "#f4f4f7");

    // Grid
    if (gridRef.current) {
      sceneRef.current.remove(gridRef.current);
      const newGrid = new THREE.GridHelper(12, 24, isDark ? "#00e5ff" : "#0055ff", isDark ? "#2a2a40" : "#cbd5e1");
      newGrid.position.y = 0.02;
      sceneRef.current.add(newGrid);
      gridRef.current = newGrid;
    }

    // Lights
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isDark ? 1.2 : 0.85;
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.set(isDark ? "#c9e8ff" : "#f0f4ff");
      dirLightRef.current.intensity = isDark ? 1.8 : 0.9;
    }
    if (pointLightRef.current) {
      pointLightRef.current.color.set(isDark ? "#00d4ff" : "#0055ff");
      pointLightRef.current.intensity = isDark ? 1.8 : 0.7;
    }

    // Arrows
    if (arrowXRef.current) arrowXRef.current.setColor(new THREE.Color(isDark ? "#ef4444" : "#dc2626"));
    if (arrowYRef.current) arrowYRef.current.setColor(new THREE.Color(isDark ? "#22c55e" : "#16a34a"));

    // Materials
    if (beamMatRef.current)  beamMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff");
    if (ringMatRef.current)  { ringMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff"); ringMatRef.current.emissive.set(isDark ? "#00f0ff" : "#0055ff"); }
    if (pathMatRef.current)  pathMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff");
    if (bedMatRef.current)   bedMatRef.current.color.set(isDark ? "#1e1e2e" : "#d8dee9");
    if (carriageMatRef.current) {
      carriageMatRef.current.color.set(isDark ? "#0099ff" : "#0055ff");
      (carriageMatRef.current as THREE.MeshStandardMaterial).emissive?.set(isDark ? "#003366" : "#002244");
    }
  }, [theme]);

  // Main Three.js Scene Initialization
  useEffect(() => {
    if (!containerRef.current) return;

    let width = containerRef.current.clientWidth || 800;
    let height = containerRef.current.clientHeight || 500;
    const isDark = theme === "dark";

    try {
      // Scene setup
      const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? "#06060a" : "#f4f4f7");
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(15, 12, 17);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    
    // Clear any stuck HMR canvases before appending the fresh one
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);
    }

    // Lights — boosted for dark mode visibility
    const ambientLight = new THREE.AmbientLight("#ffffff", isDark ? 1.2 : 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Main top-right directional (cool blue tint in dark, neutral in light)
    const dirLight = new THREE.DirectionalLight(isDark ? "#c9e8ff" : "#f0f4ff", isDark ? 1.8 : 0.9);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Cyan accent point light (laser glow effect)
    const pointLight = new THREE.PointLight(isDark ? "#00d4ff" : "#0055ff", isDark ? 1.8 : 0.7, 20);
    pointLight.position.set(-8, 8, -8);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // Second fill light from front-left (only in dark mode for depth)
    if (isDark) {
      const fillLight = new THREE.DirectionalLight("#ffffff", 0.9);
      fillLight.position.set(-12, 5, 12);
      scene.add(fillLight);
    }

    // CNC Bed — visible charcoal in dark, brushed silver in light
    const bedWidth = 12;
    const bedHeight = 12;
    const bedGeo = new THREE.BoxGeometry(bedWidth, 0.18, bedHeight);
    const bedMat = new THREE.MeshStandardMaterial({
      color: isDark ? "#1e1e2e" : "#d8dee9",
      roughness: 0.35,
      metalness: 0.75,
    });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.y = -0.09;
    bed.receiveShadow = true;
    scene.add(bed);
    bedMatRef.current = bedMat;

    // Grid lines — bright cyan in dark for contrast
    const bedGrid = new THREE.GridHelper(
      bedWidth,
      24,
      isDark ? "#00e5ff" : "#0055ff",
      isDark ? "#2a2a40" : "#cbd5e1"
    );
    bedGrid.position.y = 0.02;
    scene.add(bedGrid);
    gridRef.current = bedGrid;

    // 3D Cartesian Coordinate System Axis Helpers (X=Red, Y=Green)
    const dirX = new THREE.Vector3(1, 0, 0);
    const origin = new THREE.Vector3(-bedWidth / 2 + 0.5, 0.02, bedHeight / 2 - 0.5);
    const length = 2.0;
    const arrowX = new THREE.ArrowHelper(dirX, origin, length, isDark ? "#ef4444" : "#dc2626", 0.35, 0.15);
    scene.add(arrowX);
    arrowXRef.current = arrowX;

    const dirY = new THREE.Vector3(0, 0, -1); // Camera space Z is plotting Y
    const arrowY = new THREE.ArrowHelper(dirY, origin, length, isDark ? "#22c55e" : "#16a34a", 0.35, 0.15);
    scene.add(arrowY);
    arrowYRef.current = arrowY;

    // Frame Rails — dark metallic so they are highly visible in both modes
    const railMat = new THREE.MeshStandardMaterial({ 
      color: isDark ? "#e2e8f0" : "#111115", 
      metalness: 0.6, 
      roughness: 0.3 
    });
    const railLeftGeo = new THREE.CylinderGeometry(0.1, 0.1, bedHeight, 16);
    const railLeft = new THREE.Mesh(railLeftGeo, railMat);
    railLeft.rotation.x = Math.PI / 2;
    railLeft.position.set(-bedWidth / 2 + 0.3, 0.25, 0);
    railLeft.castShadow = true;
    scene.add(railLeft);

    const railRight = railLeft.clone();
    railRight.position.set(bedWidth / 2 - 0.3, 0.25, 0);
    scene.add(railRight);

    // Gantry bar — black/dark-grey so it firmly anchors the machine visually
    const gantryGeo = new THREE.BoxGeometry(bedWidth - 0.4, 0.22, 0.32);
    const gantryMat = new THREE.MeshStandardMaterial({ 
      color: isDark ? "#cbd5e1" : "#0a0a0f", 
      metalness: 0.5, 
      roughness: 0.4 
    });
    const gantry = new THREE.Mesh(gantryGeo, gantryMat);
    gantry.position.set(0, 0.38, 0);
    gantry.castShadow = true;
    scene.add(gantry);

    // Y-axis guide rail on gantry
    const yRailGeo = new THREE.CylinderGeometry(0.07, 0.07, bedWidth - 0.6, 16);
    const yRail = new THREE.Mesh(yRailGeo, railMat);
    yRail.rotation.z = Math.PI / 2;
    yRail.position.set(0, 0.42, 0);
    gantry.add(yRail);

    // Laser Module Carriage — bright blue anodized block, very visible
    const carriageGeo = new THREE.BoxGeometry(0.75, 0.45, 0.55);
    const carriageMat = new THREE.MeshStandardMaterial({
      color: isDark ? "#0099ff" : "#0055ff",
      metalness: 0.85,
      roughness: 0.15,
      emissive: isDark ? "#003366" : "#002244",
      emissiveIntensity: 0.4,
    });
    const carriage = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.position.set(0, 0.55, 0);
    carriage.castShadow = true;
    scene.add(carriage);
    carriageMatRef.current = carriageMat;

    // Laser Diode (Cylinder block housing the laser source) - Dark steel finish
    const diodeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
    const diodeMat = new THREE.MeshStandardMaterial({ color: "#1f2937", metalness: 0.9, roughness: 0.15 });
    const diode = new THREE.Mesh(diodeGeo, diodeMat);
    diode.position.set(0, -0.15, 0.25);
    carriage.add(diode);

    // Emissive Laser Ring
    const ringGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16);
    const ringMat = new THREE.MeshStandardMaterial({ 
      color: isDark ? "#00f0ff" : "#0055ff", 
      emissive: isDark ? "#00f0ff" : "#0055ff", 
      emissiveIntensity: 3.0 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.22;
    diode.add(ring);
    ringMatRef.current = ringMat;

    // Laser Beam (Emissive cylinder connecting carriage to bed)
    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
    const beamMat = new THREE.MeshBasicMaterial({ 
      color: isDark ? "#00f0ff" : "#0055ff", 
      transparent: true, 
      opacity: 0.9 
    });
    const laserBeam = new THREE.Mesh(beamGeo, beamMat);
    laserBeam.position.set(0, -0.3, 0.25);
    laserBeam.visible = false;
    carriage.add(laserBeam);
    beamMatRef.current = beamMat;

    // Laser Contact Burn Dot
    const dotGeo = new THREE.RingGeometry(0.01, 0.08, 16);
    const dotMat = new THREE.MeshBasicMaterial({ 
      color: isDark ? "#00f0ff" : "#0055ff", 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const burnDot = new THREE.Mesh(dotGeo, dotMat);
    burnDot.rotation.x = Math.PI / 2;
    burnDot.position.y = 0.02;
    scene.add(burnDot);

    // Stepper Motors - Anodized gray housing blocks
    const motorMat = new THREE.MeshStandardMaterial({ color: isDark ? "#a1a1aa" : "#27272a", metalness: 0.6, roughness: 0.4 });
    const motorGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    
    // Motor X-left
    const motorXL = new THREE.Mesh(motorGeo, motorMat);
    motorXL.position.set(-bedWidth / 2 + 0.3, 0.2, -bedHeight / 2 + 0.2);
    scene.add(motorXL);

    // Motor Y (attached to Gantry)
    const motorY = new THREE.Mesh(motorGeo, motorMat);
    motorY.position.set(bedWidth / 2 - 0.5, 0.5, 0);
    gantry.add(motorY);

    // Arduino controller mock (Green plate with chips)
    const controllerBaseGeo = new THREE.BoxGeometry(1.0, 0.04, 0.7);
    const controllerBaseMat = new THREE.MeshStandardMaterial({ color: "#135c38", roughness: 0.75 });
    const controller = new THREE.Mesh(controllerBaseGeo, controllerBaseMat);
    controller.position.set(-bedWidth / 2 - 0.2, 0.15, 0);
    controller.rotation.y = Math.PI / 2;
    scene.add(controller);

    const chipGeo = new THREE.BoxGeometry(0.25, 0.08, 0.25);
    const chipMat = new THREE.MeshStandardMaterial({ color: "#08080c", roughness: 0.6 });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0.18, 0.04, 0);
    controller.add(chip);

    // Dynamic laser path lines (drawn behind the laser head)
    const maxPathPoints = 5000;
    const pathPositions = new Float32Array(maxPathPoints * 3);
    const pathGeometry = new THREE.BufferGeometry();
    pathGeometry.setAttribute("position", new THREE.BufferAttribute(pathPositions, 3));
    
    const pathMaterial = new THREE.LineBasicMaterial({ 
      color: isDark ? "#00f0ff" : "#0055ff", 
      linewidth: 3 
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);
    pathMatRef.current = pathMaterial;

    // G-code paths configurations based on selection
    const generateHexagonPoints = () => {
      const points = [];
      const size = 3.5;
      for (let i = 0; i <= 600; i++) {
        const theta = (i / 100) * Math.PI;
        const r = size * Math.cos(Math.PI / 6) / Math.cos((theta % (Math.PI / 3)) - Math.PI / 6);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0.02, y));
      }
      return points;
    };

    const generateGearPoints = () => {
      const points = [];
      const R = 3.0;
      const teeth = 8;
      for (let i = 0; i <= 720; i++) {
        const theta = (i / 360) * Math.PI * 2;
        const radius = R + 0.4 * Math.sin(theta * teeth);
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0.02, y));
      }
      return points;
    };

    const generateStarPoints = () => {
      const points = [];
      const spikes = 5;
      const outerRadius = 3.5;
      const innerRadius = 1.5;
      for (let i = 0; i <= 360; i++) {
        const theta = (i / 180) * Math.PI;
        const radius = i % 72 < 36 ? 
          outerRadius - (i % 36) / 36 * (outerRadius - innerRadius) :
          innerRadius + (i % 36) / 36 * (outerRadius - innerRadius);
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0.02, y));
      }
      return points;
    };

    // Load OrbitControls dynamically (browser-only)
    let controls: any = null;
    const loadControls = async () => {
      try {
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 40;
      } catch (err) {
        console.error("Failed to load OrbitControls:", err);
      }
    };
    loadControls();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let localStep = 0;
    let pointsList = generateHexagonPoints();
    let currentShapeType = "hexagon";

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Track active shape changes inside loop
      if (stateRef.current.shape !== currentShapeType) {
        currentShapeType = stateRef.current.shape;
        if (currentShapeType === "hexagon") pointsList = generateHexagonPoints();
        else if (currentShapeType === "gear") pointsList = generateGearPoints();
        else if (currentShapeType === "star") pointsList = generateStarPoints();
        else if (currentShapeType === "image") pointsList = imagePathRef.current;
        
        localStep = 0;
        stateRef.current.pathPoints = [];
      }

      // Check if simulation is playing
      if (stateRef.current.isPlaying) {
        setStatus("PLOTTING");
        setFeedRate(1200);
        setLaserPower(85);
        laserBeam.visible = true;

        if (localStep < pointsList.length) {
          const pt = pointsList[localStep];
          
          // Move mechanical elements in 3D
          gantry.position.z = pt.z;
          carriage.position.x = pt.x;
          carriage.position.z = pt.z;

          // Update active laser burn contact spot
          burnDot.position.x = pt.x;
          burnDot.position.z = pt.z;
          burnDot.material.opacity = 0.75 + Math.random() * 0.25;

          // Update current coordinate state (mapping -5..5 to 0..500 mm bounds)
          const mmX = Math.round(((pt.x + 5) / 10) * 500);
          const mmY = Math.round(((pt.z + 5) / 10) * 500);
          setCoords({ x: mmX, y: mmY });

          // Stream simulated live G-code blocks every 4 animation ticks
          if (localStep % 4 === 0) {
            logRef.current(`G1 X${mmX.toFixed(1)} Y${mmY.toFixed(1)} F1200 S85`);
          }

          // Add path points for drawing lines
          stateRef.current.pathPoints.push(new THREE.Vector3(pt.x, 0.02, pt.z));
          
          // Update buffer geometry line data
          const positions = pathGeometry.attributes.position.array as Float32Array;
          for (let i = 0; i < stateRef.current.pathPoints.length; i++) {
            positions[i * 3] = stateRef.current.pathPoints[i].x;
            positions[i * 3 + 1] = stateRef.current.pathPoints[i].y;
            positions[i * 3 + 2] = stateRef.current.pathPoints[i].z;
          }
          pathGeometry.setDrawRange(0, stateRef.current.pathPoints.length);
          pathGeometry.attributes.position.needsUpdate = true;

          localStep += 2; // Speed multiplier
        } else {
          // Finished plotting
          setIsPlaying(false);
          setStatus("STANDBY");
          setFeedRate(0);
          setLaserPower(0);
          laserBeam.visible = false;
          burnDot.material.opacity = 0;
          logRef.current("M5 (Laser power off)");
          logRef.current("G0 X0.0 Y0.0 F3000 (Homing carriage)");
          logRef.current("STATUS: COMPLETED");
        }
      } else {
        laserBeam.visible = false;
        burnDot.material.opacity = 0;
        if (stateRef.current.pathPoints.length === 0) {
          pathGeometry.setDrawRange(0, 0);
        }
      }

      if (controls) {
        controls.update();
      }

      // Update 3D tracked labels
      if (stateRef.current.showLabels) {
        if (labelArduinoRef.current) {
          const pos = new THREE.Vector3(-6, 0.15, 0).project(camera);
          labelArduinoRef.current.style.left = `${(pos.x * 0.5 + 0.5) * 100}%`;
          labelArduinoRef.current.style.top = `${(-pos.y * 0.5 + 0.5) * 100}%`;
        }
        if (labelLaserRef.current) {
          const pos = new THREE.Vector3(carriage.position.x, carriage.position.y + 0.8, carriage.position.z).project(camera);
          labelLaserRef.current.style.left = `${(pos.x * 0.5 + 0.5) * 100}%`;
          labelLaserRef.current.style.top = `${(-pos.y * 0.5 + 0.5) * 100}%`;
        }
        if (labelMotorRef.current) {
          const pos = new THREE.Vector3(5.5, 0.5, 0).project(camera);
          labelMotorRef.current.style.left = `${(pos.x * 0.5 + 0.5) * 100}%`;
          labelMotorRef.current.style.top = `${(-pos.y * 0.5 + 0.5) * 100}%`;
        }
      }

      renderer.render(scene, camera);
    };
    animate();
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bedGeo.dispose();
      bedMat.dispose();
      railLeftGeo.dispose();
      railMat.dispose();
      gantryGeo.dispose();
      gantryMat.dispose();
      yRailGeo.dispose();
      carriageGeo.dispose();
      carriageMat.dispose();
      diodeGeo.dispose();
      diodeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      motorGeo.dispose();
      motorMat.dispose();
      controllerBaseGeo.dispose();
      controllerBaseMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      pathGeometry.dispose();
      pathMaterial.dispose();
      // Clean up image plane if loaded
      if (imagePlaneRef.current) {
        scene.remove(imagePlaneRef.current);
        imagePlaneRef.current.geometry.dispose();
        imageMatRef.current?.dispose();
      }
      scene.clear();
    };
    
    } catch (err: any) {
      console.error("Three.js initialization failed:", err);
      setTimeout(() => {
        if (logRef.current) logRef.current(`CRITICAL ERROR: WebGL Failed - ${err.message}`);
      }, 1000);
    }
  }, []);

  // Listen to theme adjustments and dynamically modify WebGL scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const isDark = theme === "dark";
    sceneRef.current.background = new THREE.Color(isDark ? "#06060a" : "#f4f4f7");

    // Grid
    if (gridRef.current) {
      sceneRef.current.remove(gridRef.current);
      const newGrid = new THREE.GridHelper(12, 24, isDark ? "#00e5ff" : "#0055ff", isDark ? "#2a2a40" : "#cbd5e1");
      newGrid.position.y = 0.02;
      sceneRef.current.add(newGrid);
      gridRef.current = newGrid;
    }

    // Lights
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isDark ? 1.2 : 0.85;
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.set(isDark ? "#c9e8ff" : "#f0f4ff");
      dirLightRef.current.intensity = isDark ? 1.8 : 0.9;
    }
    if (pointLightRef.current) {
      pointLightRef.current.color.set(isDark ? "#00d4ff" : "#0055ff");
      pointLightRef.current.intensity = isDark ? 1.8 : 0.7;
    }

    // Arrows
    if (arrowXRef.current) arrowXRef.current.setColor(new THREE.Color(isDark ? "#ef4444" : "#dc2626"));
    if (arrowYRef.current) arrowYRef.current.setColor(new THREE.Color(isDark ? "#22c55e" : "#16a34a"));

    // Materials
    if (beamMatRef.current)  beamMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff");
    if (ringMatRef.current)  { ringMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff"); ringMatRef.current.emissive.set(isDark ? "#00f0ff" : "#0055ff"); }
    if (pathMatRef.current)  pathMatRef.current.color.set(isDark ? "#00f0ff" : "#0055ff");
    if (bedMatRef.current)   bedMatRef.current.color.set(isDark ? "#1e1e2e" : "#d8dee9");
    if (carriageMatRef.current) {
      carriageMatRef.current.color.set(isDark ? "#0099ff" : "#0055ff");
      (carriageMatRef.current as THREE.MeshStandardMaterial).emissive?.set(isDark ? "#003366" : "#002244");
    }
  }, [theme]);

  return (
    <section id="simulation" className="relative py-24 bg-bg-dark border-b border-border-card transition-colors duration-300">
      <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-[10px] text-accent-yellow tracking-widest uppercase mb-3">
            [ INTERACTIVE SIMULATION ]
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-bold tracking-tight mb-4">
            CNC Laser Plotter Sandbox
          </h2>
          <p className="text-foreground/60 font-light text-sm md:text-base">
            Interact with the 3D model: drag to rotate, scroll to zoom. Trigger shapes to visualize coordinate translation and real-time laser toolpathing.
          </p>
        </div>

        {/* AI Cut Preview Banner — shown when image is loaded */}
        {plotterImage && (
          <div className="mb-8 border-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[8px_8px_0px_#cbd5e1] dark:shadow-[8px_8px_0px_#1e293b] rounded-xl p-6 animate-fade-up relative overflow-hidden">
             <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
            <div className="flex flex-col lg:flex-row gap-6 items-start relative z-10">
              {/* Image on plotter bed */}
              <div className="relative w-full lg:w-72 shrink-0 aspect-square rounded-xl overflow-hidden border-4 border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner">
                {/* Plotter bed grid overlay */}
                <div className="absolute inset-0 tech-grid-fine opacity-50 z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                {/* Generated image */}
                <img
                  src={plotterImage}
                  alt="On plotter"
                  className="w-full h-full object-contain p-4"
                  style={{ filter: "grayscale(1) contrast(6) brightness(1.2)", opacity: cutProgress > 0 ? 1 : 0.9 }}
                />
                {/* Laser scan line */}
                {isCutting && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${cutProgress}%`, transition: "top 80ms linear" }}
                  >
                    <div className="h-0.5 bg-cyan-500 w-full" />
                    <div className="h-4 bg-gradient-to-b from-cyan-500/50 to-transparent w-full" />
                  </div>
                )}
                {/* Cut reveal — clip-path that progressively reveals burnt version */}
                {cutProgress > 0 && (
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, rgba(0,240,255,0.05) ${cutProgress}%, transparent ${cutProgress}%)`,
                    }}
                  />
                )}
                {/* Corner markers */}
                {["top-2 left-2","top-2 right-2","bottom-2 left-2","bottom-2 right-2"].map((pos,i) => (
                  <div key={i} className={`absolute ${pos} w-4 h-4 z-20`}>
                    <div className="w-full h-full border-t-4 border-l-4 border-slate-400 dark:border-slate-600" style={{ transform: i===1?"scaleX(-1)":i===2?"scaleY(-1)":i===3?"scale(-1)":"none" }} />
                  </div>
                ))}
                {/* Status badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-md font-mono text-[9px] font-black text-slate-800 dark:text-slate-200 tracking-widest shadow-sm uppercase">
                  {isCutting ? "CUTTING…" : cutProgress >= 100 ? "COMPLETE" : "READY"}
                </div>
              </div>

              {/* Controls + info */}
              <div className="flex-grow flex flex-col gap-4 w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mb-2">AI Image Loaded</div>
                    <div className="font-mono text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Plotter Cut Preview</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-bold leading-relaxed max-w-lg">Image is set on the plotter bed. Press Cut to simulate the laser tracing the outline.</p>
                  </div>
                  <button onClick={ejectPlotterImage} className="p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer shadow-[2px_2px_0px_#cbd5e1] dark:shadow-[2px_2px_0px_#1e293b] active:shadow-none active:translate-y-0.5 active:translate-x-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    <span>Cut Progress</span>
                    <span>{cutProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-cyan-500 border-r border-cyan-400 transition-all duration-75"
                      style={{ width: `${cutProgress}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry row */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { label: "Laser Power", value: isCutting ? "85%" : "—" },
                    { label: "Feed Rate",  value: isCutting ? "1200 mm/min" : "—" },
                    { label: "Status",     value: isCutting ? "CUTTING" : cutProgress>=100 ? "DONE" : "STANDBY" },
                  ].map(({ label, value }) => (
                    <div key={label} className="border-2 border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900 shadow-inner">
                      <div className="font-mono text-[9px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">{label}</div>
                      <div className={`font-mono text-[13px] font-black uppercase ${isCutting ? "text-cyan-600 dark:text-cyan-500" : "text-slate-800 dark:text-slate-200"}`}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      startCutAnimation();
                      // Also start the 3D laser carriage moving across the image
                      if (!isPlaying) togglePlay();
                    }}
                    disabled={isCutting}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-md border-2 border-slate-900 dark:border-black font-mono text-[11px] tracking-widest uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] active:shadow-none active:translate-y-1.5 active:translate-x-1.5"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {isCutting ? "Cutting…" : cutProgress >= 100 ? "Re-cut" : "Start Cut"}
                  </button>
                  <button
                    onClick={() => {
                      setCutProgress(0);
                      setIsCutting(false);
                      if (isPlaying) togglePlay();
                      resetSimulation();
                    }}
                    className="flex-1 py-4 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all cursor-pointer shadow-[6px_6px_0px_#cbd5e1] dark:shadow-[6px_6px_0px_#1e293b] active:shadow-none active:translate-y-1.5 active:translate-x-1.5"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* 3D Canvas Box */}
          <div className={`transition-all duration-300 relative rounded-2xl border border-border-card bg-black/60 flex flex-col shadow-2xl overflow-hidden [transform:translateZ(0)] ${
            isFullscreen 
              ? "fixed inset-0 z-[9999] w-screen h-screen rounded-none border-none lg:col-span-12" 
              : "lg:col-span-8 h-[500px] lg:h-[600px]"
          }`}>
            
            {/* Viewport Labels / Overlays */}
            <div className="absolute top-4 left-4 z-20 flex gap-2 font-mono text-[9px] text-accent bg-bg-dark/90 border border-border-card px-3 py-1.5 rounded transition-colors duration-300">
              <span className="w-1.5 h-1.5 bg-accent animate-ping rounded-full inline-block mr-1 self-center" />
              VIEWPORT: Perspective_3D
            </div>

            {/* Fullscreen Toggle (Top Right) */}
            {!isFullscreen && (
              <button 
                onClick={() => {
                  setIsFullscreen(true);
                  setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
                }}
                className="absolute top-4 right-4 z-20 p-2.5 text-foreground hover:text-bg-dark bg-bg-card border border-border-card hover:bg-accent rounded-lg shadow-md transition-all cursor-pointer"
                title="Enter Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Floating Fullscreen Controls Dock */}
            {isFullscreen && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-bg-dark/95 border border-border-card p-2 rounded-2xl backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <button
                  onClick={togglePlay}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all cursor-pointer ${
                    isPlaying 
                      ? "bg-bg-card border border-border-card text-foreground" 
                      : "bg-accent text-bg-dark border border-transparent shadow-[0_0_15px_var(--color-accent-dim)]"
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlaying ? "PAUSE SIMULATION" : "PLAY SIMULATION"}
                </button>
                <button
                  onClick={resetSimulation}
                  className="p-3 rounded-xl border border-border-card bg-bg-card hover:text-accent-yellow hover:border-accent-yellow/30 transition-all cursor-pointer"
                  title="Reset Plotter"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="w-px h-8 bg-border-card mx-1" />
                <button
                  onClick={() => {
                    setIsFullscreen(false);
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border-card bg-bg-card hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/30 transition-all cursor-pointer font-mono text-xs font-bold text-foreground/70"
                >
                  <Minimize2 className="w-4 h-4" />
                  EXIT
                </button>
              </div>
            )}

            {/* Interactive labels overlay */}
            {showLabels && (
              <>
                {/* Arduino Label */}
                <div ref={labelArduinoRef} className="absolute z-20 pointer-events-none hidden md:block" style={{ transform: "translate(-50%, -50%)" }}>
                  <div className="flex items-center gap-2">
                    <div className="bg-bg-card/90 border border-border-card rounded px-2.5 py-1 text-left backdrop-blur-md transition-colors duration-300">
                      <div className="font-mono text-[9px] text-accent-yellow font-semibold">Arduino Controller</div>
                      <div className="text-[8px] text-foreground/45">Atmega328P Core</div>
                    </div>
                    <div className="h-[1px] w-8 bg-accent-yellow/40" />
                    <span className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse shadow-[0_0_10px_var(--accent-yellow)]" />
                  </div>
                </div>

                {/* Laser Module */}
                <div ref={labelLaserRef} className="absolute z-20 pointer-events-none hidden md:block" style={{ transform: "translate(-50%, -100%)" }}>
                  <div className="flex flex-col items-center">
                    <div className="bg-bg-card/90 border border-border-card rounded px-2.5 py-1 text-center backdrop-blur-md transition-colors duration-300 mb-1">
                      <div className="font-mono text-[9px] text-accent font-semibold">Laser Module</div>
                      <div className="text-[8px] text-foreground/45">450nm 3.5W Diode</div>
                    </div>
                    <div className="h-4 w-[1px] bg-accent/40" />
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_var(--accent)]" />
                  </div>
                </div>

                {/* Stepper Motor X */}
                <div ref={labelMotorRef} className="absolute z-20 pointer-events-none hidden md:block" style={{ transform: "translate(-50%, -50%)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse shadow-[0_0_10px_var(--accent-yellow)]" />
                    <div className="h-[1px] w-8 bg-accent-yellow/40" />
                    <div className="bg-bg-card/90 border border-border-card rounded px-2.5 py-1 text-right backdrop-blur-md transition-colors duration-300">
                      <div className="font-mono text-[9px] text-accent-yellow font-semibold">Stepper Motors</div>
                      <div className="text-[8px] text-foreground/45">NEMA 17 / 1.8° Step</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Three.js Container */}
            <div ref={containerRef} className="w-full flex-grow cursor-grab active:cursor-grabbing" />

            {/* Bottom Status bar */}
            <div className="absolute bottom-0 inset-x-0 border-t border-border-card bg-bg-dark/95 backdrop-blur-md py-3 px-6 flex items-center justify-between font-mono text-[10px] text-foreground/50 z-20 transition-colors duration-300">
              <div className="flex gap-4">
                <div>GRID: 10mm</div>
                <div>AXES: X (RED), Y (GREEN)</div>
              </div>
              <div className="text-right flex items-center gap-3">
                <button 
                  onClick={() => setShowLabels(!showLabels)}
                  className="px-2 py-0.5 border border-border-card bg-bg-card hover:border-accent hover:text-accent rounded transition duration-200 cursor-pointer"
                >
                  {showLabels ? "Hide Labels" : "Show Labels"}
                </button>
                <div>RENDER: WebGL_2.0</div>
              </div>
            </div>

          </div>

          {/* Interactive Console & Control Panel */}
          <div className="lg:col-span-4 rounded-xl border-4 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-6 flex flex-col justify-between shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-500">
            
            {/* Subtle industrial texture overlay */}
            <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

            {/* Top Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between pb-5 border-b-2 border-slate-300 dark:border-slate-800 mb-6">
                <h3 className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 tracking-widest uppercase flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
                  CONTROLLER
                </h3>
                <span className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-black tracking-widest uppercase border-2 transition-all duration-300 ${
                  status === "PLOTTING" ? "bg-orange-100 border-orange-500 text-orange-600 animate-pulse" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                  {status}
                </span>
              </div>

              {/* Coordinates Indicator */}
              <div className="rounded-lg border-2 border-slate-800 bg-slate-900 p-5 mb-6 font-mono relative overflow-hidden shadow-inner">
                <div className="text-[10px] text-slate-400 font-bold mb-5 tracking-widest flex items-center justify-between">
                  <span>TOOL POSITION</span>
                  <span className="w-2 h-2 bg-slate-600 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold mb-1">X_AXIS</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tighter tabular-nums">
                        {coords.x.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">mm</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold mb-1">Y_AXIS</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-black text-white tracking-tighter tabular-nums">
                        {coords.y.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">mm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div className="space-y-4 mb-6 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b-2 border-slate-300/80 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Feed Rate:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-black">{feedRate} mm/min</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-slate-300/80 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Laser Power:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-black">{laserPower}% (3.5W)</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b-2 border-slate-300/80 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active Path:</span>
                  <span className="text-orange-600 font-black uppercase">
                    {activeShape === "image" ? "AI IMAGE" : activeShape}
                  </span>
                </div>
              </div>

              {/* Real-time G-Code stream console */}
              <div className="mb-6">
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-3 tracking-widest flex items-center justify-between uppercase">
                  <span>Telemetry Stream</span>
                </div>
                <div 
                  ref={terminalRef} 
                  className="bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-lg p-4 h-32 overflow-y-auto font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 shadow-inner"
                  style={{ contentVisibility: "auto" }}
                >
                  <div className="text-emerald-600 font-bold">[COM3] &gt; Connection established.</div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold">[COM3] &gt; GRBL v1.1h ready ('$' for help)</div>
                  <div className="text-slate-400 font-bold">[COM3] &gt; STATUS: STANDBY</div>
                </div>
              </div>

              {/* Pattern Selector */}
              <div className="mb-2">
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-3 tracking-widest uppercase">Choose Pattern</div>
                <div className={`grid gap-3 ${plotterImage ? "grid-cols-2" : "grid-cols-3"}`}>
                  {/* AI CUT button */}
                  {plotterImage && (
                     <button
                       onClick={() => {
                         setActiveShape("image");
                         stateRef.current.shape = "image";
                         resetSimulation();
                       }}
                       className={`col-span-2 py-3 px-4 rounded-md border-2 font-mono text-[11px] font-black tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                         activeShape === "image"
                           ? "bg-cyan-500 border-cyan-600 text-slate-900 shadow-[4px_4px_0px_#0891b2] hover:bg-cyan-400 active:shadow-none active:translate-y-1 active:translate-x-1"
                           : "bg-white border-slate-300 text-slate-600 shadow-[4px_4px_0px_#cbd5e1] hover:bg-slate-50 hover:text-slate-900 active:shadow-none active:translate-y-1 active:translate-x-1"
                       }`}
                     >
                       <Zap className="w-4 h-4 fill-current" />
                       AI Image Cut
                     </button>
                  )}
                  {["hexagon", "gear", "star"].map((shape) => (
                    <button
                      key={shape}
                      onClick={() => {
                        setActiveShape(shape);
                        stateRef.current.shape = shape;
                        resetSimulation();
                      }}
                      className={`py-3 px-3 rounded-md border-2 font-mono text-[11px] font-black tracking-widest uppercase transition-all cursor-pointer ${
                        activeShape === shape
                          ? "bg-slate-800 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-none translate-y-1 translate-x-1"
                          : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 active:shadow-none active:translate-y-1 active:translate-x-1"
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4 pt-6 mt-6 border-t-2 border-slate-300 dark:border-slate-800 relative z-10">
              <div className="flex gap-3">
                <button
                  onClick={togglePlay}
                  className={`flex-grow flex items-center justify-center gap-3 py-4 rounded-md border-2 font-mono text-xs font-black tracking-widest uppercase transition-all cursor-pointer ${
                    isPlaying ?
                      "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-700 active:shadow-none active:translate-y-1 active:translate-x-1" :
                      "bg-blue-600 border-blue-700 text-white shadow-[4px_4px_0px_#1e3a8a] hover:bg-blue-500 active:shadow-none active:translate-y-1 active:translate-x-1"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" /> PAUSE
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" /> START RUN
                    </>
                  )}
                </button>

                <button
                  onClick={resetSimulation}
                  className="px-5 py-4 rounded-md border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center active:shadow-none active:translate-y-1 active:translate-x-1"
                  title="Reset Plotter"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3 items-center bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-md p-4 text-[10px] font-mono text-slate-600 dark:text-slate-400 shadow-sm">
                <Info className="w-5 h-5 shrink-0 text-slate-400" />
                <span className="leading-relaxed font-bold tracking-wide">
                  SIMULATION IS REAL-TIME. SELECT A NEW SHAPE TO RELOAD BUFFER.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
