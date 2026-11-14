import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

interface BrandLoadingProps {
  label?: string;
}

export function BrandLoading({ label = "Loading Linkdot" }: BrandLoadingProps) {
  const pulse = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.94,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          accessibilityLabel="Linkdot 3D octopus logo"
          resizeMode="contain"
          source={require("../assets/images/linkdot-icon.png")}
          style={styles.logo}
        />
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#fbf2e6",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    height: 112,
    width: 112,
  },
  label: {
    color: "#5b5146",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 16,
  },
});
