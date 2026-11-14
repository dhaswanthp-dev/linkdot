"use client";

import { useEffect, useRef } from "react";
import { SceneController } from "@/components/scene/scene-controller";

interface LoginSceneProps {
  onReady?: (controller: SceneController | null) => void;
}

export default function LoginScene({ onReady }: LoginSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let controller: SceneController | null = null;
    try {
      controller = new SceneController(host);
      onReady?.(controller);
    } catch (error) {
      console.warn(
        "Decorative 3D scene unavailable; using the CSS background.",
        error,
      );
      onReady?.(null);
    }

    return () => {
      controller?.dispose();
      onReady?.(null);
    };
  }, [onReady]);

  return <div ref={hostRef} className="scene-canvas-host" aria-hidden="true" />;
}
