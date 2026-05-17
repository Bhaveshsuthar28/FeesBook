import Navbar from "../components/layout/navbar.components.jsx";
import FeaturesSection from "../components/ui/features.section.jsx";
import Footer from "../components/ui/footer.jsx";
import HeroSection from "../components/ui/home.herosection.jsx";
import HowItWorksSection from "../components/ui/howwork.jsx";
import TestimonialsSection from "../components/ui/testimonial.section.jsx";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSection/>

      <FeaturesSection/>

      <HowItWorksSection/>
      
      <TestimonialsSection/>

      <Footer/>
    </div>
  );
};

export default Home;