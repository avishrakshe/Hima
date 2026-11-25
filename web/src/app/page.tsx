import { AgentShowcase } from "@/components/poster/AgentShowcase";
import { PosterHero } from "@/components/poster/PosterHero";
import { PosterNav } from "@/components/poster/PosterNav";
import { FinalCta, HowItWorks, Honest, Missions, PosterFooter, Proof } from "@/components/poster/Sections";

export default function Home() {
  return (
    <>
      <PosterNav />
      <main className="bg-night">
        <PosterHero />
        <AgentShowcase />
        <Missions />
        <HowItWorks />
        <Proof />
        <Honest />
        <FinalCta />
      </main>
      <PosterFooter />
    </>
  );
}
