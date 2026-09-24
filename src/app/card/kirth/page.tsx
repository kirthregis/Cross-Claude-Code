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
    name: m.contactName || "Kirth Regis",
    role: m.contactRole ? `Co-Owner, ${m.company}` : m.company,
    company: `${m.company} — Artist Management & Entertainment`,
    phone: m.phone,
    whatsappGreeting: "Hi Kirth, great to connect — we met at Dubai Friendly Networking!",
    email: m.email,
    instagram: m.instagram,
    website: m.website,
    avatarLetter: (m.contactName || "K").charAt(0).toUpperCase(),
  };

  return <DigitalCard {...card} />;
}
