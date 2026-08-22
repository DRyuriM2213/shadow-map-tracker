import { useEffect, useRef, useState } from "react";
import "./dice3d.css";

type Vec3 = [number, number, number];
type Vec4 = [number, number, number, number];
type Mat4 = number[];
type Uv = [number, number];

type Mesh = {
  vertices: Float32Array;
  vertexCount: number;
  labels: number[];
  atlasColumns: number;
  atlasRows: number;
  targetOrientation: Vec4;
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
uniform float uReveal;
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

  vec4 glyph = texture(uNumberTexture, vUv);
  color = mix(color, vec3(0.98, 0.95, 0.91), glyph.a * 0.92);

  if (vResultFace > 0.5 && uReveal > 0.5) {
    color += uAccentColor * 0.085;
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
  const orientationRef = useRef<Vec4>([0, 0, 0, 1]);
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

    const mesh = normalizedSides === 6 ? buildCubeMesh(value) : buildIcosahedronMesh(normalizedSides, value);
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    const texture = createNumberAtlas(gl, mesh.labels, mesh.atlasColumns, mesh.atlasRows);
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
    const startOrientation: Vec4 = [...orientationRef.current];
    const neutralOrientation = normalizeQuaternion(quaternionFromEuler(0.55, -0.72, 0.24));
    let frame = 0;

    const render = (now: number) => {
      resizeCanvas(canvas, gl);
      const elapsed = now - start;
      let orientation: Vec4;
      let lift = 0;
      let scale = 1;
      let reveal = 0;

      if (rolling) {
        if (reducedMotion) {
          orientation = neutralOrientation;
        } else {
          const t = elapsed / 1000;
          const spin = quaternionFromEuler(
            t * 9.7 + Math.sin(t * 8.4) * 0.30,
            t * 11.8 + Math.cos(t * 7.1) * 0.28,
            t * 7.2,
          );
          orientation = normalizeQuaternion(multiplyQuaternion(spin, startOrientation));
          const decay = Math.max(0.1, 1 - elapsed / 1650);
          lift = Math.abs(Math.sin(t * 8.6)) * 0.32 * decay;
          scale = 0.96 + Math.sin(t * 10.2) * 0.025;
        }
      } else {
        const duration = reducedMotion ? 1 : 620;
        const p = Math.min(1, elapsed / duration);
        const eased = reducedMotion ? 1 : easeOutCubic(p);
        orientation = slerpQuaternion(startOrientation, mesh.targetOrientation, eased);
        lift = reducedMotion ? 0 : Math.sin(p * Math.PI) * 0.07;
        scale = reducedMotion ? 1 : 0.95 + eased * 0.05;
        reveal = p > 0.82 ? 1 : 0;
      }

      orientationRef.current = orientation;
      drawDie(gl, program, mesh, orientation, lift, scale, reveal);
      if (rolling || elapsed < 760) frame = window.requestAnimationFrame(render);
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

function drawDie(gl: WebGL2RenderingContext, program: WebGLProgram, mesh: Mesh, orientation: Vec4, lift: number, scale: number, reveal: number) {
  const aspect = gl.canvas.width / Math.max(1, gl.canvas.height);
  const projection = perspective(Math.PI / 5.4, aspect, 0.1, 20);
  const view = translation(0, -0.02, -4.35);
  const rotation = rotationFromQuaternion(orientation);
  const model = multiply(translation(0, lift, 0), multiply(rotation, scaling(scale, scale, scale)));
  const mvp = multiply(projection, multiply(view, model));
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModel"), false, new Float32Array(model));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uMvp"), false, new Float32Array(mvp));
  gl.uniform1f(gl.getUniformLocation(program, "uReveal"), reveal);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
}

function buildIcosahedronMesh(sides: number, value: number): Mesh {
  const vertices = ICOSAHEDRON_VERTICES.map((v) => mul3(normalize3(v), 1.16));
  const data: number[] = [];
  const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const labels = Array.from({ length: ICOSAHEDRON_FACES.length }, (_, faceIndex) => {
    if (sides <= 20) return (faceIndex % sides) + 1;
    if (faceIndex === 0) return value;
    return ((value + faceIndex * 17 - 1) % sides) + 1;
  });
  const resultFaceIndex = sides <= 20 ? Math.max(0, Math.min(19, value - 1)) : 0;
  let targetNormal: Vec3 = [0, 0, 1];
  let targetUp: Vec3 = [0, 1, 0];

  ICOSAHEDRON_FACES.forEach((face, faceIndex) => {
    const oriented = orientTriangle(vertices, face);
    const uv = triangleUvsForCell(faceIndex, 5, 4);
    if (faceIndex === resultFaceIndex) {
      targetNormal = oriented.normal;
      targetUp = normalize3(sub3(oriented.a, oriented.center));
    }
    [oriented.a, oriented.b, oriented.c].forEach((point, index) => {
      data.push(...point, ...oriented.normal, ...bary[index]!, ...uv[index]!, faceIndex === resultFaceIndex ? 1 : 0);
    });
  });

  return {
    vertices: new Float32Array(data),
    vertexCount: data.length / 12,
    labels,
    atlasColumns: 5,
    atlasRows: 4,
    targetOrientation: orientationForFace(targetNormal, targetUp),
  };
}

function buildCubeMesh(value: number): Mesh {
  const data: number[] = [];
  const labels = [1, 2, 3, 4, 5, 6];
  const resultFaceIndex = Math.max(0, Math.min(5, value - 1));
  const faces: Array<{ points: [Vec3, Vec3, Vec3, Vec3]; normal: Vec3; up: Vec3 }> = [
    { points: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], normal: [0, 0, 1], up: [0, 1, 0] },
    { points: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], normal: [0, 0, -1], up: [0, 1, 0] },
    { points: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], normal: [1, 0, 0], up: [0, 1, 0] },
    { points: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], normal: [-1, 0, 0], up: [0, 1, 0] },
    { points: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], normal: [0, 1, 0], up: [0, 0, -1] },
    { points: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], normal: [0, -1, 0], up: [0, 0, 1] },
  ];
  const triangles = [[0, 1, 2], [0, 2, 3]] as const;
  const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  faces.forEach((face, faceIndex) => {
    const uv = quadUvsForCell(faceIndex, 3, 2);
    triangles.forEach((triangle) => triangle.forEach((pointIndex, index) => {
      const p = mul3(face.points[pointIndex]!, 0.84);
      data.push(...p, ...face.normal, ...bary[index]!, ...uv[pointIndex]!, faceIndex === resultFaceIndex ? 1 : 0);
    }));
  });

  return {
    vertices: new Float32Array(data),
    vertexCount: data.length / 12,
    labels,
    atlasColumns: 3,
    atlasRows: 2,
    targetOrientation: orientationForFace(faces[resultFaceIndex]!.normal, faces[resultFaceIndex]!.up),
  };
}

