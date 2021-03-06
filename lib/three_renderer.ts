
import * as THREE from 'three';
import { LinearToneMapping } from 'three';

export class ThreeRenderer {
  private gl: any;
  private canvas: any | undefined;

  private ibl: THREE.Texture;
  private pmremGenerator: THREE.PMREMGenerator;
  private scene: THREE.Scene | null;
  private renderer: THREE.WebGLRenderer;

  private isRendering = false;

  private dirty = false;

  public set exposure(val: number) {
    this.renderer.toneMappingExposure = val;
  }
  public get exposure() {
    return this.renderer.toneMappingExposure;
  }

  private tonemappingModes = {
    "None": THREE.LinearToneMapping, 
    "Reinhard": THREE.ReinhardToneMapping, 
    "Cineon": THREE.CineonToneMapping, 
    "AcesFilm": THREE.ACESFilmicToneMapping
  };

  set tonemapping(val: string) {
    this.renderer.toneMapping = this.tonemappingModes[val];
    this.dirty = true;
  }

  showBackground(flag) {
    if (!flag) {
      this.scene.background = new THREE.Color(0, 0, 0);
    } else {
      this.scene.background = this.ibl;
    }
  }

  useIBL(val) {
    if (val) {
      this.scene.environment = this.ibl;
      this.showBackground(true);
    } else {
      this.scene.environment = null;
      this.showBackground(false);
    }
  }
 
  constructor(canvas: HTMLCanvasElement | undefined, pixelRatio: number = 1.0) {
    this.canvas = canvas !== undefined ? canvas : document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    this.gl = this.canvas.getContext('webgl2');

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, context: this.gl, powerPreference: "high-performance", alpha: true });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.outputEncoding = THREE.GammaEncoding;
    this.renderer.physicallyCorrectLights = true;

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }

  stopRendering() {
    this.isRendering = false;
  }

  render(camera: THREE.PerspectiveCamera, frameFinishedCB?) {
    if (camera instanceof THREE.Camera === false) {
      console.error('PathtracingRenderer.render: camera is not an instance of THREE.Camera.');
      return;
    }
    this.isRendering = true;

    let renderFrame = () => {
      if (!this.isRendering) {
        return;
      }

      if(this.dirty) {
        this.renderer.compile(this.scene, camera);
        this.dirty = false;
      }

      this.renderer.render(this.scene, camera);
      if (frameFinishedCB !== undefined)
        frameFinishedCB();
      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame); // start render loop
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
  }

  setIBL(tex: any) {
    if (!this.scene) {
      return;
    }

    if (this.ibl !== undefined) {
      this.ibl.dispose();
    }

    this.ibl = this.pmremGenerator.fromEquirectangular(tex).texture;
    this.scene.background = this.ibl;
    this.scene.environment  = this.ibl;
  }

  setScene(scene) {
    this.scene = scene;
  }

}