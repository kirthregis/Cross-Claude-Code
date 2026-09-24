"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile-store";
import type { ArtistProfile } from "@/lib/artist";
import { DigitalCard, type CardData } from "@/components/studio/DigitalCard";

export default function EmyCardPage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;

  const card: CardData = {
    name: profile.name || "DJ Emy",
    subtitle: profile.legalName,
    role: profile.tagline,
    company: `Represented by ${profile.management.company}`,
    credentials: profile.selectedAppearances.slice(0, 2),
    phone: profile.phone,
    whatsappGreeting: "Hi DJ Emy, great to connect — we met at Dubai Friendly Networking!",
    instagram: profile.instagram,
    youtube: profile.youtube,
    avatarLetter: (profile.name || "E").charAt(0).toUpperCase(),
  };

  return <DigitalCard {...card} />;
}
