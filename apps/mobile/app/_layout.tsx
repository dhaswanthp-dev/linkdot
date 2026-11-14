import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { BrandLoading } from "@/components/BrandLoading";
import { useColorScheme } from "@/components/useColorScheme";
import { supabase } from "@/lib/supabase";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <BrandLoading label="Loading Linkdot" />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setHasSession(Boolean(session));
    });

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        Alert.alert("Session unavailable", "Please sign in again.");
        setHasSession(false);
      } else {
        setHasSession(Boolean(data.session));
      }
      setSessionReady(true);
    }

    void restoreSession().catch((error: unknown) => {
      console.error("Unable to restore the mobile session.", error);
      if (active) {
        Alert.alert("Session unavailable", "Please sign in again.");
        setHasSession(false);
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    const isSignInRoute = segments[0] === "sign-in";
    if (!hasSession && !isSignInRoute) {
      router.replace("/sign-in");
    } else if (hasSession && isSignInRoute) {
      router.replace("/(tabs)");
    }
  }, [hasSession, router, segments, sessionReady]);

  useEffect(() => {
    let active = true;

    async function completeEmailSignIn(url: string) {
      const { queryParams } = Linking.parse(url);
      const code = queryParams?.code;
      if (typeof code !== "string") return;

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (error) {
        Alert.alert(
          "Sign-in link expired",
          "Request a new sign-in link and try again.",
        );
      }
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void completeEmailSignIn(url).catch((error: unknown) => {
        console.error("Unable to complete email sign-in.", error);
        Alert.alert(
          "Sign-in link unavailable",
          "Request a new sign-in link and try again.",
        );
      });
    });

    void Linking.getInitialURL()
      .then((url) => {
        if (url) return completeEmailSignIn(url);
      })
      .catch((error: unknown) => {
        console.error("Unable to read the initial sign-in link.", error);
      });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  if (!sessionReady) {
    return <BrandLoading label="Restoring your session" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
