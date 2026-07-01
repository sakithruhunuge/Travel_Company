import Hero from "@/components/Hero";
import About from "@/components/About";
import Packages from "@/components/Packages";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import TravelRequestForm from "@/components/TravelRequestForm";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Packages />
      <WhyChooseUs />
      <Testimonials />
      <TravelRequestForm />
      <Contact />
    </>
  );
}
