import type { CSSProperties } from "react";
import "./dice3d.css";

type Vec3 = [number, number, number];
type DiceStyle = CSSProperties & Record<`--${string}`, string | number>;

const PHI = (1 + Math.sqrt(5)) / 2;
const SCALE = 31;
const EDGE = 2 * SCALE;
const TRIANGLE_HEIGHT = (Math.sqrt(3) / 2) * EDGE;

const VERTICES: Vec3[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

const FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
] as const;

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, value: number): Vec3 => [a[0] * value, a[1] * value, a[2] * value];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.sqrt(dot(a, a));
const normalize = (a: Vec3): Vec3 => {
  const size = length(a) || 1;
  return [a[0] / size, a[1] / size, a[2] / size];
};
const average = (a: Vec3, b: Vec3, c: Vec3): Vec3 => mul(add(add(a, b), c), 1 / 3);
const round = (value: number) => Number(value.toFixed(6));

function faceTransform(face: readonly [number, number, number]) {
  const a = VERTICES[face[0]]!;
  let b = VERTICES[face[1]]!;
  let c = VERTICES[face[2]]!;
  const center = average(a, b, c);
  let axisX = normalize(sub(c, b));
  const baseMid = mul(add(b, c), 0.5);
  let axisY = normalize(sub(baseMid, a));
  let normal = normalize(cross(axisX, axisY));

  if (dot(normal, center) < 0) {
    const swap = b;
    b = c;
    c = swap;
    axisX = normalize(sub(c, b));
    const adjustedBaseMid = mul(add(b, c), 0.5);
    axisY = normalize(sub(adjustedBaseMid, a));
    normal = normalize(cross(axisX, axisY));
  }

  const tx = center[0] * SCALE;
  const ty = center[1] * SCALE;
  const tz = center[2] * SCALE;
  return `matrix3d(${[
    axisX[0], axisX[1], axisX[2], 0,
    axisY[0], axisY[1], axisY[2], 0,
    normal[0], normal[1], normal[2], 0,
    tx, ty, tz, 1,
  ].map(round).join(",")})`;
}

const ICOSAHEDRON_TRANSFORMS = FACES.map(faceTransform);

function resultLabel(index: number, value: number, sides: number) {
  if (index === 0) return value;
  if (sides === 20) return index + 1;
  const safeSides = Math.max(2, Math.trunc(sides));
  return ((value + index * 7 - 1) % safeSides) + 1;
}

export function PolyhedralDie3D({ value, sides, rolling, critical = false }: {
  value: number;
  sides: number;
  rolling: boolean;
  critical?: boolean;
}) {
  const normalizedSides = sides > 1 ? Math.trunc(sides) : 20;
  const finalX = ((value * 37 + normalizedSides * 11) % 180) - 70;
  const finalY = ((value * 61 + normalizedSides * 17) % 260) - 130;
  const finalZ = ((value * 29 + normalizedSides * 7) % 100) - 50;
  const style: DiceStyle = {
    "--dice-final-x": `${finalX}deg`,
    "--dice-final-y": `${finalY}deg`,
    "--dice-final-z": `${finalZ}deg`,
  };

  return <div className={`poly-die-stage ${rolling ? "is-rolling" : "is-settled"} ${critical ? "is-critical" : ""}`}>
    <div className="poly-die-floor-shadow"/>
    <div className="poly-die-object" style={style} aria-hidden="true">
      {normalizedSides === 6
        ? <Cube value={value}/>
        : <Icosahedron value={value} sides={normalizedSides}/>} 
    </div>
    <div className="poly-die-result-badge">
      <span>{normalizedSides > 0 ? `d${normalizedSides}` : "dado"}</span>
      <strong>{rolling ? "?" : value}</strong>
    </div>
  </div>;
}

function Icosahedron({ value, sides }: { value: number; sides: number }) {
  return <div className="poly-die-icosahedron">
    {ICOSAHEDRON_TRANSFORMS.map((transform, index) => <div
      key={index}
      className={`poly-die-triangle ${index === 0 ? "is-result-face" : ""}`}
      style={{
        width: `${EDGE}px`,
        height: `${TRIANGLE_HEIGHT}px`,
        marginLeft: `${-EDGE / 2}px`,
        marginTop: `${-(TRIANGLE_HEIGHT * 2) / 3}px`,
        transform,
      }}
    >
      <span>{resultLabel(index, value, sides)}</span>
    </div>)}
  </div>;
}

function Cube({ value }: { value: number }) {
  const labels = [value, ((value + 1) % 6) + 1, ((value + 2) % 6) + 1, ((value + 3) % 6) + 1, ((value + 4) % 6) + 1, ((value + 5) % 6) + 1];
  const transforms = [
    "translateZ(48px)",
    "rotateY(180deg) translateZ(48px)",
    "rotateY(90deg) translateZ(48px)",
    "rotateY(-90deg) translateZ(48px)",
    "rotateX(90deg) translateZ(48px)",
    "rotateX(-90deg) translateZ(48px)",
  ];
  return <div className="poly-die-cube">
    {transforms.map((transform, index) => <div key={index} className={`poly-die-cube-face ${index === 0 ? "is-result-face" : ""}`} style={{ transform }}><span>{labels[index]}</span></div>)}
  </div>;
}
