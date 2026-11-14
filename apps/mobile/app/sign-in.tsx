import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { subscriberEmailSchema } from "@/shared/schemas";

import { supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  function validateEmail(): string | null {
    const result = subscriberEmailSchema.safeParse(email.trim());
    const message = result.success
      ? ""
      : (result.error.issues[0]?.message ?? "Enter a valid email address.");
    setEmailError(message);
    return message || null;
  }

  async function handleSignIn() {
    if (isBusy) return;
    const emailInvalid = validateEmail();
    const nextPasswordError =
      password.length >= 8 ? "" : "Password must be at least 8 characters.";
    setPasswordError(nextPasswordError);
    setFormMessage("");
    if (emailInvalid || nextPasswordError) return;

    setIsBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormMessage(
          error.message.toLowerCase().includes("invalid login credentials")
            ? "That email and password do not match. Check them and try again."
            : "We could not sign you in. Please try again.",
        );
      }
    } catch {
      setFormMessage(
        "Sign-in is temporarily unavailable. Check your connection and try again.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEmailLink() {
    if (isBusy) return;
    if (validateEmail()) return;

    setFormMessage("");
    setIsBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: Linking.createURL("sign-in"),
        },
      });

      setFormMessage(
        error
          ? "We could not send a sign-in link. Check your email and try again."
          : "Check your email for a sign-in link.",
      );
    } catch {
      setFormMessage(
        "We could not send a sign-in link. Check your connection and try again.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.brand}>
              <Image
                accessibilityLabel="Linkdot 3D octopus logo"
                resizeMode="contain"
                source={require("../assets/images/linkdot-icon.png")}
                style={styles.brandLogo}
              />
              <Text style={styles.brandName}>
                <Text style={styles.brandLink}>LINK</Text>
                <Text style={styles.brandDot}>DOT</Text>
              </Text>
            </View>

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to manage your page.</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              accessibilityHint={emailError || "Enter your account email."}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setEmailError("");
              }}
              onSubmitEditing={handleSignIn}
              placeholder="you@studio.com"
              returnKeyType="next"
              style={[styles.input, emailError ? styles.inputError : null]}
              textContentType="emailAddress"
              value={email}
            />
            {emailError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {emailError}
              </Text>
            ) : null}

            <Text style={styles.label}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              accessibilityHint={
                passwordError || "Password must be at least 8 characters."
              }
              autoCapitalize="none"
              autoComplete="current-password"
              onChangeText={(value) => {
                setPassword(value);
                setPasswordError("");
              }}
              onSubmitEditing={handleSignIn}
              placeholder="At least 8 characters"
              returnKeyType="go"
              secureTextEntry
              style={[styles.input, passwordError ? styles.inputError : null]}
              textContentType="password"
              value={password}
            />
            {passwordError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {passwordError}
              </Text>
            ) : null}

            {formMessage ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole={
                  formMessage.startsWith("Check your email") ? "text" : "alert"
                }
                style={
                  formMessage.startsWith("Check your email")
                    ? styles.status
                    : styles.error
                }
              >
                {formMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Sign in"
              accessibilityRole="button"
              disabled={isBusy}
              onPress={handleSignIn}
              style={[styles.primaryButton, isBusy && styles.disabled]}
            >
              {isBusy ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityLabel="Email me a sign-in link instead"
              accessibilityRole="button"
              disabled={isBusy}
              onPress={handleEmailLink}
              style={[styles.secondaryButton, isBusy && styles.disabled]}
            >
              <Text style={styles.secondaryButtonText}>
                Email me a sign-in link instead
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#efe4d2",
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e9e1d5",
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 440,
    padding: 24,
    width: "100%",
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  brandLogo: {
    height: 44,
    width: 44,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
  },
  brandLink: {
    color: "#151311",
  },
  brandDot: {
    color: "#e87500",
  },
  heading: {
    color: "#10231a",
    fontSize: 30,
    fontWeight: "800",
  },
  subheading: {
    color: "#62645f",
    fontSize: 15,
    marginBottom: 24,
    marginTop: 6,
  },
  label: {
    color: "#292d28",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d1c6",
    borderRadius: 12,
    borderWidth: 1,
    color: "#10231a",
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: "#b42318",
  },
  error: {
    color: "#a32117",
    fontSize: 13,
    marginTop: 6,
  },
  status: {
    color: "#245d3b",
    fontSize: 14,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#10231a",
    borderRadius: 13,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#cfc8bd",
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: "#10231a",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});
