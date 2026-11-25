import type { Metadata } from "next";
import { Game } from "@/components/game/Game";

export const metadata: Metadata = {
  title: "Play | Hima",
  description:
    "Hot-seat FROST: run a real key ceremony, catch a cheater and make unlinkable threshold signatures, all in your browser.",
};

export default function PlayPage() {
  return <Game />;
}
