import Image from "next/image";

interface BrandLoadingProps {
  label?: string;
}

export function BrandLoading({
  label = "Loading your Linkdot workspace...",
}: BrandLoadingProps) {
  return (
    <div className="brand-loading" role="status" aria-label={label}>
      <Image
        alt=""
        className="brand-loading-image"
        height={1024}
        src="/assets/linkdot-app-icon.png"
        width={1024}
      />
      <span>{label}</span>
    </div>
  );
}
