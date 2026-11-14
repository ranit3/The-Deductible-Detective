import * as THREE from 'three';

export interface RaycastHitInfo {
  clueId: string;
  name: string;
  mesh: THREE.Mesh;
  point: THREE.Vector3;
}

/**
 * LAYER 2: INTERACTION RAYCASTER
 * Raycasts from mouse pointer to interactive clue objects.
 * Handles hover emission highlighting, cursor changes, and click inspection.
 */
export class InteractionRaycaster {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private targets: THREE.Object3D[] = [];
  private currentHit: RaycastHitInfo | null = null;
  private hoveredMeshes: THREE.Mesh[] = [];

  // Track original emissive color and intensity for highlighted meshes
  private originalMaterials: Map<
    THREE.Mesh,
    { emissive: THREE.Color; emissiveIntensity: number }
  > = new Map();

  private pointerDownPos = { x: 0, y: 0 };
  private pointerDownTime = 0;
  public isEnabled: boolean = true;

  // Callbacks
  public onHoverChange?: (hit: RaycastHitInfo | null, screenX: number, screenY: number) => void;
  public onInteract?: (clueId: string, hit: RaycastHitInfo) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);

    this.bindEvents();
  }

  public setTargets(targets: THREE.Object3D[]) {
    this.targets = targets;
  }

  public addTarget(target: THREE.Object3D) {
    if (!this.targets.includes(target)) {
      this.targets.push(target);
    }
  }

  private bindEvents() {
    this.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.domElement.addEventListener('pointerleave', this.onPointerLeave.bind(this));
  }

  private getNormalizedCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  private onPointerMove(e: PointerEvent) {
    if (!this.isEnabled) {
      this.clearHighlight();
      return;
    }

    const { x, y } = this.getNormalizedCoords(e);
    this.mouse.set(x, y);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.targets, true);

    let foundHit: RaycastHitInfo | null = null;

    for (const hit of intersects) {
      const obj = hit.object;
      const clueId = this.findClueId(obj);
      if (clueId) {
        const name = this.findClueName(obj) || 'Evidence Item';
        foundHit = {
          clueId,
          name,
          mesh: obj as THREE.Mesh,
          point: hit.point
        };
        break;
      }
    }

    if (foundHit) {
      if (!this.currentHit || this.currentHit.clueId !== foundHit.clueId) {
        this.clearHighlight();
        this.currentHit = foundHit;
        this.applyHighlight(foundHit);
      }
      this.domElement.style.cursor = 'pointer';
      if (this.onHoverChange) {
        this.onHoverChange(foundHit, e.clientX, e.clientY);
      }
    } else {
      if (this.currentHit) {
        this.clearHighlight();
        this.currentHit = null;
        this.domElement.style.cursor = 'default';
        if (this.onHoverChange) {
          this.onHoverChange(null, e.clientX, e.clientY);
        }
      }
    }
  }

  private onPointerDown(e: PointerEvent) {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.pointerDownTime = performance.now();
  }

  private onPointerUp(e: PointerEvent) {
    if (!this.isEnabled) return;

    // Check if this was a click rather than a camera drag
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    const dt = performance.now() - this.pointerDownTime;
    if (dist > 8 || dt > 1200) {
      return; // Was camera rotation or long hold
    }

    // Raycast on click position
    const { x, y } = this.getNormalizedCoords(e);
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersects = this.raycaster.intersectObjects(this.targets, true);

    for (const hit of intersects) {
      const clueId = this.findClueId(hit.object);
      if (clueId) {
        const name = this.findClueName(hit.object) || 'Evidence Item';
        const hitInfo: RaycastHitInfo = {
          clueId,
          name,
          mesh: hit.object as THREE.Mesh,
          point: hit.point
        };

        // Trigger flash feedback
        this.pulseFeedback(hit.object as THREE.Mesh);

        if (this.onInteract) {
          this.onInteract(clueId, hitInfo);
        }
        break;
      }
    }
  }

  private onPointerLeave() {
    this.clearHighlight();
    this.currentHit = null;
    this.domElement.style.cursor = 'default';
    if (this.onHoverChange) {
      this.onHoverChange(null, 0, 0);
    }
  }

  private findClueId(obj: THREE.Object3D): string | null {
    let curr: THREE.Object3D | null = obj;
    while (curr) {
      if (curr.userData && curr.userData.clueId) {
        return curr.userData.clueId;
      }
      curr = curr.parent;
    }
    return null;
  }

  private findClueName(obj: THREE.Object3D): string | null {
    let curr: THREE.Object3D | null = obj;
    while (curr) {
      if (curr.userData && curr.userData.name) {
        return curr.userData.name;
      }
      curr = curr.parent;
    }
    return null;
  }

  private applyHighlight(hit: RaycastHitInfo) {
    const root = this.findClueRoot(hit.mesh);
    const meshes: THREE.Mesh[] = [];

    if (root) {
      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes.push(child as THREE.Mesh);
        }
      });
    } else {
      meshes.push(hit.mesh);
    }

    this.hoveredMeshes = meshes;

    meshes.forEach((mesh) => {
      const mat = mesh.material as any;
      if (mat && mat.emissive) {
        if (!this.originalMaterials.has(mesh)) {
          this.originalMaterials.set(mesh, {
            emissive: mat.emissive.clone(),
            emissiveIntensity: mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 0.0
          });
        }
        // Warm amber highlight
        mat.emissive.setHex(0xF59E0B);
        mat.emissiveIntensity = 0.85;
      }
    });
  }

  private clearHighlight() {
    this.hoveredMeshes.forEach((mesh) => {
      const saved = this.originalMaterials.get(mesh);
      const mat = mesh.material as any;
      if (saved && mat && mat.emissive) {
        mat.emissive.copy(saved.emissive);
        mat.emissiveIntensity = saved.emissiveIntensity;
      }
    });
    this.hoveredMeshes = [];
    this.originalMaterials.clear();
  }

  private findClueRoot(obj: THREE.Object3D): THREE.Object3D | null {
    let curr: THREE.Object3D | null = obj;
    let rootWithClue: THREE.Object3D | null = null;
    while (curr) {
      if (curr.userData && curr.userData.clueId) {
        rootWithClue = curr;
      }
      curr = curr.parent;
    }
    return rootWithClue;
  }

  private pulseFeedback(mesh: THREE.Mesh) {
    const mat = mesh.material as any;
    if (mat && mat.emissive) {
      const prevColor = mat.emissive.getHex();
      const prevIntensity = mat.emissiveIntensity;
      mat.emissive.setHex(0x10B981); // Bright green flash
      mat.emissiveIntensity = 1.3;
      setTimeout(() => {
        if (mat.emissive) {
          mat.emissive.setHex(prevColor);
          mat.emissiveIntensity = prevIntensity;
        }
      }, 250);
    }
  }

  public dispose() {
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointerleave', this.onPointerLeave);
  }
}
