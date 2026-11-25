import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import {
  Architecture,
  Closing,
  Footer,
  Idea,
  Levels,
  Roadmap,
  Trust,
  TryIt,
} from "@/components/sections/Content";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Idea />
        <TryIt />
        <Levels />
        <Architecture />
        <Trust />
        <Roadmap />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
