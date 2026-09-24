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
    roles: ["Professional DJ", `Creative Director, ${profile.management.company}`],
    company: profile.management.company,
    photoUrl: "/cards/emy.png",
    credentials: profile.selectedAppearances.slice(0, 2),
    phone: profile.phone,
    whatsappGreeting: "Hi DJ Emy, great to connect — we met at Dubai Friendly Networking!",
    instagram: profile.instagram,
    youtube: profile.youtube,
  };

  return <DigitalCard {...card} />;
}
