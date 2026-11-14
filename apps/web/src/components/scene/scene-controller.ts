import {
  AmbientLight,
  BufferGeometry,
  CapsuleGeometry,
  ConeGeometry,
  DirectionalLight,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  TetrahedronGeometry,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  easeInOutCubic,
  tween,
  type TweenHandle,
} from "@/lib/scene/animations";

export type SceneAnimation = "login" | "logout";

interface SceneForm {
  group: Group;
  basePosition: Vector3;
  baseRotation: Vector3;
  phase: number;
  offset: Vector3;
  opacity: number;
  materials: MeshPhysicalMaterial[];
}

const MAX_POINTER_TILT = (8 * Math.PI) / 180;

export class SceneController {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(42, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly forms: SceneForm[] = [];
  private readonly reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  private readonly clockStart = performance.now();
  private activeTween: TweenHandle | null = null;
  private frameId = 0;
  private width = 1;
  private height = 1;
  private pointerX = 0;
  private pointerY = 0;
  private focused = document.hasFocus();
  private disposed = false;
  private loopRunning = false;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    try {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(
        host.clientWidth || window.innerWidth,
        host.clientHeight || window.innerHeight,
      );
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFSoftShadowMap;
      this.renderer.outputColorSpace = "srgb";
      this.renderer.domElement.setAttribute("aria-hidden", "true");
      this.renderer.domElement.setAttribute("role", "presentation");
      this.renderer.domElement.tabIndex = -1;
      host.appendChild(this.renderer.domElement);
      this.camera.position.set(0, 0.2, 12);

      this.addEnvironment();
      this.addLights();
      this.addForms();
      this.addFloor();
      this.resize();
      this.addListeners();
      this.startLoop();
    } catch (error) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      throw error;
    }
  }

  play(animation: SceneAnimation): Promise<void> {
    if (this.disposed) return Promise.resolve();

    this.activeTween?.cancel();
    this.activeTween = null;

    if (this.reducedMotion.matches) {
      return this.fade(
        animation === "login" ? 0 : 1,
        animation === "login" ? 1 : 0,
        160,
      );
    }

    if (animation === "login") {
      this.forms.forEach((form) => {
        form.opacity = 1;
        form.group.visible = true;
      });

      const ringTargets = this.forms.map((_, index) => {
        const angle = (index / this.forms.length) * Math.PI * 2 - Math.PI / 2;
        const radiusX = Math.min(this.width * 0.35, 4.6);
        const radiusY = Math.min(this.height * 0.34, 3.1);
        return new Vector3(
          Math.cos(angle) * radiusX,
          Math.sin(angle) * radiusY,
          Math.sin(angle * 2) * 0.5,
        );
      });

      const starts = this.forms.map((form) => form.offset.clone());
      const handle = tween(900, (progress) => {
        const towardsRing = Math.min(1, progress * 2);
        const towardsRest = Math.max(0, (progress - 0.5) * 2);
        this.forms.forEach((form, index) => {
          const ringOffset = ringTargets[index].clone().sub(form.basePosition);
          if (progress < 0.5) {
            form.offset
              .copy(starts[index])
              .lerp(ringOffset, easeInOutCubic(towardsRing));
          } else {
            form.offset
              .copy(ringOffset)
              .lerp(new Vector3(), easeInOutCubic(towardsRest));
          }
        });
      });

      this.activeTween = handle;
      return handle.promise.then(() => {
        if (this.activeTween === handle) this.activeTween = null;
        this.forms.forEach((form) => form.offset.set(0, 0, 0));
      });
    }

    const origins = this.forms.map((form) => form.offset.clone());
    const handle = tween(700, (progress) => {
      this.forms.forEach((form, index) => {
        const direction = form.basePosition.clone().normalize();
        const scatterTarget = origins[index]
          .clone()
          .addScaledVector(direction, 4 + (index % 3));
        form.offset.copy(origins[index]).lerp(scatterTarget, progress);
        form.opacity = 1 - progress;
      });
    });
    this.activeTween = handle;
    return handle.promise.then(() => {
      if (this.activeTween === handle) this.activeTween = null;
      this.forms.forEach((form) => {
        form.opacity = 0;
        form.group.visible = false;
      });
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.activeTween?.cancel();
    this.activeTween = null;
    this.stopLoop();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("focus", this.onFocus);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    this.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      geometries.add(object.geometry);
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => materials.add(material));
      } else {
        materials.add(object.material);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private addEnvironment(): void {
    const environment = new RoomEnvironment();
    const pmrem = new PMREMGenerator(this.renderer);
    const environmentMap = pmrem.fromScene(environment);
    this.scene.environment = environmentMap.texture;
    environment.dispose();
    pmrem.dispose();
  }

  private addLights(): void {
    this.scene.add(new AmbientLight(0xffffff, 0.7));

    const key = new DirectionalLight(0xffffff, 3.2);
    key.position.set(-5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0003;
    this.scene.add(key);

    const rim = new DirectionalLight(0x8cf7e9, 2.2);
    rim.position.set(5, 3, -7);
    this.scene.add(rim);
  }

  private addForms(): void {
    const definitions = [
      {
        color: 0x2ec4b6,
        position: [-5.2, 1.7, 0],
        rotation: [0.2, 0.5, 0.1],
        phase: 0,
      },
      {
        color: 0xf4e3c1,
        position: [4.7, 2.5, -1],
        rotation: [0.4, 0.2, 0],
        phase: 0.9,
      },
      {
        color: 0xffffff,
        position: [-4.8, -1.4, -0.4],
        rotation: [0.1, 0.4, 0.2],
        phase: 1.8,
      },
      {
        color: 0x2ec4b6,
        position: [5, -1.1, 0.3],
        rotation: [0.3, 0.1, 0],
        phase: 2.7,
      },
      {
        color: 0xff7f6b,
        position: [-1.4, 4, -1.2],
        rotation: [0.2, 0, 0.5],
        phase: 3.6,
      },
      {
        color: 0xf4e3c1,
        position: [1.6, -3.5, -0.7],
        rotation: [0.4, 0.6, 0],
        phase: 4.5,
      },
      { color: 0xff7f6b, position: [0, 0, 1], rotation: [0, 0, 0], phase: 5.4 },
    ] as const;

    definitions.forEach((definition, index) => {
      const group = new Group();
      const material = new MeshPhysicalMaterial({
        color: definition.color,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 1,
      });
      const meshes: Mesh[] = [];

      switch (index) {
        case 0:
          meshes.push(
            new Mesh(new TorusKnotGeometry(0.72, 0.2, 96, 12, 2, 3), material),
          );
          break;
        case 1:
          meshes.push(new Mesh(new OctahedronGeometry(0.82, 2), material));
          break;
        case 2: {
          const capsuleGeometry = new CapsuleGeometry(0.22, 0.9, 6, 12);
          const first = new Mesh(capsuleGeometry, material);
          first.position.x = -0.27;
          first.rotation.z = -0.18;
          const second = new Mesh(capsuleGeometry, material);
          second.position.x = 0.27;
          second.rotation.z = 0.18;
          meshes.push(first, second);
          break;
        }
        case 3: {
          const flattened = new Mesh(new SphereGeometry(0.9, 32, 24), material);
          flattened.scale.set(1.2, 0.58, 0.78);
          meshes.push(flattened);
          break;
        }
        case 4: {
          const petal = new Mesh(new ConeGeometry(0.47, 1.6, 32), material);
          petal.rotation.z = 0.7;
          petal.scale.set(0.72, 1.1, 0.55);
          meshes.push(petal);
          break;
        }
        case 5: {
          const roundedTetrahedron = new TetrahedronGeometry(0.9, 3);
          roundedTetrahedron.computeVertexNormals();
          meshes.push(new Mesh(roundedTetrahedron, material));
          break;
        }
        default:
          meshes.push(new Mesh(new SphereGeometry(0.36, 24, 18), material));
      }

      meshes.forEach((mesh) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      });
      const position = new Vector3(...definition.position);
      const rotation = new Vector3(...definition.rotation);
      group.position.copy(position);
      group.rotation.set(rotation.x, rotation.y, rotation.z);
      this.scene.add(group);
      this.forms.push({
        group,
        basePosition: position,
        baseRotation: rotation,
        phase: definition.phase,
        offset: new Vector3(),
        opacity: 1,
        materials: [material],
      });
    });
  }

  private addFloor(): void {
    const floor = new Mesh(
      new PlaneGeometry(200, 200),
      new ShadowMaterial({ color: 0x2ec4b6, opacity: 0.18 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private addListeners(): void {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private updateLoop = (): void => {
    if (this.disposed) return;
    this.frameId = 0;
    if (!document.hidden && this.focused) {
      const elapsed = (performance.now() - this.clockStart) / 1000;
      this.forms.forEach((form, index) => {
        if (!form.group.visible) return;
        const float = Math.sin(elapsed * 0.75 + form.phase) * 0.16;
        form.group.position.set(
          form.basePosition.x + form.offset.x,
          form.basePosition.y + form.offset.y + float,
          form.basePosition.z + form.offset.z,
        );
        form.group.rotation.set(
          form.baseRotation.x + Math.sin(elapsed * 0.28 + form.phase) * 0.12,
          form.baseRotation.y + elapsed * (0.08 + index * 0.004),
          form.baseRotation.z + Math.cos(elapsed * 0.35 + form.phase) * 0.08,
        );
        form.materials.forEach((material) => (material.opacity = form.opacity));
      });

      const orbit = elapsed * 0.035;
      this.camera.position.x = Math.sin(orbit) * 0.5 + this.pointerX * 0.5;
      this.camera.position.z = 12 * Math.cos(orbit);
      this.camera.position.y =
        0.2 + this.pointerY * Math.sin(MAX_POINTER_TILT) * 12;
      this.camera.lookAt(0, 0, 0);
      this.renderer.render(this.scene, this.camera);
    }
    if (!document.hidden && this.focused) {
      this.frameId = requestAnimationFrame(this.updateLoop);
    } else {
      this.loopRunning = false;
    }
  };

  private startLoop(): void {
    if (this.disposed || this.loopRunning || document.hidden || !this.focused)
      return;
    this.loopRunning = true;
    this.frameId = requestAnimationFrame(this.updateLoop);
  }

  private stopLoop(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.loopRunning = false;
  }

  private fade(from: number, to: number, duration: number): Promise<void> {
    this.forms.forEach((form) => {
      form.group.visible = true;
      form.opacity = from;
    });
    const handle = tween(duration, (progress) => {
      this.forms.forEach(
        (form) => (form.opacity = from + (to - from) * progress),
      );
    });
    this.activeTween = handle;
    return handle.promise.then(() => {
      if (this.activeTween === handle) this.activeTween = null;
      if (to === 0) this.forms.forEach((form) => (form.group.visible = false));
    });
  }

  private resize = (): void => {
    this.width = this.host.clientWidth || window.innerWidth;
    this.height = this.host.clientHeight || window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  private onResize = (): void => this.resize();

  private onPointerMove = (event: PointerEvent): void => {
    this.pointerX = Math.max(
      -1,
      Math.min(1, (event.clientX / window.innerWidth) * 2 - 1),
    );
    this.pointerY = Math.max(
      -1,
      Math.min(1, (event.clientY / window.innerHeight) * 2 - 1),
    );
  };

  private onFocus = (): void => {
    this.focused = true;
    this.startLoop();
  };

  private onBlur = (): void => {
    this.focused = false;
    this.stopLoop();
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) this.stopLoop();
    else this.startLoop();
  };
}
