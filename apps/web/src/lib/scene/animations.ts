export type EasingFunction = (progress: number) => number;

export interface TweenHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export type SceneAnimation = "login" | "logout";

export interface ScenePlayback {
  play: (animation: SceneAnimation) => Promise<void>;
}

export const easeInOutCubic: EasingFunction = (progress) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

export function tween(
  duration: number,
  onUpdate: (progress: number) => void,
  easing: EasingFunction = easeInOutCubic,
): TweenHandle {
  if (duration <= 0) {
    onUpdate(1);
    return { promise: Promise.resolve(), cancel: () => undefined };
  }

  let frameId: number | ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  let settled = false;
  let resolvePromise: () => void = () => undefined;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const finish = () => {
    if (settled) return;
    settled = true;
    resolvePromise();
  };

  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const useAnimationFrame = typeof requestAnimationFrame === "function";

  const tick = (now: number) => {
    if (cancelled) {
      finish();
      return;
    }

    const progress = Math.min(1, Math.max(0, (now - start) / duration));
    onUpdate(easing(progress));

    if (progress >= 1) {
      finish();
      return;
    }

    frameId = useAnimationFrame
      ? requestAnimationFrame(tick)
      : setTimeout(
          () =>
            tick(
              typeof performance !== "undefined"
                ? performance.now()
                : Date.now(),
            ),
          16,
        );
  };

  frameId = useAnimationFrame
    ? requestAnimationFrame(tick)
    : setTimeout(
        () =>
          tick(
            typeof performance !== "undefined" ? performance.now() : Date.now(),
          ),
        16,
      );

  return {
    promise,
    cancel: () => {
      if (cancelled || settled) return;
      cancelled = true;
      if (frameId !== undefined) {
        if (useAnimationFrame) cancelAnimationFrame(frameId as number);
        else clearTimeout(frameId as ReturnType<typeof setTimeout>);
      }
      finish();
    },
  };
}

export function playSceneWithFallback(
  scene: ScenePlayback | null,
  animation: SceneAnimation,
  timeoutMs: number,
): Promise<void> {
  if (!scene) return Promise.resolve();

  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      resolve();
    };
    const timeoutId = setTimeout(finish, timeoutMs);

    try {
      void scene.play(animation).then(finish, (error: unknown) => {
        console.warn(`The ${animation} animation could not finish.`, error);
        finish();
      });
    } catch (error) {
      console.warn(`The ${animation} animation could not start.`, error);
      finish();
    }
  });
}