function orientTriangle(vertices: Vec3[], face: readonly [number, number, number]) {
  const a = vertices[face[0]]!;
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
  return { a, b, c, center, normal };
}

function triangleUvsForCell(index: number, columns: number, rows: number): [Uv, Uv, Uv] {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = column / columns;
  const right = (column + 1) / columns;
  const top = 1 - row / rows;
  const bottom = 1 - (row + 1) / rows;
  const padX = (right - left) * 0.10;
  const padY = (top - bottom) * 0.09;
  return [
    [(left + right) / 2, top - padY],
    [left + padX, bottom + padY],
    [right - padX, bottom + padY],
  ];
}

function quadUvsForCell(index: number, columns: number, rows: number): [Uv, Uv, Uv, Uv] {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const left = column / columns;
  const right = (column + 1) / columns;
  const top = 1 - row / rows;
  const bottom = 1 - (row + 1) / rows;
  const padX = (right - left) * 0.12;
  const padY = (top - bottom) * 0.12;
  return [
    [left + padX, bottom + padY],
    [right - padX, bottom + padY],
    [right - padX, top - padY],
    [left + padX, top - padY],
  ];
}

function createNumberAtlas(gl: WebGL2RenderingContext, labels: number[], columns: number, rows: number) {
  const cellSize = 256;
  const canvas = document.createElement("canvas");
  canvas.width = columns * cellSize;
  canvas.height = rows * cellSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  labels.forEach((label, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const text = String(label);
    const fontSize = text.length >= 3 ? 86 : text.length === 2 ? 108 : 128;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.font = `900 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.shadowColor = "rgba(0,0,0,.42)";
    ctx.shadowBlur = 6;
    ctx.fillText(text, column * cellSize + cellSize / 2, row * cellSize + cellSize * 0.53);
    ctx.restore();
  });

  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
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
  return <div className={`webgl-die-fallback ${rolling ? "is-rolling" : ""}`} aria-hidden="true"><span>{rolling ? "•" : value}</span></div>;
}

function orientationForFace(normal: Vec3, up: Vec3): Vec4 {
  const faceNormal = normalize3(normal);
  const faceUp = normalize3(up);
  const alignNormal = quaternionFromUnitVectors(faceNormal, [0, 0, 1]);
  const alignedUp = normalize3(rotateByQuaternion(faceUp, alignNormal));
  const twistAngle = Math.atan2(alignedUp[0], alignedUp[1]);
  const alignUp = quaternionFromAxisAngle([0, 0, 1], twistAngle);
  return normalizeQuaternion(multiplyQuaternion(alignUp, alignNormal));
}

function perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function translation(x: number, y: number, z: number): Mat4 { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
function scaling(x: number, y: number, z: number): Mat4 { return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]; }
function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 4; i += 1) out[column * 4 + row]! += a[i * 4 + row]! * b[column * 4 + i]!;
  }
  return out;
}

function rotationFromQuaternion(q: Vec4): Mat4 {
  const [x, y, z, w] = normalizeQuaternion(q);
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return [
    1 - (yy + zz), xy + wz, xz - wy, 0,
    xy - wz, 1 - (xx + zz), yz + wx, 0,
    xz + wy, yz - wx, 1 - (xx + yy), 0,
    0, 0, 0, 1,
  ];
}

function quaternionFromEuler(x: number, y: number, z: number): Vec4 {
  const qx = quaternionFromAxisAngle([1, 0, 0], x);
  const qy = quaternionFromAxisAngle([0, 1, 0], y);
  const qz = quaternionFromAxisAngle([0, 0, 1], z);
  return multiplyQuaternion(qz, multiplyQuaternion(qy, qx));
}

function quaternionFromAxisAngle(axis: Vec3, angle: number): Vec4 {
  const n = normalize3(axis);
  const half = angle / 2;
  const s = Math.sin(half);
  return [n[0] * s, n[1] * s, n[2] * s, Math.cos(half)];
}

function multiplyQuaternion(a: Vec4, b: Vec4): Vec4 {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function normalizeQuaternion(q: Vec4): Vec4 {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

function slerpQuaternion(from: Vec4, to: Vec4, t: number): Vec4 {
  let a = normalizeQuaternion(from);
  let b = normalizeQuaternion(to);
  let cosine = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  if (cosine < 0) {
    b = [-b[0], -b[1], -b[2], -b[3]];
    cosine = -cosine;
  }
  if (cosine > 0.9995) {
    return normalizeQuaternion([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ]);
  }
  const theta = Math.acos(Math.min(1, cosine));
  const sinTheta = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sinTheta;
  const w2 = Math.sin(t * theta) / sinTheta;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2, a[3] * w1 + b[3] * w2];
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
  return normalizeQuaternion([xyz[0], xyz[1], xyz[2], r]);
}

function rotateByQuaternion(v: Vec3, q: Vec4): Vec3 {
  const [qx, qy, qz, qw] = normalizeQuaternion(q);
  const uv = cross3([qx, qy, qz], v);
  const uuv = cross3([qx, qy, qz], uv);
  return add3(v, add3(mul3(uv, 2 * qw), mul3(uuv, 2)));
}

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
