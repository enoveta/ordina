import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

const PURPLE = '#8B5CF6';

type OrdinaMarkProps = {
  size?: number;
  color?: string;
};

export function OrdinaMark({ size = 120, color = PURPLE }: OrdinaMarkProps) {
  const cx = 100;
  const cy = 100;
  const r = 62;
  const nodes = Array.from({ length: 8 }, (_, i) => {
    const angle = ((i * 45 - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`ordinaGlow-${size}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="42%" stopColor={color} stopOpacity="0.45" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r="92" fill={`url(#ordinaGlow-${size})`} />
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length];
        return (
          <Line
            key={`edge-${i}`}
            x1={node.x}
            y1={node.y}
            x2={next.x}
            y2={next.y}
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        );
      })}
      {nodes.map((node, i) => (
        <Line
          key={`spoke-${i}`}
          x1={cx}
          y1={cy}
          x2={node.x}
          y2={node.y}
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
      {nodes.map((node, i) => (
        <Circle key={`node-${i}`} cx={node.x} cy={node.y} r="7" fill={color} />
      ))}
      <Circle cx={cx} cy={cy} r="7" fill="#FFFFFF" />
    </Svg>
  );
}
