import type { Metadata } from "next";
import { Academy } from "@/components/academy/Academy";

export const metadata: Metadata = {
  title: "Zcash Academy | Hima",
  description:
    "Learn Zcash by playing: see what a spy sees on transparent vs shielded payments, play a real zero-knowledge proof, use a viewing key, and defeat Vex.",
};

export default function LearnPage() {
  return <Academy />;
}
