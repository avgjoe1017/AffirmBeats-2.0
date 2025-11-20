import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface LoopLogoProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Loop Logo Component
 * 
 * A custom loop/cycle icon representing Recenter
 * Designed as a continuous loop with a subtle teal accent
 */
const LoopLogo: React.FC<LoopLogoProps> = ({
  size = 64,
  color = "#44B09E", // Brand teal
  strokeWidth = 2,
}) => {
  // Create a loop path - two overlapping arcs forming a continuous loop
  const center = size / 2;
  const radius = size * 0.3;
  const offset = size * 0.1;

  // Path for a continuous loop (infinity/lemniscate inspired)
  const loopPath = `
    M ${center - radius} ${center}
    C ${center - radius} ${center - offset}, ${center - offset} ${center - radius}, ${center} ${center - radius}
    C ${center + offset} ${center - radius}, ${center + radius} ${center - offset}, ${center + radius} ${center}
    C ${center + radius} ${center + offset}, ${center + offset} ${center + radius}, ${center} ${center + radius}
    C ${center - offset} ${center + radius}, ${center - radius} ${center + offset}, ${center - radius} ${center}
    Z
  `;

  // Alternative: Simpler loop path (two overlapping circles)
  const simpleLoopPath = `
    M ${center - radius * 0.7} ${center}
    A ${radius} ${radius} 0 1 1 ${center + radius * 0.7} ${center}
    A ${radius} ${radius} 0 1 1 ${center - radius * 0.7} ${center}
  `;

  // Infinity symbol path (more elegant)
  const infinityPath = `
    M ${center - radius * 1.2} ${center}
    C ${center - radius * 1.2} ${center - radius * 0.6}, ${center - radius * 0.6} ${center - radius * 0.6}, ${center} ${center - radius * 0.6}
    C ${center + radius * 0.6} ${center - radius * 0.6}, ${center + radius * 1.2} ${center - radius * 0.6}, ${center + radius * 1.2} ${center}
    C ${center + radius * 1.2} ${center + radius * 0.6}, ${center + radius * 0.6} ${center + radius * 0.6}, ${center} ${center + radius * 0.6}
    C ${center - radius * 0.6} ${center + radius * 0.6}, ${center - radius * 1.2} ${center + radius * 0.6}, ${center - radius * 1.2} ${center}
    Z
  `;

  // Clean infinity/loop path
  const cleanLoopPath = `
    M ${center - radius * 1.1} ${center}
    C ${center - radius * 1.1} ${center - radius * 0.5}, ${center - radius * 0.5} ${center - radius * 0.5}, ${center} ${center - radius * 0.5}
    C ${center + radius * 0.5} ${center - radius * 0.5}, ${center + radius * 1.1} ${center - radius * 0.5}, ${center + radius * 1.1} ${center}
    C ${center + radius * 1.1} ${center + radius * 0.5}, ${center + radius * 0.5} ${center + radius * 0.5}, ${center} ${center + radius * 0.5}
    C ${center - radius * 0.5} ${center + radius * 0.5}, ${center - radius * 1.1} ${center + radius * 0.5}, ${center - radius * 1.1} ${center}
  `;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path
          d={cleanLoopPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LoopLogo;

