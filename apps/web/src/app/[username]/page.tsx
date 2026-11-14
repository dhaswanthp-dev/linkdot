import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileView } from "@/components/public-profile/public-profile-view";
import { getPublicCreatorData } from "@/lib/data/public-profile";
import { usernameSchema } from "@/shared/schemas";

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return { title: "Creator page | Linkdot" };

  const creator = await getPublicCreatorData(parsed.data);
  if (!creator) return { title: "Creator page | Linkdot" };

  return {
    title: `${creator.profile.display_name} | Linkdot`,
    description:
      creator.profile.bio ??
      `Explore ${creator.profile.display_name}'s links and creator page.`,
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) notFound();

  const creator = await getPublicCreatorData(parsed.data);
  if (!creator) notFound();

  return <PublicProfileView creator={creator} />;
}
