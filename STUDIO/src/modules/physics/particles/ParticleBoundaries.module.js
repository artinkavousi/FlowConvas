// ParticleBoundaries.module.js
// Particle boundary + collision system for MPM/particle sims: box / sphere / cylinder / dodecahedron
// containers (and a free-floating mode) with GPU (TSL) collision response, plus an optional glass-
// container visualization mesh. Exposes generateCollisionTSL(pos, vel, uniforms) for use inside a
// solver's g2p compute kernel, and getBoundaryUniforms() to drive the shape uniforms. Reusable in any
// particle solver that needs containment.
//
// Ported faithfully from ref/AURORA/src/PARTICLESYSTEM/physic/boundaries.ts (transpiled with esbuild:
// types stripped, collision math VERBATIM). Changes: the box OBJ asset import path is rewired to the
// co-located ./assets/ copy; already method-chained TSL (no operator rewrite). The MLS-MPM solver wires
// this via setBoundaries(); collision runs in gridSize (0..64) space.
import * as THREE from "three/webgpu";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { If, vec2, int, float } from "three/tsl";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import boxObjUrl from "./assets/boxSlightlySmooth.obj?url";
var BoundaryShape = /* @__PURE__ */ ((BoundaryShape2) => {
  BoundaryShape2[BoundaryShape2["NONE"] = 0] = "NONE";
  BoundaryShape2[BoundaryShape2["BOX"] = 1] = "BOX";
  BoundaryShape2[BoundaryShape2["SPHERE"] = 2] = "SPHERE";
  BoundaryShape2[BoundaryShape2["CYLINDER"] = 3] = "CYLINDER";
  BoundaryShape2[BoundaryShape2["DODECAHEDRON"] = 4] = "DODECAHEDRON";
  return BoundaryShape2;
})(BoundaryShape || {});
var CollisionMode = /* @__PURE__ */ ((CollisionMode2) => {
  CollisionMode2["REFLECT"] = "reflect";
  CollisionMode2["CLAMP"] = "clamp";
  CollisionMode2["WRAP"] = "wrap";
  CollisionMode2["KILL"] = "kill";
  return CollisionMode2;
})(CollisionMode || {});
var ParticleDistribution = /* @__PURE__ */ ((ParticleDistribution2) => {
  ParticleDistribution2["FREE"] = "free";
  ParticleDistribution2["VOLUME_FILL"] = "volume";
  ParticleDistribution2["SURFACE_SKIN"] = "surface";
  ParticleDistribution2["NORMAL_FLOW"] = "flow";
  return ParticleDistribution2;
})(ParticleDistribution || {});
class ViewportTracker {
  enabled = false;
  baseGridSize;
  exclusionZones = [];
  constructor(baseGridSize, enabled = false) {
    this.baseGridSize = baseGridSize.clone();
    this.enabled = enabled;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  calculateBounds() {
    if (!this.enabled) {
      return {
        screen: { width: window.innerWidth, height: window.innerHeight },
        safe: { width: window.innerWidth, height: window.innerHeight, x: 0, y: 0 },
        grid: {
          width: this.baseGridSize.x,
          height: this.baseGridSize.y,
          depth: this.baseGridSize.z
        }
      };
    }
    this.detectUIPanels();
    const maxLeft = this.exclusionZones.length > 0 ? Math.max(...this.exclusionZones.map((z) => z.left)) : 0;
    const maxRight = this.exclusionZones.length > 0 ? Math.max(...this.exclusionZones.map((z) => z.right)) : 0;
    const safeX = maxLeft;
    const safeWidth = window.innerWidth - maxLeft - maxRight;
    const safeHeight = window.innerHeight;
    const aspect = safeWidth / safeHeight;
    const gridWidth = this.baseGridSize.x * Math.max(1, aspect);
    const gridHeight = this.baseGridSize.y * Math.max(1, 1 / aspect);
    return {
      screen: { width: window.innerWidth, height: window.innerHeight },
      safe: { width: safeWidth, height: safeHeight, x: safeX, y: 0 },
      grid: { width: gridWidth, height: gridHeight, depth: this.baseGridSize.z }
    };
  }
  detectUIPanels() {
    this.exclusionZones = [];
    document.querySelectorAll(".glassmorphic-panel").forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      if (rect.left < window.innerWidth / 2) {
        this.exclusionZones.push({ left: rect.width, right: 0, top: 0, bottom: 0 });
      } else {
        this.exclusionZones.push({ left: 0, right: rect.width, top: 0, bottom: 0 });
      }
    });
  }
}
class MeshDeformer {
  originalVertices = null;
  deformConfig;
  constructor(config) {
    this.deformConfig = config;
  }
  initializeVertices(geometry) {
    const positions = geometry.attributes.position;
    this.originalVertices = new Float32Array(positions.array);
  }
  deform(geometry, audioData, elapsed) {
    if (!this.deformConfig.enabled || !this.originalVertices) return;
    const positions = geometry.attributes.position;
    const bass = audioData.bass || 0;
    const mid = audioData.mid || 0;
    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const x = this.originalVertices[i3];
      const y = this.originalVertices[i3 + 1];
      const z = this.originalVertices[i3 + 2];
      let displacement = 0;
      if (this.deformConfig.deformMode === "pulse") {
        displacement = bass * this.deformConfig.deformStrength;
      } else if (this.deformConfig.deformMode === "wave") {
        const phase = (x + y + z) * this.deformConfig.deformFrequency + elapsed;
        displacement = Math.sin(phase) * mid * this.deformConfig.deformStrength;
      } else if (this.deformConfig.deformMode === "noise") {
        displacement = (Math.random() - 0.5) * bass * this.deformConfig.deformStrength;
      }
      const normal = new THREE.Vector3(x, y, z).normalize();
      positions.array[i3] = x + normal.x * displacement;
      positions.array[i3 + 1] = y + normal.y * displacement;
      positions.array[i3 + 2] = z + normal.z * displacement;
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  updateConfig(config) {
    Object.assign(this.deformConfig, config);
  }
}
class BoundaryMaterialManager {
  config;
  constructor(initialConfig) {
    const defaults = {
      color: new THREE.Color(4500223),
      // Brighter blue
      opacity: 0.35,
      // More opaque for better visibility
      transmission: 0.65,
      // Reduced for better visibility
      ior: 1.5,
      thickness: 1,
      // Standard thickness
      roughness: 0.05,
      // Slight roughness
      metalness: 0,
      clearcoat: 0.5,
      // Reduced clearcoat
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color(4403),
      // Subtle blue glow
      emissiveIntensity: 0.1,
      // Subtle emission for visibility
      side: THREE.DoubleSide,
      // Advanced glass effects - DISABLED BY DEFAULT for stability
      dispersion: 0,
      // Can be enabled via panel
      chromaticAberration: 0,
      // Can be enabled via panel
      iridescence: 0,
      iridescenceIOR: 1.3,
      sheen: 0,
      sheenColor: new THREE.Color(16777215),
      specularIntensity: 1,
      specularColor: new THREE.Color(16777215)
    };
    this.config = { ...defaults };
    if (initialConfig) {
      Object.keys(initialConfig).forEach((key) => {
        const value = initialConfig[key];
        if (value !== void 0) {
          this.config[key] = value;
        }
      });
    }
  }
  createMaterial() {
    console.log("\u{1F3A8} Creating boundary material with config:", {
      color: this.config.color.getHexString(),
      opacity: this.config.opacity,
      transmission: this.config.transmission,
      ior: this.config.ior,
      emissiveIntensity: this.config.emissiveIntensity
    });
    try {
      const material = new MeshPhysicalNodeMaterial({
        // Core properties - guaranteed to work
        color: this.config.color,
        transparent: true,
        opacity: this.config.opacity,
        side: this.config.side,
        // Physical properties
        transmission: this.config.transmission,
        ior: this.config.ior,
        thickness: this.config.thickness,
        roughness: this.config.roughness,
        metalness: this.config.metalness,
        // Clearcoat
        clearcoat: this.config.clearcoat,
        clearcoatRoughness: this.config.clearcoatRoughness,
        // Emission
        emissive: this.config.emissive,
        emissiveIntensity: this.config.emissiveIntensity,
        // Advanced effects - only if non-zero
        ...this.config.dispersion > 0 && { dispersion: this.config.dispersion },
        ...this.config.iridescence > 0 && {
          iridescence: this.config.iridescence,
          iridescenceIOR: this.config.iridescenceIOR
        },
        ...this.config.sheen > 0 && {
          sheen: this.config.sheen,
          sheenColor: this.config.sheenColor
        },
        specularIntensity: this.config.specularIntensity,
        specularColor: this.config.specularColor
      });
      if (this.config.chromaticAberration > 0) {
        material.defines = material.defines || {};
        material.defines.USE_CHROMATIC_ABERRATION = "";
        material.userData = material.userData || {};
        material.userData.chromaticAberration = this.config.chromaticAberration;
      }
      console.log("\u2705 Material created successfully");
      return material;
    } catch (error) {
      console.error("\u274C Error creating material:", error);
      return new MeshPhysicalNodeMaterial({
        color: new THREE.Color(4500223),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
    }
  }
  updateProperty(key, value) {
    this.config[key] = value;
  }
  applyToMaterial(material) {
    material.color = this.config.color;
    material.opacity = this.config.opacity;
    material.transmission = this.config.transmission;
    material.ior = this.config.ior;
    material.thickness = this.config.thickness;
    material.roughness = this.config.roughness;
    material.metalness = this.config.metalness;
    material.clearcoat = this.config.clearcoat;
    material.clearcoatRoughness = this.config.clearcoatRoughness;
    material.emissive = this.config.emissive;
    material.emissiveIntensity = this.config.emissiveIntensity;
    material.dispersion = this.config.dispersion;
    material.iridescence = this.config.iridescence;
    material.iridescenceIOR = this.config.iridescenceIOR;
    material.sheen = this.config.sheen;
    material.sheenColor = this.config.sheenColor;
    material.specularIntensity = this.config.specularIntensity;
    material.specularColor = this.config.specularColor;
    if (this.config.chromaticAberration > 0) {
      material.defines = material.defines || {};
      material.defines.USE_CHROMATIC_ABERRATION = "";
      material.userData = material.userData || {};
      material.userData.chromaticAberration = this.config.chromaticAberration;
    }
    material.needsUpdate = true;
  }
}
class ParticleBoundaries {
  // Grid and transforms
  gridSize;
  gridCenter;
  // Current state
  shape = 0 /* NONE */;
  enabled = false;
  visualize = false;
  // Physics parameters
  wallThickness;
  wallStiffness;
  restitution;
  friction;
  collisionMode = "reflect" /* REFLECT */;
  // Boundary limits
  min;
  max;
  radius;
  // Visual container
  object;
  boundaryMesh = null;
  glassMaterial = null;
  // Audio reactivity
  audioReactive;
  audioPulseStrength;
  viewportPulse = 0;
  // Viewport tracking (optional)
  viewportTracker = null;
  useViewportTracking = false;
  // NEW: Particle distribution
  distributionMode = "free" /* FREE */;
  surfaceDistance = 1;
  flowSpeed = 0.5;
  // NEW: Mesh deformation
  meshDeformer = null;
  deformationConfig;
  // NEW: Material management
  materialManager;
  constructor(config = {}) {
    const {
      gridSize = new THREE.Vector3(64, 64, 64),
      wallThickness = 2,
      wallStiffness = 0.5,
      restitution = 0.3,
      friction = 0.1,
      visualize = false,
      audioReactive = false,
      audioPulseStrength = 0.15,
      useViewportTracking = false,
      // IGNORED - always false now
      particleDistribution = "free" /* FREE */,
      surfaceDistance = 1,
      flowSpeed = 0.5,
      materialConfig,
      deformationConfig
    } = config;
    this.gridSize = gridSize.clone();
    this.gridCenter = new THREE.Vector3(
      this.gridSize.x / 2,
      this.gridSize.y / 2,
      this.gridSize.z / 2
    );
    this.wallThickness = wallThickness;
    this.wallStiffness = wallStiffness;
    this.restitution = restitution;
    this.friction = friction;
    this.visualize = visualize;
    this.audioReactive = audioReactive;
    this.audioPulseStrength = audioPulseStrength;
    this.useViewportTracking = false;
    this.viewportTracker = null;
    this.distributionMode = particleDistribution;
    this.surfaceDistance = surfaceDistance;
    this.flowSpeed = flowSpeed;
    this.deformationConfig = {
      enabled: false,
      audioReactive: false,
      deformStrength: 0.1,
      deformFrequency: 1,
      deformMode: "pulse",
      ...deformationConfig
    };
    this.materialManager = new BoundaryMaterialManager(materialConfig);
    this.min = new THREE.Vector3();
    this.max = new THREE.Vector3();
    this.radius = Math.min(gridSize.x, gridSize.y, gridSize.z) / 2;
    this.object = new THREE.Object3D();
    this.object.name = "ParticleBoundaries";
    this.updateBoundaryLimits();
    console.log("\u{1F537} ParticleBoundaries: Geometry-based mode (viewport tracking DISABLED)");
    console.log(`\u{1F537} Grid: size=${this.gridSize.toArray()}, center=${this.gridCenter.toArray()}`);
  }
  /**
   * Initialize boundary system
   */
  async init() {
    console.log("\u{1F537} ParticleBoundaries: Initialized");
  }
  // ==================== SHAPE MANAGEMENT ====================
  /**
   * Set boundary shape - GEOMETRY-BASED (no viewport influence)
   */
  async setShape(shape) {
    console.log(`
\u{1F537} ========== SETTING SHAPE: ${BoundaryShape[shape]} ==========`);
    this.shape = shape;
    this.gridCenter.set(
      this.gridSize.x / 2,
      this.gridSize.y / 2,
      this.gridSize.z / 2
    );
    console.log(`\u{1F537} Grid (FIXED): size=[${this.gridSize.toArray().join(", ")}]`);
    console.log(`\u{1F537} Grid (FIXED): center=[${this.gridCenter.toArray().join(", ")}]`);
    switch (shape) {
      case 1 /* BOX */:
        this.min.set(this.wallThickness, this.wallThickness, this.wallThickness);
        this.max.set(
          this.gridSize.x - this.wallThickness,
          this.gridSize.y - this.wallThickness,
          this.gridSize.z - this.wallThickness
        );
        console.log(`\u{1F537} Box collision bounds:`);
        console.log(`\u{1F537}   min=[${this.min.toArray().join(", ")}]`);
        console.log(`\u{1F537}   max=[${this.max.toArray().join(", ")}]`);
        break;
      case 2 /* SPHERE */:
      case 4 /* DODECAHEDRON */:
        this.radius = Math.min(this.gridSize.x, this.gridSize.y, this.gridSize.z) / 2 - this.wallThickness;
        console.log(`\u{1F537} Sphere collision:`);
        console.log(`\u{1F537}   center=[${this.gridCenter.toArray().join(", ")}]`);
        console.log(`\u{1F537}   radius=${this.radius}`);
        break;
      case 3 /* CYLINDER */:
        this.radius = Math.min(this.gridSize.x, this.gridSize.y) / 2 - this.wallThickness;
        this.min.set(this.wallThickness, this.wallThickness, this.wallThickness);
        this.max.set(
          this.gridSize.x - this.wallThickness,
          this.gridSize.y - this.wallThickness,
          this.gridSize.z - this.wallThickness
        );
        console.log(`\u{1F537} Cylinder collision:`);
        console.log(`\u{1F537}   center=[${this.gridCenter.toArray().join(", ")}]`);
        console.log(`\u{1F537}   XY radius=${this.radius}`);
        console.log(`\u{1F537}   Z bounds=[${this.min.z}, ${this.max.z}]`);
        break;
      case 0 /* NONE */:
        this.radius = Math.min(this.gridSize.x, this.gridSize.y, this.gridSize.z) / 2 * 2;
        console.log(`\u{1F537} Free-floating: Ultra-large spherical zone with minimal forces`);
        console.log(`\u{1F537}   center=[${this.gridCenter.toArray().join(", ")}]`);
        console.log(`\u{1F537}   comfortZone (90%)=${this.radius * 0.9}, maxRadius=${this.radius}`);
        break;
    }
    if (this.visualize && shape !== 0 /* NONE */) {
      console.log(`\u{1F537} Creating visual mesh...`);
      await this.updateVisualMesh();
    } else if (this.boundaryMesh) {
      console.log(`\u{1F537} Removing visual mesh (shape=NONE or visualize=false)`);
      this.object.remove(this.boundaryMesh);
      this.boundaryMesh.geometry.dispose();
      if (this.glassMaterial) this.glassMaterial.dispose();
      this.boundaryMesh = null;
      this.glassMaterial = null;
    }
    console.log(`\u{1F537} \u2705 Shape set complete: ${BoundaryShape[shape]}`);
    console.log(`\u{1F537} \u26A0\uFE0F  IMPORTANT: Call updateBoundaryUniforms() to sync to GPU!
`);
  }
  /**
   * Set enabled state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  /**
   * Set visualization enabled/disabled
   */
  setVisible(visible) {
    if (this.boundaryMesh) {
      this.boundaryMesh.visible = visible;
    }
  }
  /**
   * Refresh viewport - DEPRECATED (viewport tracking removed)
   */
  refreshViewport() {
    console.warn("\u{1F537} refreshViewport() called but viewport tracking is disabled");
  }
  // ==================== PHYSICS PARAMETERS ====================
  setWallStiffness(value) {
    this.wallStiffness = THREE.MathUtils.clamp(value, 0, 1);
  }
  setWallThickness(value) {
    this.wallThickness = Math.max(0.1, value);
    this.updateBoundaryLimits();
  }
  setRestitution(value) {
    this.restitution = THREE.MathUtils.clamp(value, 0, 1);
  }
  setFriction(value) {
    this.friction = THREE.MathUtils.clamp(value, 0, 1);
  }
  setCollisionMode(mode) {
    this.collisionMode = mode;
  }
  updateBoundaryLimits() {
    this.min.set(
      this.wallThickness,
      this.wallThickness,
      this.wallThickness
    );
    this.max.set(
      this.gridSize.x - this.wallThickness,
      this.gridSize.y - this.wallThickness,
      this.gridSize.z - this.wallThickness
    );
  }
  // ==================== VISUAL MESH METHODS ====================
  /**
   * Create or update visual boundary mesh
   */
  async updateVisualMesh() {
    console.log(`\u{1F537} updateVisualMesh: Updating to ${BoundaryShape[this.shape]}`);
    while (this.object.children.length > 0) {
      const child = this.object.children[0];
      this.object.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      console.log(`\u{1F537} Removed old mesh: ${child.name}`);
    }
    if (this.boundaryMesh) {
      this.boundaryMesh.geometry.dispose();
      if (this.glassMaterial) {
        this.glassMaterial.dispose();
      }
      this.boundaryMesh = null;
      this.glassMaterial = null;
    }
    console.log(`\u{1F537} Creating new mesh for: ${BoundaryShape[this.shape]}`);
    switch (this.shape) {
      case 1 /* BOX */:
        await this.createBoxMesh();
        break;
      case 2 /* SPHERE */:
        this.createSphereMesh();
        break;
      case 3 /* CYLINDER */:
        this.createCylinderMesh();
        break;
      case 4 /* DODECAHEDRON */:
        this.createDodecahedronMesh();
        break;
    }
    if (this.boundaryMesh) {
      const mesh = this.boundaryMesh;
      const meshName = mesh.name || "BoundaryMesh";
      console.log(`\u{1F537} Adding new mesh: ${meshName}`);
      mesh.visible = true;
      mesh.frustumCulled = false;
      mesh.renderOrder = 100;
      if (this.glassMaterial) {
        this.glassMaterial.transparent = true;
        this.glassMaterial.depthWrite = true;
        this.glassMaterial.depthTest = true;
        this.glassMaterial.needsUpdate = true;
        console.log(`\u{1F3A8} Material settings:`, {
          visible: mesh.visible,
          transparent: this.glassMaterial.transparent,
          opacity: this.glassMaterial.opacity,
          transmission: this.glassMaterial.transmission,
          color: this.glassMaterial.color.getHexString(),
          depthWrite: this.glassMaterial.depthWrite,
          depthTest: this.glassMaterial.depthTest
        });
      }
      this.object.add(mesh);
      this.updateMeshTransform();
      console.log(`\u{1F537} Mesh hierarchy: object has ${this.object.children.length} children`);
      console.log(`\u{1F537} \u2705 Mesh ${meshName} added and visible: ${mesh.visible}`);
      if (this.deformationConfig.enabled && mesh !== null) {
        this.meshDeformer = new MeshDeformer(this.deformationConfig);
        this.meshDeformer.initializeVertices(mesh.geometry);
        console.log(`\u{1F537} Mesh deformer initialized`);
      }
    } else {
      console.warn(`\u{1F537} WARNING: boundaryMesh is null after creation!`);
    }
  }
  async createBoxMesh() {
    const loader = new OBJLoader();
    const objectRaw = await new Promise((resolve, reject) => {
      loader.load(boxObjUrl, resolve, void 0, reject);
    });
    const loadedMesh = objectRaw.children[0];
    const geometry = loadedMesh.geometry;
    this.glassMaterial = this.createGlassMaterial();
    this.boundaryMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.boundaryMesh.name = "BoundaryBox";
  }
  createSphereMesh() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    this.glassMaterial = this.createGlassMaterial();
    this.boundaryMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.boundaryMesh.name = "BoundarySphere";
  }
  createCylinderMesh() {
    const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
    geometry.rotateX(Math.PI / 2);
    this.glassMaterial = this.createGlassMaterial();
    this.boundaryMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.boundaryMesh.name = "BoundaryCylinder";
  }
  createDodecahedronMesh() {
    const geometry = new THREE.DodecahedronGeometry(1, 0);
    this.glassMaterial = this.createGlassMaterial();
    this.boundaryMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.boundaryMesh.name = "BoundaryDodecahedron";
  }
  /**
   * Create glass material using material manager
   */
  createGlassMaterial() {
    return this.materialManager.createMaterial();
  }
  /**
   * SIMPLIFIED: Update mesh transform to DIRECTLY match collision bounds
   * NO coordinate conversion - mesh is in same space as collision
   */
  updateMeshTransform() {
    if (!this.boundaryMesh) return;
    this.boundaryMesh.position.copy(this.gridCenter);
    if (this.shape === 2 /* SPHERE */ || this.shape === 4 /* DODECAHEDRON */) {
      this.boundaryMesh.scale.setScalar(this.radius);
    } else if (this.shape === 3 /* CYLINDER */) {
      const collisionHeight = this.max.z - this.min.z;
      this.boundaryMesh.scale.set(
        this.radius,
        // X: collision radius
        this.radius,
        // Y: collision radius  
        collisionHeight / 2
        // Z: half height (geometry is height=2, so divide by 2)
      );
    } else if (this.shape === 1 /* BOX */) {
      const halfX = this.gridSize.x / 2;
      const halfY = this.gridSize.y / 2;
      const halfZ = this.gridSize.z / 2;
      this.boundaryMesh.scale.set(halfX, halfY, halfZ);
    }
    console.log(`\u{1F537} Mesh transform DIRECT: shape=${BoundaryShape[this.shape]}`);
    console.log(`\u{1F537}   Position: [${this.boundaryMesh.position.toArray().join(", ")}]`);
    console.log(`\u{1F537}   Scale: [${this.boundaryMesh.scale.toArray().join(", ")}]`);
    console.log(`\u{1F537}   Collision center: [${this.gridCenter.toArray().join(", ")}]`);
    console.log(`\u{1F537}   Collision radius: ${this.radius}`);
  }
  // ==================== SECTION 3: COLLISION PHYSICS ====================
  /**
   * Generate TSL collision code for GPU compute shader
   * Uses gentle forces and penetration limits for stability
   */
  generateCollisionTSL(particlePosition, particleVelocity, uniforms) {
    const xN = particlePosition.add(particleVelocity.mul(uniforms.dt).mul(3));
    const shouldApplyCollision = uniforms.enabled ? uniforms.enabled.equal(int(1)) : true;
    If(shouldApplyCollision, () => {
      If(uniforms.shapeType.equal(int(0)), () => {
        const freeCenter = uniforms.shapeCenter;
        const freeSafeZone = uniforms.shapeRadius;
        const freeOffset = particlePosition.sub(freeCenter);
        const freeDist = freeOffset.length();
        const freeComfortZone = freeSafeZone.mul(0.9);
        If(freeDist.greaterThan(freeComfortZone), () => {
          const freeOvershoot = freeDist.sub(freeComfortZone);
          const freeGravity = float(2e-3);
          const freePullDir = freeOffset.normalize();
          particleVelocity.subAssign(freePullDir.mul(freeOvershoot).mul(freeGravity));
        });
      });
      If(uniforms.shapeType.equal(int(1)), () => {
        const boxMin = uniforms.shapeMin;
        const boxMax = uniforms.shapeMax;
        const boxStiffness = float(0.2);
        If(xN.x.lessThan(boxMin.x), () => {
          const penetration = boxMin.x.sub(xN.x).clamp(0, 3);
          particleVelocity.x.addAssign(penetration.mul(boxStiffness));
        });
        If(xN.x.greaterThan(boxMax.x), () => {
          const penetration = boxMax.x.sub(xN.x).clamp(-3, 0);
          particleVelocity.x.addAssign(penetration.mul(boxStiffness));
        });
        If(xN.y.lessThan(boxMin.y), () => {
          const penetration = boxMin.y.sub(xN.y).clamp(0, 3);
          particleVelocity.y.addAssign(penetration.mul(boxStiffness));
        });
        If(xN.y.greaterThan(boxMax.y), () => {
          const penetration = boxMax.y.sub(xN.y).clamp(-3, 0);
          particleVelocity.y.addAssign(penetration.mul(boxStiffness));
        });
        If(xN.z.lessThan(boxMin.z), () => {
          const penetration = boxMin.z.sub(xN.z).clamp(0, 3);
          particleVelocity.z.addAssign(penetration.mul(boxStiffness));
        });
        If(xN.z.greaterThan(boxMax.z), () => {
          const penetration = boxMax.z.sub(xN.z).clamp(-3, 0);
          particleVelocity.z.addAssign(penetration.mul(boxStiffness));
        });
        const boxCurrentX = particlePosition.x;
        const boxCurrentY = particlePosition.y;
        const boxCurrentZ = particlePosition.z;
        If(boxCurrentX.lessThan(boxMin.x), () => {
          particlePosition.x.assign(boxMin.x);
        });
        If(boxCurrentX.greaterThan(boxMax.x), () => {
          particlePosition.x.assign(boxMax.x);
        });
        If(boxCurrentY.lessThan(boxMin.y), () => {
          particlePosition.y.assign(boxMin.y);
        });
        If(boxCurrentY.greaterThan(boxMax.y), () => {
          particlePosition.y.assign(boxMax.y);
        });
        If(boxCurrentZ.lessThan(boxMin.z), () => {
          particlePosition.z.assign(boxMin.z);
        });
        If(boxCurrentZ.greaterThan(boxMax.z), () => {
          particlePosition.z.assign(boxMax.z);
        });
      });
      If(uniforms.shapeType.equal(int(2)), () => {
        const sphereCenter = uniforms.shapeCenter;
        const sphereRadius = uniforms.shapeRadius;
        const sphereStiffness = float(0.2);
        const sphereOffset = xN.sub(sphereCenter);
        const sphereDist = sphereOffset.length();
        If(sphereDist.greaterThan(sphereRadius), () => {
          const sphereNormal = sphereOffset.normalize();
          const spherePenetration = sphereDist.sub(sphereRadius).clamp(0, 3);
          particleVelocity.subAssign(sphereNormal.mul(spherePenetration).mul(sphereStiffness));
        });
        const sphereCurrentOffset = particlePosition.sub(sphereCenter);
        const sphereCurrentDist = sphereCurrentOffset.length();
        If(sphereCurrentDist.greaterThan(sphereRadius), () => {
          const sphereCurrentNormal = sphereCurrentOffset.normalize();
          particlePosition.assign(sphereCenter.add(sphereCurrentNormal.mul(sphereRadius)));
        });
      });
      If(uniforms.shapeType.equal(int(3)), () => {
        const cylCenter = uniforms.shapeCenter;
        const cylRadius = uniforms.shapeRadius;
        const cylMin = uniforms.shapeMin;
        const cylMax = uniforms.shapeMax;
        const cylStiffness = float(0.2);
        const cylDX = xN.x.sub(cylCenter.x);
        const cylDY = xN.y.sub(cylCenter.y);
        const cylOffsetXY = vec2(cylDX, cylDY);
        const cylDistXY = cylOffsetXY.length();
        If(cylDistXY.greaterThan(cylRadius), () => {
          const cylPenetration = cylDistXY.sub(cylRadius).clamp(0, 3);
          const cylNormalX = cylDX.div(cylDistXY);
          const cylNormalY = cylDY.div(cylDistXY);
          particleVelocity.x.subAssign(cylNormalX.mul(cylPenetration).mul(cylStiffness));
          particleVelocity.y.subAssign(cylNormalY.mul(cylPenetration).mul(cylStiffness));
        });
        If(xN.z.lessThan(cylMin.z), () => {
          const cylZPenMin = cylMin.z.sub(xN.z).clamp(0, 3);
          particleVelocity.z.addAssign(cylZPenMin.mul(cylStiffness));
        });
        If(xN.z.greaterThan(cylMax.z), () => {
          const cylZPenMax = cylMax.z.sub(xN.z).clamp(-3, 0);
          particleVelocity.z.addAssign(cylZPenMax.mul(cylStiffness));
        });
        const cylCurrentDX = particlePosition.x.sub(cylCenter.x);
        const cylCurrentDY = particlePosition.y.sub(cylCenter.y);
        const cylCurrentOffsetXY = vec2(cylCurrentDX, cylCurrentDY);
        const cylCurrentDistXY = cylCurrentOffsetXY.length();
        If(cylCurrentDistXY.greaterThan(cylRadius), () => {
          const cylCurrentNX = cylCurrentDX.div(cylCurrentDistXY);
          const cylCurrentNY = cylCurrentDY.div(cylCurrentDistXY);
          particlePosition.x.assign(cylCenter.x.add(cylCurrentNX.mul(cylRadius)));
          particlePosition.y.assign(cylCenter.y.add(cylCurrentNY.mul(cylRadius)));
        });
        If(particlePosition.z.lessThan(cylMin.z), () => {
          particlePosition.z.assign(cylMin.z);
        });
        If(particlePosition.z.greaterThan(cylMax.z), () => {
          particlePosition.z.assign(cylMax.z);
        });
      });
      If(uniforms.shapeType.equal(int(4)), () => {
        const dodecaCenter = uniforms.shapeCenter;
        const dodecaRadius = uniforms.shapeRadius;
        const dodecaStiffness = float(0.2);
        const dodecaOffset = xN.sub(dodecaCenter);
        const dodecaDist = dodecaOffset.length();
        If(dodecaDist.greaterThan(dodecaRadius), () => {
          const dodecaNormal = dodecaOffset.normalize();
          const dodecaPenetration = dodecaDist.sub(dodecaRadius).clamp(0, 3);
          particleVelocity.subAssign(dodecaNormal.mul(dodecaPenetration).mul(dodecaStiffness));
        });
        const dodecaCurrentOffset = particlePosition.sub(dodecaCenter);
        const dodecaCurrentDist = dodecaCurrentOffset.length();
        If(dodecaCurrentDist.greaterThan(dodecaRadius), () => {
          const dodecaCurrentNormal = dodecaCurrentOffset.normalize();
          particlePosition.assign(dodecaCenter.add(dodecaCurrentNormal.mul(dodecaRadius)));
        });
      });
    });
    particleVelocity.mulAssign(uniforms.damping);
  }
  // ==================== UPDATE & AUDIO ====================
  /**
   * Update boundary system (audio reactivity, etc.)
   */
  update(elapsed, audioData) {
    if (this.meshDeformer && this.boundaryMesh && audioData && this.deformationConfig.audioReactive) {
      this.meshDeformer.deform(this.boundaryMesh.geometry, audioData, elapsed);
    }
    if (this.audioReactive && audioData) {
      const bass = audioData.bass || 0;
      const beatIntensity = audioData.beatIntensity || 0;
      this.viewportPulse = bass * this.audioPulseStrength + beatIntensity * 0.1;
      if (this.boundaryMesh && this.shape !== 0 /* NONE */ && !this.deformationConfig.enabled) {
        const pulseScale = 1 + this.viewportPulse * 0.1;
        const baseScale = this.boundaryMesh.scale.clone().normalize();
        this.boundaryMesh.scale.copy(baseScale).multiplyScalar(pulseScale);
      }
    }
  }
  // ==================== GETTERS ====================
  /**
   * Get boundary uniforms for GPU
   */
  getBoundaryUniforms() {
    return {
      enabled: this.enabled,
      shapeInt: this.shape,
      wallMin: this.min.clone(),
      wallMax: this.max.clone(),
      gridCenter: this.gridCenter.clone(),
      boundaryRadius: this.radius,
      wallStiffness: this.wallStiffness,
      viewportPulse: this.viewportPulse,
      // NEW: Distribution mode parameters
      distributionMode: this.getDistributionModeInt(),
      surfaceDistance: this.surfaceDistance,
      flowSpeed: this.flowSpeed
    };
  }
  /**
   * Convert distribution mode to integer for GPU
   */
  getDistributionModeInt() {
    switch (this.distributionMode) {
      case "free" /* FREE */:
        return 0;
      case "volume" /* VOLUME_FILL */:
        return 1;
      case "surface" /* SURFACE_SKIN */:
        return 2;
      case "flow" /* NORMAL_FLOW */:
        return 3;
      default:
        return 0;
    }
  }
  getShapeAsInt() {
    return this.shape;
  }
  /**
   * Get spawn bounds for particle initialization
   * Returns min/max bounds that particles should spawn within
   */
  getSpawnBounds() {
    return {
      min: this.min.clone(),
      max: this.max.clone(),
      center: this.gridCenter.clone(),
      radius: this.radius
    };
  }
  /**
   * Check if a position is inside the current boundary
   */
  isPositionInside(position) {
    switch (this.shape) {
      case 1 /* BOX */:
        return position.x >= this.min.x && position.x <= this.max.x && position.y >= this.min.y && position.y <= this.max.y && position.z >= this.min.z && position.z <= this.max.z;
      case 2 /* SPHERE */:
      case 4 /* DODECAHEDRON */:
        const distFromCenter = position.distanceTo(this.gridCenter);
        return distFromCenter <= this.radius;
      case 3 /* CYLINDER */:
        const offsetXY = new THREE.Vector2(
          position.x - this.gridCenter.x,
          position.y - this.gridCenter.y
        );
        const radialDist = offsetXY.length();
        return radialDist <= this.radius && position.z >= this.min.z && position.z <= this.max.z;
      case 0 /* NONE */:
      default:
        const freeDist = position.distanceTo(this.gridCenter);
        return freeDist <= this.radius;
    }
  }
  /**
   * Get a random position inside the boundary
   * Useful for spawning or repositioning particles
   */
  getRandomPositionInside() {
    const maxAttempts = 100;
    let position = new THREE.Vector3();
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      switch (this.shape) {
        case 1 /* BOX */:
          position.set(
            THREE.MathUtils.lerp(this.min.x + 2, this.max.x - 2, Math.random()),
            THREE.MathUtils.lerp(this.min.y + 2, this.max.y - 2, Math.random()),
            THREE.MathUtils.lerp(this.min.z + 2, this.max.z - 2, Math.random())
          );
          return position;
        case 2 /* SPHERE */:
        case 4 /* DODECAHEDRON */:
          const r = Math.cbrt(Math.random()) * (this.radius - 2);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          position.set(
            this.gridCenter.x + r * Math.sin(phi) * Math.cos(theta),
            this.gridCenter.y + r * Math.sin(phi) * Math.sin(theta),
            this.gridCenter.z + r * Math.cos(phi)
          );
          return position;
        case 3 /* CYLINDER */:
          const cylR = Math.sqrt(Math.random()) * (this.radius - 2);
          const cylTheta = Math.random() * Math.PI * 2;
          position.set(
            this.gridCenter.x + cylR * Math.cos(cylTheta),
            this.gridCenter.y + cylR * Math.sin(cylTheta),
            THREE.MathUtils.lerp(this.min.z + 2, this.max.z - 2, Math.random())
          );
          return position;
        case 0 /* NONE */:
        default:
          const freeR = Math.cbrt(Math.random()) * (this.radius * 0.7);
          const freeTheta = Math.random() * Math.PI * 2;
          const freePhi = Math.acos(2 * Math.random() - 1);
          position.set(
            this.gridCenter.x + freeR * Math.sin(freePhi) * Math.cos(freeTheta),
            this.gridCenter.y + freeR * Math.sin(freePhi) * Math.sin(freeTheta),
            this.gridCenter.z + freeR * Math.cos(freePhi)
          );
          return position;
      }
    }
    return this.gridCenter.clone();
  }
  // ==================== NEW: DISTRIBUTION MODE CONTROL ====================
  /**
   * Set particle distribution mode
   */
  setDistributionMode(mode) {
    this.distributionMode = mode;
    console.log(`\u{1F537} Distribution mode set to: ${mode}`);
  }
  /**
   * Set surface distance for SURFACE_SKIN mode
   */
  setSurfaceDistance(distance) {
    this.surfaceDistance = Math.max(0.1, distance);
    console.log(`\u{1F537} Surface distance set to: ${this.surfaceDistance}`);
  }
  /**
   * Set flow speed for NORMAL_FLOW mode
   */
  setFlowSpeed(speed) {
    this.flowSpeed = Math.max(0, speed);
    console.log(`\u{1F537} Flow speed set to: ${this.flowSpeed}`);
  }
  // ==================== NEW: DEFORMATION CONTROL ====================
  /**
   * Enable or disable mesh deformation
   */
  setDeformationEnabled(enabled) {
    this.deformationConfig.enabled = enabled;
    if (enabled && !this.meshDeformer && this.boundaryMesh) {
      this.meshDeformer = new MeshDeformer(this.deformationConfig);
      this.meshDeformer.initializeVertices(this.boundaryMesh.geometry);
      console.log(`\u{1F537} Mesh deformer enabled`);
    } else if (!enabled && this.meshDeformer) {
      this.meshDeformer = null;
      console.log(`\u{1F537} Mesh deformer disabled`);
    }
  }
  /**
   * Set deformation mode (pulse, wave, noise)
   */
  setDeformMode(mode) {
    this.deformationConfig.deformMode = mode;
    if (this.meshDeformer) {
      this.meshDeformer.updateConfig({ deformMode: mode });
    }
    console.log(`\u{1F537} Deform mode set to: ${mode}`);
  }
  /**
   * Set deformation strength
   */
  setDeformStrength(strength) {
    this.deformationConfig.deformStrength = THREE.MathUtils.clamp(strength, 0, 1);
    if (this.meshDeformer) {
      this.meshDeformer.updateConfig({ deformStrength: this.deformationConfig.deformStrength });
    }
    console.log(`\u{1F537} Deform strength set to: ${this.deformationConfig.deformStrength}`);
  }
  /**
   * Set deformation frequency
   */
  setDeformFrequency(frequency) {
    this.deformationConfig.deformFrequency = Math.max(0.1, frequency);
    if (this.meshDeformer) {
      this.meshDeformer.updateConfig({ deformFrequency: this.deformationConfig.deformFrequency });
    }
    console.log(`\u{1F537} Deform frequency set to: ${this.deformationConfig.deformFrequency}`);
  }
  /**
   * Enable/disable audio reactivity for deformation
   */
  setDeformAudioReactive(enabled) {
    this.deformationConfig.audioReactive = enabled;
    if (this.meshDeformer) {
      this.meshDeformer.updateConfig({ audioReactive: enabled });
    }
    console.log(`\u{1F537} Deform audio reactivity: ${enabled ? "enabled" : "disabled"}`);
  }
  // ==================== NEW: MATERIAL CONTROL ====================
  /**
   * Set material property
   */
  setMaterialProperty(key, value) {
    this.materialManager.updateProperty(key, value);
    if (this.glassMaterial) {
      this.materialManager.applyToMaterial(this.glassMaterial);
    }
    console.log(`\u{1F537} Material ${key} set to: ${value}`);
  }
  /**
   * Set material color
   */
  setMaterialColor(color) {
    this.setMaterialProperty("color", color);
  }
  /**
   * Set transmission (glass transparency)
   */
  setTransmission(value) {
    this.setMaterialProperty("transmission", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set index of refraction (IOR)
   */
  setIOR(value) {
    this.setMaterialProperty("ior", THREE.MathUtils.clamp(value, 1, 2.5));
  }
  /**
   * Set material thickness
   */
  setThickness(value) {
    this.setMaterialProperty("thickness", Math.max(0, value));
  }
  /**
   * Set material opacity
   */
  setOpacity(value) {
    this.setMaterialProperty("opacity", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set material roughness
   */
  setRoughness(value) {
    this.setMaterialProperty("roughness", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set emissive color
   */
  setEmissive(color) {
    this.setMaterialProperty("emissive", color);
  }
  /**
   * Set emissive intensity
   */
  setEmissiveIntensity(value) {
    this.setMaterialProperty("emissiveIntensity", Math.max(0, value));
  }
  // ==================== NEW: ADVANCED GLASS EFFECTS ====================
  /**
   * Set light dispersion (prism effect)
   */
  setDispersion(value) {
    this.setMaterialProperty("dispersion", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set chromatic aberration strength
   */
  setChromaticAberration(value) {
    this.setMaterialProperty("chromaticAberration", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set iridescence intensity
   */
  setIridescence(value) {
    this.setMaterialProperty("iridescence", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set iridescence IOR
   */
  setIridescenceIOR(value) {
    this.setMaterialProperty("iridescenceIOR", THREE.MathUtils.clamp(value, 1, 2.5));
  }
  /**
   * Set sheen intensity
   */
  setSheen(value) {
    this.setMaterialProperty("sheen", THREE.MathUtils.clamp(value, 0, 1));
  }
  /**
   * Set sheen color
   */
  setSheenColor(color) {
    this.setMaterialProperty("sheenColor", color);
  }
  /**
   * Set specular intensity
   */
  setSpecularIntensity(value) {
    this.setMaterialProperty("specularIntensity", Math.max(0, value));
  }
  /**
   * Set specular color
   */
  setSpecularColor(color) {
    this.setMaterialProperty("specularColor", color);
  }
  // ==================== CLEANUP ====================
  dispose() {
    if (this.boundaryMesh) {
      this.object.remove(this.boundaryMesh);
      this.boundaryMesh.geometry.dispose();
      if (this.glassMaterial) {
        this.glassMaterial.dispose();
      }
      this.boundaryMesh = null;
      this.glassMaterial = null;
    }
  }
}
export {
  BoundaryShape,
  CollisionMode,
  ParticleBoundaries,
  ParticleDistribution
};
