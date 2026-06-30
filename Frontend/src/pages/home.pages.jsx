import Navbar from "../components/layout/navbar.components.jsx";
import FeaturesSection from "../components/ui/features.section.jsx";
import Footer from "../components/ui/footer.jsx";
import HeroSection from "../components/ui/home.herosection.jsx";
import HowItWorksSection from "../components/ui/howwork.jsx";
import TestimonialsSection from "../components/ui/testimonial.section.jsx";
import PricingSection from "../components/ui/pricing.section.jsx";
import FAQSection from "../components/ui/faq.section.jsx";
import ContactDrawer from "../components/ui/contact.drawer.jsx";
import HelpCenterDrawer from "../components/ui/helpcenter.drawer.jsx";
import CTASection from "../components/ui/cta.section.jsx";
import { useAppContext } from "../context/user.context.jsx";

const Home = () => {
  const { contactOpen, setContactOpen, helpOpen, setHelpOpen } = useAppContext();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <HeroSection />

      <FeaturesSection />

      <HowItWorksSection />
      
      <PricingSection />

      <TestimonialsSection />

      <CTASection />

      <FAQSection />

      <Footer />

      <ContactDrawer 
        isOpen={contactOpen} 
        onClose={() => setContactOpen(false)} 
      />
      <HelpCenterDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        onOpenContact={() => setContactOpen(true)}
      />
    </div>
  );
};

export default Home;