import Hero from "@/components/Hero";
import About from "@/components/About";
import Destinations from "@/components/Destinations";
import Packages from "@/components/Packages";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Destinations />
      <Packages />
      <WhyChooseUs />
      <Testimonials />
      <Contact />
    </>
  );
}
