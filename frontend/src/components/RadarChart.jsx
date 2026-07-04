/* ═══════════════════════════════════════════════
   AXON TRACKER — FIFA-STYLE HEXAGONAL RADAR CHART
   Premium SVG player stats visualization
   ═══════════════════════════════════════════════ */

const AXES = [
  { key: 'speed',    label: 'PAC', full: 'Pace'      },
  { key: 'shot',     label: 'SHO', full: 'Shooting'  },
  { key: 'pass',     label: 'PAS', full: 'Passing'   },
  { key: 'dribble',  label: 'DRI', full: 'Dribbling' },
  { key: 'defense',  label: 'DEF', full: 'Defending' },
  { key: 'physical', label: 'PHY', full: 'Physical'  },
];

const N      = 6;
const LEVELS = 5;
const SIZE   = 300;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const R      = 100;
const LR     = R + 30;

function ang(i) { return (i * Math.PI * 2) / N - Math.PI / 2; }

function scaledPolar(cx, cy, radius, i) {
  // Tranca contra raios inválidos ou NaNs na matemática angular
  const safeRadius = (typeof radius === 'number' && !isNaN(radius)) ? radius : 0;
  return {
    x: cx + safeRadius * Math.cos(ang(i)),
    y: cy + safeRadius * Math.sin(ang(i)),
  };
}

