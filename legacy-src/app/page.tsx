import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ScrollProgress } from "@/components/common/ScrollProgress";
import { CustomCursor } from "@/components/common/CustomCursor";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { Dashboard } from "@/components/sections/Dashboard";
import { Impact } from "@/components/sections/Impact";
import { Architecture } from "@/components/sections/Architecture";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Dashboard />
        <Impact />
        <Architecture />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
