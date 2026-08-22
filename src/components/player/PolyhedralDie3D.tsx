import { useEffect, useRef, useState } from "react";
import "./dice3d.css";

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type Mat4 = number[];

type Mesh = {
  vertices: Float32Array;
  vertexCount: number;
};

const PHI = (1 + Math.sqrt(5)) / 2;
const ICOSAHEDRON_VERTICES: Vec3[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];
const ICOSAHEDRON_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
] as const;

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec3 aBary;
in vec2 aUv;
in float aResultFace;
uniform mat4 uModel;
uniform mat4 uMvp;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vBary;
out vec2 vUv;
out float vResultFace;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vPosition = world.xyz;
  vNormal = normalize(mat3(uModel) * aNormal);
  vBary = aBary;
  vUv = aUv;
  vResultFace = aResultFace;
  gl_Position = uMvp * vec4(aPosition, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPosition;
in vec3 vBary;
in vec2 vUv;
in float vResultFace;
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform vec3 uLightDirection;
uniform sampler2D uNumberTexture;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 viewDir = normalize(vec3(0.0, 0.0, 4.4) - vPosition);
  vec3 halfDir = normalize(lightDir + viewDir);

  float diffuse = max(dot(n, lightDir), 0.0);
  float softFill = max(dot(n, normalize(vec3(-0.7, -0.25, 0.45))), 0.0);
  float specular = pow(max(dot(n, halfDir), 0.0), 44.0);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.6);

  vec3 surface = uBaseColor * (0.34 + diffuse * 0.76 + softFill * 0.16);
  surface += vec3(1.0, 0.91, 0.86) * specular * 0.50;
  surface += uAccentColor * rim * 0.22;

  float nearestEdge = min(min(vBary.x, vBary.y), vBary.z);
  float edgeWidth = fwidth(nearestEdge) * 1.35;
  float inside = smoothstep(edgeWidth, edgeWidth * 2.5, nearestEdge);
  vec3 edgeColor = mix(vec3(0.018, 0.016, 0.020), uAccentColor * 0.30, 0.42);
  vec3 color = mix(edgeColor, surface, inside);

  if (vResultFace > 0.5) {
    vec4 glyph = texture(uNumberTexture, vUv);
    color += uAccentColor * 0.055;
    color = mix(color, vec3(0.98, 0.95, 0.91), glyph.a * 0.94);
  }

  outColor = vec4(color, 1.0);
}`;

export function PolyhedralDie3D({ value, sides, rolling, critical = false }: {
  value: number;
  sides: number;
  rolling: boolean;
  critical?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const anglesRef = useRef<Vec3>([0, 0, 0]);
  const [webglFailed, setWebglFailed] = useState(false);
  const normalizedSides = sides > 1 ? Math.trunc(sides) : 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      depth: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      setWebglFailed(true);
      return;
    }
    setWebglFailed(false);

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) {
      setWebglFailed(true);
      return;
    }

    const mesh = normalizedSides === 6 ? buildCubeMesh() : buildIcosahedronMesh();
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    const texture = createNumberTexture(gl, value);
    if (!buffer || !vao || !texture) {
      setWebglFailed(true);
      gl.deleteProgram(program);
      return;
    }

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);

    const stride = 12 * Float32Array.BYTES_PER_ELEMENT;
    bindAttribute(gl, program, "aPosition", 3, stride, 0);
    bindAttribute(gl, program, "aNormal", 3, stride, 3 * 4);
    bindAttribute(gl, program, "aBary", 3, stride, 6 * 4);
    bindAttribute(gl, program, "aUv", 2, stride, 9 * 4);
    bindAttribute(gl, program, "aResultFace", 1, stride, 11 * 4);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.clearColor(0, 0, 0, 0);
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "uNumberTexture"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const baseColor = critical ? [0.28, 0.13, 0.025] : [0.20, 0.025, 0.042];
    const accentColor = critical ? [1.0, 0.69, 0.16] : [0.82, 0.09, 0.105];
    gl.uniform3fv(gl.getUniformLocation(program, "uBaseColor"), baseColor);
    gl.uniform3fv(gl.getUniformLocation(program, "uAccentColor"), accentColor);
    gl.uniform3fv(gl.getUniformLocation(program, "uLightDirection"), [0.55, 0.82, 1.1]);

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const start = performance.now();
    const startAngles: Vec3 = [...anglesRef.current];
    const targetAngles: Vec3 = [
      -0.12 + ((value % 3) - 1) * 0.025,
      0.18 + ((value % 5) - 2) * 0.014,
      ((value * 0.61803398875) % 1) * Math.PI * 2,
    ];
    let frame = 0;

    const render = (now: number) => {
      resizeCanvas(canvas, gl);
      const elapsed = now - start;
      let rx: number;
      let ry: number;
      let rz: number;
      let lift = 0;
      let scale = 1;

      if (reducedMotion) {
        [rx, ry, rz] = targetAngles;
      } else if (rolling) {
        const t = elapsed / 1000;
        rx = startAngles[0] + t * 9.7 + Math.sin(t * 8.4) * 0.30;
        ry = startAngles[1] + t * 11.8 + Math.cos(t * 7.1) * 0.28;
        rz = startAngles[2] + t * 7.2;
        const decay = Math.max(0.1, 1 - elapsed / 1650);
        lift = Math.abs(Math.sin(t * 8.6)) * 0.32 * decay;
        scale = 0.96 + Math.sin(t * 10.2) * 0.025;
      } else {
        const duration = 520;
        const p = Math.min(1, elapsed / duration);
        const eased = easeOutBack(p, 1.04);
        const fromX = wrapAngle(startAngles[0]);
        const fromY = wrapAngle(startAngles[1]);
        const fromZ = wrapAngle(startAngles[2]);
        rx = lerpAngle(fromX, targetAngles[0], eased);
        ry = lerpAngle(fromY, targetAngles[1], eased);
        rz = lerpAngle(fromZ, targetAngles[2], eased);
        lift = Math.sin(Math.min(1, p) * Math.PI) * 0.075;
        scale = 0.94 + eased * 0.06;
      }

      anglesRef.current = [rx, ry, rz];
      drawDie(gl, program, mesh, rx, ry, rz, lift, scale);
      if (rolling || elapsed < 650) frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(frame);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [critical, normalizedSides, rolling, value]);

  return <div className={`poly-die-stage webgl-die-stage ${rolling ? "is-rolling" : "is-settled"} ${critical ? "is-critical" : ""}`}>
    <div className="poly-die-floor-shadow webgl-die-shadow"/>
    {!webglFailed ? <canvas ref={canvasRef} className="webgl-die-canvas" aria-hidden="true"/> : <FallbackDie value={value} rolling={rolling}/>} 
    <div className={`webgl-die-result ${rolling ? "is-hidden" : ""}`} aria-hidden="true">
      <span>d{normalizedSides}</span>
      <strong>{value}</strong>
    </div>
  </div>;
}

function drawDie(gl: WebGL2RenderingContext, program: WebGLProgram, mesh: Mesh, rx: number, ry: number, rz: number, lift: number, scale: number) {
  const aspect = gl.canvas.width / Math.max(1, gl.canvas.height);
  const projection = perspective(Math.PI / 5.4, aspect, 0.1, 20);
  const view = translation(0, -0.02, -4.35);
  const model = multiply(
    translation(0, lift, 0),
    multiply(rotationZ(rz), multiply(rotationY(ry), multiply(rotationX(rx), scaling(scale, scale, scale)))),
  );
  const mvp = multiply(projection, multiply(view, model));
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModel"), false, new Float32Array(model));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uMvp"), false, new Float32Array(mvp));
  gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}

function buildIcosahedronMesh(): Mesh {
  const raw = ICOSAHEDRON_VERTICES.map((v) => mul3(normalize3(v), 1.16));
  const firstFace = ICOSAHEDRON_FACES[0];
  const firstNormal = outwardNormal(raw[firstFace[0]]!, raw[firstFace[1]]!, raw[firstFace[2]]!);
  const align = quaternionFromUnitVectors(firstNormal, [0, 0, 1]);
  const vertices = raw.map((v) => rotateByQuaternion(v, align));
  const data: number[] = [];
  const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const uv: Array<[number, number]> = [[0.5, 0.04], [0.04, 0.94], [0.96, 0.94]];

  ICOSAHEDRON_FACES.forEach((face, faceIndex) => {
    let a = vertices[face[0]]!;
    let b = vertices[face[1]]!;
    let c = vertices[face[2]]!;
    let normal = outwardNormal(a, b, c);
    const center = mul3(add3(add3(a, b), c), 1 / 3);
    if (dot3(normal, center) < 0) {
      const tmp = b;
      b = c;
      c = tmp;
      normal = outwardNormal(a, b, c);
    }
    [a, b, c].forEach((point, index) => {
      data.push(...point, ...normal, ...bary[index]!, ...uv[index]!, faceIndex === 0 ? 1 : 0);
    });
  });
  return { vertices: new Float32Array(data), vertexCount: data.length / 12 };
}

function buildCubeMesh(): Mesh {
  const data: number[] = [];
  const faces: Array<{ points: Vec3[]; normal: Vec3 }> = [
    { points: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], normal: [0, 0, 1] },
    { points: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], normal: [0, 0, -1] },
    { points: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], normal: [1, 0, 0] },
    { points: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], normal: [-1, 0, 0] },
    { points: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], normal: [0, 1, 0] },
    { points: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], normal: [0, -1, 0] },
  ];
  const triangles = [[0, 1, 2], [0, 2, 3]] as const;
  const uv: Array<[number, number]> = [[0.06, 0.94], [0.94, 0.94], [0.94, 0.06], [0.06, 0.06]];
  const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  faces.forEach((face, faceIndex) => {
    triangles.forEach((triangle) => triangle.forEach((pointIndex, index) => {
      const p = mul3(face.points[pointIndex]!, 0.84);
      data.push(...p, ...face.normal, ...bary[index]!, ...uv[pointIndex]!, faceIndex === 0 ? 1 : 0);
    }));
  });
  return { vertices: new Float32Array(data), vertexCount: data.length / 12 };
}

function createNumberTexture(gl: WebGL2RenderingContext, value: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${String(value).length > 1 ? 86 : 102}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 4;
  ctx.fillText(String(value), 128, 142);
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("Não foi possível inicializar o dado WebGL:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Shader do dado 3D inválido:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function bindAttribute(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, size: number, stride: number, offset: number) {
  const location = gl.getAttribLocation(program, name);
  if (location < 0) return;
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
}

function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

function FallbackDie({ value, rolling }: { value: number; rolling: boolean }) {
  return <div className={`webgl-die-fallback ${rolling ? "is-rolling" : ""}`} aria-hidden="true"><span>{rolling ? "?" : value}</span></div>;
}

function perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function translation(x: number, y: number, z: number): Mat4 { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
function scaling(x: number, y: number, z: number): Mat4 { return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]; }
function rotationX(a: number): Mat4 { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
function rotationY(a: number): Mat4 { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
function rotationZ(a: number): Mat4 { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 4; i += 1) out[column * 4 + row]! += a[i * 4 + row]! * b[column * 4 + i]!;
  }
  return out;
}

function add3(a: Vec3, b: Vec3): Vec3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub3(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function mul3(a: Vec3, n: number): Vec3 { return [a[0] * n, a[1] * n, a[2] * n]; }
function dot3(a: Vec3, b: Vec3) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross3(a: Vec3, b: Vec3): Vec3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function normalize3(a: Vec3): Vec3 { const len = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / len, a[1] / len, a[2] / len]; }
function outwardNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 { return normalize3(cross3(sub3(b, a), sub3(c, a))); }

function quaternionFromUnitVectors(from: Vec3, to: Vec3): Vec4 {
  let r = dot3(from, to) + 1;
  let xyz: Vec3;
  if (r < 1e-6) {
    r = 0;
    xyz = Math.abs(from[0]) > Math.abs(from[2]) ? [-from[1], from[0], 0] : [0, -from[2], from[1]];
  } else xyz = cross3(from, to);
  const length = Math.hypot(xyz[0], xyz[1], xyz[2], r) || 1;
  return [xyz[0] / length, xyz[1] / length, xyz[2] / length, r / length];
}
function rotateByQuaternion(v: Vec3, q: Vec4): Vec3 {
  const [qx, qy, qz, qw] = q;
  const uv = cross3([qx, qy, qz], v);
  const uuv = cross3([qx, qy, qz], uv);
  return add3(v, add3(mul3(uv, 2 * qw), mul3(uuv, 2)));
}

function easeOutBack(t: number, strength: number) { const c1 = strength; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function wrapAngle(value: number) { const tau = Math.PI * 2; return ((value + Math.PI) % tau + tau) % tau - Math.PI; }
function lerpAngle(from: number, to: number, t: number) { return from + wrapAngle(to - from) * t; }
