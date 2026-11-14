"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { displayNameSchema, usernameSchema } from "@/shared/schemas";
import { BrandLoading } from "@/components/brand/brand-loading";
import { BrandLogo } from "@/components/brand/brand-logo";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import {
  createOwnProfile,
  getOwnProfile,
  isUsernameAvailable,
  type Profile,
} from "@/lib/data/profile";
import { listOwnLinks, type Link } from "@/lib/data/links";
import { listOwnSubscribers, type Subscriber } from "@/lib/data/subscribers";
import {
  listOwnCreatorBlocks,
  type CreatorBlock,
} from "@/lib/data/creator-content";
import {
  getOwnProfileAnalytics,
  type ProfileAnalytics,
} from "@/lib/data/analytics";
import { createClient } from "@/lib/supabase/client";

interface ProfileSetupErrors {
  username?: string;
  displayName?: string;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }
  return typeof error.code === "string" ? error.code : undefined;
}

function waitForDashboardExit(element: HTMLElement | null): Promise<void> {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !element
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      element.removeEventListener("animationend", finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 600);
    element.addEventListener("animationend", finish, { once: true });
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const dashboardCardRef = useRef<HTMLElement>(null);
  const setupUsernameCheckId = useRef(0);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [blocks, setBlocks] = useState<CreatorBlock[]>([]);
  const [analytics, setAnalytics] = useState<ProfileAnalytics>({
    visits: 0,
    unique_visitors: 0,
    clicks: 0,
    daily: [],
    sources: [],
    popular_links: [],
  });
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [setupErrors, setSetupErrors] = useState<ProfileSetupErrors>({});
  const [setupUsernameStatus, setSetupUsernameStatus] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadProfileData = useCallback(async () => {
    const [ownLinks, ownSubscribers, ownBlocks, ownAnalytics] =
      await Promise.all([
        listOwnLinks(),
        listOwnSubscribers(),
        listOwnCreatorBlocks(),
        getOwnProfileAnalytics(30),
      ]);
    setLinks(ownLinks);
    setSubscribers(ownSubscribers);
    setBlocks(ownBlocks);
    setAnalytics(ownAnalytics);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void = () => {};

    async function initializeSession() {
      try {
        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          if (event === "SIGNED_OUT" || !session) {
            router.replace("/login");
            return;
          }
          setEmail(session.user.email ?? "");
        });
        unsubscribe = data.subscription.unsubscribe;

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          router.replace("/login");
          return;
        }
        setEmail(sessionData.session.user.email ?? "");

        const ownProfile = await getOwnProfile();
        if (!isMounted) return;
        setProfile(ownProfile);
        setHasLoadedProfile(true);
        if (ownProfile) await loadProfileData();
        if (!isMounted) return;
        setIsCheckingSession(false);
      } catch {
        if (!isMounted) return;
        setError(
          "We could not load your workspace. Check your connection and Supabase settings, then try again.",
        );
        setIsCheckingSession(false);
      }
    }

    void initializeSession();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadProfileData, router]);

  async function checkSetupUsernameAvailability() {
    const checkId = ++setupUsernameCheckId.current;
    setSetupUsernameStatus("");
    setIsCheckingUsername(false);
    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setSetupErrors((current) => ({
        ...current,
        username:
          parsedUsername.error.issues[0]?.message ?? "Enter a valid username.",
      }));
      return;
    }

    setIsCheckingUsername(true);
    setSetupErrors((current) => ({ ...current, username: undefined }));
    try {
      const available = await isUsernameAvailable(parsedUsername.data);
      if (checkId !== setupUsernameCheckId.current) return;
      setSetupUsernameStatus(
        available ? "Username is available." : "That username is taken",
      );
      if (!available) {
        setSetupErrors((current) => ({
          ...current,
          username: "That username is taken",
        }));
      }
    } catch {
      if (checkId !== setupUsernameCheckId.current) return;
      setSetupUsernameStatus(
        "We could not check availability. Saving still verifies the username.",
      );
    } finally {
      if (checkId === setupUsernameCheckId.current) {
        setIsCheckingUsername(false);
      }
    }
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingProfile) return;

    const parsedUsername = usernameSchema.safeParse(username);
    const parsedDisplayName = displayNameSchema.safeParse(displayName);
    const nextErrors: ProfileSetupErrors = {};
    if (!parsedUsername.success) {
      nextErrors.username =
        parsedUsername.error.issues[0]?.message ?? "Enter a valid username.";
    }
    if (!parsedDisplayName.success) {
      nextErrors.displayName =
        parsedDisplayName.error.issues[0]?.message ??
        "Enter a display name from 1 to 60 characters.";
    }
    setSetupErrors(nextErrors);
    setError("");
    setStatus("");
    if (!parsedUsername.success || !parsedDisplayName.success) return;

    setIsCreatingProfile(true);
    try {
      const createdProfile = await createOwnProfile({
        username: parsedUsername.data,
        display_name: parsedDisplayName.data,
      });
      setProfile(createdProfile);
      setStatus("Your profile is ready.");
      await loadProfileData();
    } catch (profileError) {
      const usernameTaken = getErrorCode(profileError) === "23505";
      if (usernameTaken) {
        setSetupErrors((current) => ({
          ...current,
          username: "That username is taken",
        }));
      }
      setError(
        usernameTaken
          ? "That username is taken"
          : "We could not create your profile. Please try again.",
      );
    } finally {
      setIsCreatingProfile(false);
    }
  }

  async function handleSignOut() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError("");
    setStatus("");

    await waitForDashboardExit(dashboardCardRef.current);
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) {
        setError("We could not end your session. Please try again.");
        setIsLoggingOut(false);
        return;
      }
      router.replace("/login");
    } catch {
      setError("We could not end your session. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <main
      className={`dashboard-screen ${isLoggingOut ? "dashboard-signing-out" : ""}`}
    >
      <section
        className="dashboard-card dashboard-editor-card"
        aria-labelledby="dashboard-heading"
        ref={dashboardCardRef}
      >
        <header className="dashboard-header">
          <BrandLogo compact />
          <div className="dashboard-account">
            <span>{email}</span>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={handleSignOut}
              disabled={isCheckingSession || isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Log out"}
            </button>
          </div>
        </header>

        <h1 id="dashboard-heading">Your studio</h1>
        {isCheckingSession ? (
          <BrandLoading label="Checking your session and loading your profile..." />
        ) : profile ? (
          <>
            <p className="dashboard-message">
              Shape your page, <strong>{profile.display_name}</strong>.
            </p>
            {status && (
              <p className="dashboard-status" role="status">
                {status}
              </p>
            )}
            {error && (
              <p className="dashboard-error" role="alert">
                {error}
              </p>
            )}
            <DashboardTabs
              profile={profile}
              links={links}
              blocks={blocks}
              analytics={analytics}
              subscribers={subscribers}
              onProfileChange={setProfile}
              onLinksChange={setLinks}
              onBlocksChange={setBlocks}
            />
          </>
        ) : hasLoadedProfile ? (
          <>
            <p className="dashboard-message">
              Choose your page address to finish setting up your profile.
            </p>
            {error && (
              <p className="dashboard-error" role="alert">
                {error}
              </p>
            )}
            <form
              className="dashboard-form"
              onSubmit={handleCreateProfile}
              noValidate
            >
              <label htmlFor="setup-display-name">Display name</label>
              <input
                className="input input-bordered"
                id="setup-display-name"
                autoComplete="name"
                maxLength={60}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-invalid={Boolean(setupErrors.displayName)}
                aria-describedby={
                  setupErrors.displayName ? "setup-name-error" : undefined
                }
              />
              {setupErrors.displayName && (
                <p
                  className="dashboard-error"
                  id="setup-name-error"
                  role="alert"
                >
                  {setupErrors.displayName}
                </p>
              )}
              <label htmlFor="setup-username">Username</label>
              <div className="username-input-row">
                <span aria-hidden="true">linkdot.co/</span>
                <input
                  className="input input-bordered"
                  id="setup-username"
                  autoComplete="username"
                  maxLength={30}
                  value={username}
                  onChange={(event) => {
                    setupUsernameCheckId.current += 1;
                    setIsCheckingUsername(false);
                    setUsername(event.target.value);
                    setSetupErrors((current) => ({
                      ...current,
                      username: undefined,
                    }));
                    setSetupUsernameStatus("");
                  }}
                  onBlur={() => void checkSetupUsernameAvailability()}
                  aria-invalid={Boolean(setupErrors.username)}
                  aria-describedby={
                    setupErrors.username
                      ? "setup-username-error"
                      : setupUsernameStatus
                        ? "setup-username-status"
                        : "setup-username-help"
                  }
                />
              </div>
              {setupErrors.username && (
                <p
                  className="dashboard-error"
                  id="setup-username-error"
                  role="alert"
                >
                  {setupErrors.username}
                </p>
              )}
              <p className="dashboard-muted" id="setup-username-help">
                Use 3–30 lowercase letters, numbers, or underscores.
              </p>
              {isCheckingUsername && (
                <p className="dashboard-muted" role="status">
                  Checking username...
                </p>
              )}
              {!setupErrors.username && setupUsernameStatus && (
                <p
                  className="dashboard-muted"
                  id="setup-username-status"
                  role="status"
                >
                  {setupUsernameStatus}
                </p>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isCreatingProfile}
              >
                {isCreatingProfile ? "Creating..." : "Create profile"}
              </button>
            </form>
          </>
        ) : (
          <p className="dashboard-error" role="alert">
            {error ||
              "Your profile could not be loaded. Please refresh to try again."}
          </p>
        )}
      </section>
    </main>
  );
}
