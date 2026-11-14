import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  compact?: boolean;
  surface?: boolean;
}

export function BrandLogo({
  compact = false,
  surface = false,
}: BrandLogoProps) {
  return (
    <Link
      aria-label="Linkdot home"
      className={`brand-logo${compact ? " brand-logo-compact" : ""}${surface ? " brand-logo-surface" : ""}`}
      href="/"
    >
      <Image
        alt="Linkdot 3D octopus emblem"
        className="brand-logo-image"
        height={768}
        src="/assets/linkdot-logo.png"
        width={868}
      />
      <span className="brand-logo-wordmark" aria-label="Linkdot">
        <span>LINK</span>
        <span>DOT</span>
      </span>
    </Link>
  );
}