function poly(pts) {
  // Se algum ponto falhar por completo, devolve um triângulo invisível seguro em vez de quebrar o SVG
  if (!pts || pts.length === 0) return "0,0 0,0 0,0";
  
  return pts.map(p => {
    const x = (p && typeof p.x === 'number' && !isNaN(p.x)) ? p.x : 0;
    const y = (p && typeof p.y === 'number' && !isNaN(p.y)) ? p.y : 0;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

function textAnchor(i) {
  const x = Math.cos(ang(i));
  if (x > 0.3) return 'start';
  if (x < -0.3) return 'end';
  return 'middle';
}

function dominantBaseline(i) {
  const y = Math.sin(ang(i));
  if (y < -0.3) return 'auto';
  if (y > 0.3) return 'hanging';
  return 'middle';
}

function valColor(val) {
  if (val >= 85) return '#FFD700';
  if (val >= 75) return '#00E676';
  if (val >= 60) return '#FFB300';
  return '#FF3D3D';
}

export default function RadarChart({ stats = {}, size = SIZE, showValues = true }) {
  const scale = size / SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const r  = R * scale;
  const lr = LR * scale;

  function sp(radius, i) {
    return scaledPolar(cx, cy, radius, i);
  }

  // Grid level hexagons
  const gridLevels = Array.from({ length: LEVELS }, (_, l) => {
    const frac = (l + 1) / LEVELS;
    return poly(AXES.map((_, i) => sp(r * frac, i)));
  });

  // Data polygon (Garante que os stats mapeados nunca sejam strings ou vazios)
  const dataPoints = poly(AXES.map((ax, i) => {
    const rawVal = stats && stats[ax.key];
    const parsedVal = parseFloat(rawVal);
    const val = (!isNaN(parsedVal)) ? Math.min(99, Math.max(0, parsedVal)) : 0;
    return sp(r * (val / 100), i);
  }));

  const outerPoly = poly(AXES.map((_, i) => sp(r, i)));

  const fsLabel = Math.round(11 * scale);
  const fsVal   = Math.round(10 * scale);
  const fsBadge = Math.round(9 * scale);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Player radar chart"
      style={{ filter: 'drop-shadow(0 0 30px rgba(0,230,118,0.08))' }}
    >
      <defs>
        {/* Glow filters */}
        <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="radar-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        {/* Gradient fill */}
        <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00E676" stopOpacity="0.30" />
          <stop offset="60%"  stopColor="#00E676" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#00E676" stopOpacity="0.02" />
        </radialGradient>

        {/* Center ambient */}
        <radialGradient id="centerAmbient" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00E676" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
        </radialGradient>

        {/* Outer ring glow */}
        <radialGradient id="outerRingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="80%"  stopColor="transparent" />
          <stop offset="100%" stopColor="#00E676" stopOpacity="0.04" />
        </radialGradient>
      </defs>

      {/* Background ambient glow */}
      <circle cx={cx} cy={cy} r={r * 1.3} fill="url(#centerAmbient)" />
      <circle cx={cx} cy={cy} r={r * 1.1} fill="url(#outerRingGlow)" />

      {/* Grid hexagons */}
      {gridLevels.map((pts, l) => (
        <polygon
          key={l}
          points={pts}
          fill="none"
          stroke={l === LEVELS - 1 ? '#32323e' : '#1e1e28'}
          strokeWidth={l === LEVELS - 1 ? 1.2 : 0.8}
          strokeOpacity={l === LEVELS - 1 ? 0.8 : 0.5}
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((_, i) => {
        const outer = sp(r, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="#262630"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
        );
      })}

      {/* Data shape — glow layer */}
      <polygon
        points={dataPoints}
        fill="none"
        stroke="#00E676"
        strokeWidth={4 * scale}
        strokeOpacity="0.15"
        filter="url(#radar-glow)"
      />

      {/* Data shape — fill */}
      <polygon
        points={dataPoints}
        fill="url(#radarFillGrad)"
        stroke="none"
      />

      {/* Data shape — border */}
      <polygon
        points={dataPoints}
        fill="none"
        stroke="#00E676"
        strokeWidth={1.8 * scale}
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />

      {/* Data vertex dots */}
      {AXES.map((ax, i) => {
        const rawVal = stats && stats[ax.key];
        const parsedVal = parseFloat(rawVal);
        const val = (!isNaN(parsedVal)) ? Math.min(99, Math.max(0, parsedVal)) : 0;
        const p = sp(r * (val / 100), i);
        return (
          <g key={`dot-${i}`}>
            {/* Glow ring */}
            <circle
              cx={p.x} cy={p.y} r={6 * scale}
              fill="#00E676" fillOpacity="0.12"
              filter="url(#dot-glow)"
            />
            {/* Outer ring */}
            <circle
              cx={p.x} cy={p.y} r={4 * scale}
              fill="#08080a"
              stroke="#00E676"
              strokeWidth={1.5 * scale}
            />
            {/* Inner dot */}
            <circle
              cx={p.x} cy={p.y} r={2 * scale}
              fill="#00E676"
            />
          </g>
        );
      })}

      {/* Axis labels + values */}
      {AXES.map((ax, i) => {
        const lp = sp(lr, i);
        const rawVal = stats && stats[ax.key];
        const parsedVal = parseFloat(rawVal);
        const val = (!isNaN(parsedVal)) ? Math.min(99, Math.max(0, parsedVal)) : 0;
        const vc = valColor(val);
        const ta = textAnchor(i);
        const db = dominantBaseline(i);

        // Offset value position slightly below label
        const dy = Math.sin(ang(i)) < -0.3 ? -(fsLabel + 4) * scale :
                   Math.sin(ang(i)) > 0.3  ?  (fsLabel + 2) * scale : 0;

        return (
          <g key={`label-${i}`}>
            {/* Label */}
            <text
              x={lp.x}
              y={lp.y}
              textAnchor={ta}
              dominantBaseline={db}
              fill="#f0f0f5"
              fontSize={fsLabel}
              fontFamily="Outfit, Inter, sans-serif"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              {ax.label}
            </text>
            {/* Value badge */}
            {showValues && (
              <text
                x={lp.x}
                y={lp.y + dy}
                textAnchor={ta}
                dominantBaseline={db}
                fill={vc}
                fontSize={fsBadge}
                fontFamily="Outfit, Inter, sans-serif"
                fontWeight="800"
              >
                {val}
              </text>
            )}
          </g>
        );
      })}

      {/* Outer hex tick marks */}
      {AXES.map((_, i) => {
        const p = sp(r, i);
        return (
          <circle
            key={`tick-${i}`}
            cx={p.x} cy={p.y}
            r={2 * scale}
            fill="#32323e"
          />
        );
      })}
    </svg>
  );
}