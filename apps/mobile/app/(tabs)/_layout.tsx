import { Image, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "left",
        headerStyle: {
          backgroundColor: "#fbf2e6",
        },
        headerShadowVisible: false,
        headerTitle: () => (
          <View style={styles.brand}>
            <Image
              accessibilityLabel="Linkdot 3D octopus logo"
              resizeMode="contain"
              source={require("../../assets/images/linkdot-icon.png")}
              style={styles.logo}
            />
            <Text style={styles.wordmark}>
              <Text style={styles.link}>LINK</Text>
              <Text style={styles.dot}>DOT</Text>
            </Text>
          </View>
        ),
        tabBarActiveTintColor: "#d96c00",
        tabBarInactiveTintColor: "#62645f",
        tabBarStyle: {
          backgroundColor: "#fffaf2",
          borderTopColor: "#e5dbca",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Links",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "link", android: "link", web: "link" }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.crop.circle",
                android: "person",
                web: "person",
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  logo: {
    height: 34,
    width: 38,
  },
  wordmark: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  link: {
    color: "#151311",
  },
  dot: {
    color: "#e87500",
  },
});
