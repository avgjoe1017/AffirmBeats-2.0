import React from "react";
import { View, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";

interface LockIconProps {
  size?: number;
  opacity?: number;
  color?: string;
  placement?: "top-right" | "inline";
}

/**
 * Lock Icon Component
 * 
 * Non-intrusive lock icon for premium features
 * Specs: 14-16px, 70% opacity, white at 60%
 */
const LockIcon: React.FC<LockIconProps> = ({
  size = 14,
  opacity = 0.7,
  color = "rgba(255, 255, 255, 0.6)",
  placement = "top-right",
}) => {
  const containerStyle = placement === "top-right" 
    ? styles.topRight 
    : styles.inline;

  return (
    <View style={[containerStyle, { opacity }]}>
      <Lock size={size} color={color} strokeWidth={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  topRight: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 10,
  },
  inline: {
    marginLeft: 4,
  },
});

export default LockIcon;

