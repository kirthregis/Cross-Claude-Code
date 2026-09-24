"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile-store";
import type { ArtistProfile } from "@/lib/artist";
import { DigitalCard, type CardData } from "@/components/studio/DigitalCard";

export default function KirthCardPage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (!profile) return null;
  const m = profile.management;

  const card: CardData = {
    name: "Kirth Regis",
    roles: ["Co-Founder, Business Development"],
    company: m.company,
    photoUrl: "/cards/kirth.jpg",
    phone: m.phone,
    whatsappGreeting: "Hi Kirth, great to connect — we met at Dubai Friendly Networking!",
    email: m.email,
    instagram: m.instagram,
    website: m.website,
  };

  return <DigitalCard {...card} />;
}
