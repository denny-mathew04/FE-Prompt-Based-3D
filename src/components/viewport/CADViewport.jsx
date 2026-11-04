import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { 
  RotateCcw, 
  Maximize2, 
  Eye, 
  AlertTriangle, 
  Grid, 
  Box, 
  Layers, 
  Compass,
  Play,
  Pause
} from 'lucide-react';

export default function CADViewport({ 
  stlUrl, 
  modelId, 
  telemetry, 
  isGenerating,
  onExportSTL 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const meshRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Viewport states
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [loadingMesh, setLoadingMesh] = useState(false);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f9fafb');
    scene.fog = new THREE.FogExp2('#f9fafb', 0.0018);
    sceneRef.current = scene;

    // 2. Camera (Prevent NaN aspect ratio if container is initially 0x0)
    const aspect = (width && height) ? (width / height) : 1;
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
    camera.position.set(160, 140, 220);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and shadow map
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    const initW = width || 800;
    const initH = height || 600;
    renderer.setSize(initW, initH, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Ensure the canvas fully covers its container without stretching or squishing
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI; // Allow full 360 degree orbital rotation (including underneath)
    controls.minDistance = 20;
    controls.maxDistance = 600;
    controls.target.set(0, 25, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup (Professional Studio Key + Fill + Rim Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(120, 200, 100);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 500;
    const d = 140;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6); // subtle cyan fill
    fillLight.position.set(-150, 100, -100);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.5); // indigo rim
    rimLight.position.set(0, 150, -150);
    scene.add(rimLight);

    // 6. Build Plate (200x200mm Calibrated Grid)
    const buildPlateGroup = new THREE.Group();
    buildPlateGroup.name = "buildPlate";

    // Main 200x200mm plate geometry
    const plateGeo = new THREE.BoxGeometry(200, 2, 200);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8,
      metalness: 0.1
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = -1;
    plateMesh.receiveShadow = true;
    buildPlateGroup.add(plateMesh);

    // 10mm Major Grid Lines
    const gridMajor = new THREE.GridHelper(200, 20, 0x94a3b8, 0xcbd5e1);
    gridMajor.position.y = 0.05;
    buildPlateGroup.add(gridMajor);

    // Outer boundary frame (200x200 mm perimeter)
    const frameEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(200, 0.2, 200));
    const frameLine = new THREE.LineSegments(
      frameEdges,
      new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 })
    );
    frameLine.position.y = 0.1;
    buildPlateGroup.add(frameLine);

    // 200x200x200mm Build Envelope Wire Box
    const envelopeGeo = new THREE.BoxGeometry(200, 200, 200);
    const envelopeEdges = new THREE.EdgesGeometry(envelopeGeo);
    const envelopeLines = new THREE.LineSegments(
      envelopeEdges,
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.2 })
    );
    envelopeLines.position.y = 100;
    envelopeLines.name = "envelopeLines";
    buildPlateGroup.add(envelopeLines);

    scene.add(buildPlateGroup);

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) continue;
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Update Grid visibility
  useEffect(() => {
    if (sceneRef.current) {
      const plate = sceneRef.current.getObjectByName("buildPlate");
      if (plate) plate.visible = showGrid;
    }
  }, [showGrid]);

  // Create Material: Standard CAD Material
  const getMeshMaterial = (isWire) => {
    // Standard high-end CAD Solid Material
    return new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.15,
      roughness: 0.35,
      wireframe: isWire,
      side: THREE.DoubleSide
    });
  };

  // Load and Render STL Model
  useEffect(() => {
    if (!sceneRef.current) return;

    if (!stlUrl) {
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) {
          if (Array.isArray(meshRef.current.material)) {
            meshRef.current.material.forEach(m => m.dispose());
          } else {
            meshRef.current.material.dispose();
          }
        }
        meshRef.current = null;
      }
      setLoadingMesh(false);
      return;
    }

    setLoadingMesh(true);
    const loader = new STLLoader();

    // Fetch STL binary
    loader.load(
      stlUrl,
      (geometry) => {
        // Remove prior mesh
        if (meshRef.current && sceneRef.current) {
          sceneRef.current.remove(meshRef.current);
          if (meshRef.current.geometry) meshRef.current.geometry.dispose();
          if (meshRef.current.material) meshRef.current.material.dispose();
          meshRef.current = null;
        }

        // Recompute normals
        geometry.computeVertexNormals();

        // Rotate OpenSCAD STL coordinates (Z-up) so that Z becomes Three.js Y-up
        geometry.rotateX(-Math.PI / 2);

        // Center geometry on build bed horizontally (X, Z) and align bottom to Y = 0
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const centerX = -(bbox.max.x + bbox.min.x) / 2;
        const centerZ = -(bbox.max.z + bbox.min.z) / 2;
        const bottomY = -bbox.min.y;
        geometry.translate(centerX, bottomY, centerZ);

        // Create Mesh
        const material = getMeshMaterial(wireframe);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "cadModelMesh";

        sceneRef.current.add(mesh);
        meshRef.current = mesh;
        setLoadingMesh(false);

        // Adjust camera target
        geometry.computeBoundingBox();
        const finalBox = geometry.boundingBox;
        const sizeY = finalBox.max.y - finalBox.min.y;
        if (controlsRef.current) {
          controlsRef.current.target.set(0, Math.max(15, sizeY / 2), 0);
          controlsRef.current.update();
        }
      },
      undefined,
      (error) => {
        console.error("Error loading STL mesh into Three.js:", error);
        setLoadingMesh(false);
      }
    );
  }, [stlUrl, modelId]);

  // Update material on toggle changes
  useEffect(() => {
    if (meshRef.current) {
      const oldMat = meshRef.current.material;
      meshRef.current.material = getMeshMaterial(wireframe);
      if (oldMat && oldMat.dispose) oldMat.dispose();
    }
  }, [wireframe]);

  // Camera presets
  const setCameraView = (view) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dist = 220;
    if (view === 'iso') {
      cameraRef.current.position.set(dist * 0.7, dist * 0.65, dist * 0.8);
      controlsRef.current.target.set(0, 25, 0);
    } else if (view === 'top') {
      cameraRef.current.position.set(0, dist * 1.2, 0.001);
      controlsRef.current.target.set(0, 0, 0);
    } else if (view === 'bottom') {
      cameraRef.current.position.set(0, -dist * 1.2, 0.001);
      controlsRef.current.target.set(0, 0, 0);
    } else if (view === 'front') {
      cameraRef.current.position.set(0, 35, dist);
      controlsRef.current.target.set(0, 35, 0);
    } else if (view === 'side') {
      cameraRef.current.position.set(dist, 35, 0);
      controlsRef.current.target.set(0, 35, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-50 select-none overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {(loadingMesh || isGenerating) && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none transition-all">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
            <div className="w-12 h-12 rounded-full border-3 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
            <Box className="w-6 h-6 text-blue-500 absolute" />
          </div>
          <span className="mt-4 text-xs font-medium tracking-wider text-gray-800 uppercase font-mono">
            {isGenerating ? "Compiling Geometry..." : "Rendering WebGL Mesh..."}
          </span>
          <span className="text-[11px] text-gray-500 mt-1">OpenSCAD Deterministic CSG Engine</span>
        </div>
      )}

      {/* Top Floating Viewport Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-gray-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>BED: 200 x 200 mm</span>
          <span className="text-gray-300">|</span>
          <span className="text-blue-600 font-medium">{isGenerating ? "Compiling" : (telemetry ? "Ready" : "Empty")}</span>
        </div>
      </div>

      {/* Viewport Toolbar Controls (Floating Bottom-Center) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md border border-gray-200">
          {/* Reset ISO */}
          <button
            onClick={() => setCameraView('iso')}
            title="Isometric View (Default)"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Top View */}
          <button
            onClick={() => setCameraView('top')}
            title="Top View (XY)"
            className="px-2 py-1 rounded-md text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            TOP
          </button>

          {/* Bottom View */}
          <button
            onClick={() => setCameraView('bottom')}
            title="Bottom View"
            className="px-2 py-1 rounded-md text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            BTM
          </button>

          {/* Front View */}
          <button
            onClick={() => setCameraView('front')}
            title="Front View (XZ)"
            className="px-2 py-1 rounded-md text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            FRONT
          </button>

          {/* Side View */}
          <button
            onClick={() => setCameraView('side')}
            title="Right Side View (YZ)"
            className="px-2 py-1 rounded-md text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            SIDE
          </button>

          <div className="w-[1px] h-4 bg-gray-200 mx-1" />

          {/* Wireframe toggle */}
          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe Mesh"
            className={`p-2 rounded-lg transition-colors ${
              wireframe ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Calibrated Bed Grid"
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'text-blue-500' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title="360° Auto-Rotate Turntable"
            className={`px-2 py-1 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
              autoRotate ? 'text-blue-600 bg-blue-50 border border-blue-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>360°</span>
          </button>
        </div>
      </div>
    </div>
  );
}
