import Navbar from "../components/layout/navbar.components.jsx";
import Footer from "../components/ui/footer.jsx";
import ContactDrawer from "../components/ui/contact.drawer.jsx";
import HelpCenterDrawer from "../components/ui/helpcenter.drawer.jsx";
import { useAppContext } from "../context/user.context.jsx";
import { 
  Code, 
  Cpu, 
  Layers, 
  Terminal, 
  GraduationCap, 
  BookOpen 
} from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaGithub } from "react-icons/fa";

export default function AboutPage() {
  const { contactOpen, setContactOpen, helpOpen, setHelpOpen } = useAppContext();

  const skills = {
    languages: ["JavaScript", "Python", "Java", "C++", "SQL"],
    frontend: ["React.js", "Vite", "Tailwind CSS", "HTML5", "CSS3", "Framer Motion", "GSAP"],
    backend: ["Node.js", "Express.js", "REST APIs", "JWT Auth", "Socket.io"],
    databases: ["MongoDB", "MySQL", "PostgreSQL"],
    tools: ["Git", "GitHub", "Docker", "Cloudinary", "Prisma ORM", "VS Code"]
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-855 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* HERO SECTION */}
      <main className="flex-1 relative py-20 lg:py-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-blue-200/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 w-[350px] h-[350px] bg-indigo-200/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          
          {/* LEFT: IMAGE (Big Size, Animated) */}
          <div className="md:col-span-5 flex justify-center animate-fade-in order-last md:order-first">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
              <div className="relative bg-white border border-slate-200 rounded-3xl p-4 shadow-xl">
                <img
                  src="/bhavesh_profile.png"
                  alt="Bhavesh Suthar"
                  className="w-full max-w-[320px] aspect-square object-cover rounded-2xl grayscale-[20%] hover:grayscale-0 transition-all duration-300 transform group-hover:scale-[1.02]"
                />
                
                {/* Floating Experience Badge */}
                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-lg shadow-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    AI
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">B.Tech Student</p>
                    <p className="text-xs text-slate-800 font-bold">AI & Data Science</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: INTRO CONTENT */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-600 tracking-wide uppercase">
              <GraduationCap className="w-4 h-4" />
              Gati Shakti Vishwavidyalaya
            </div>

            <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-none text-slate-900">
              Hi, I'm <span className="text-blue-600">Bhavesh</span>
            </h1>

            <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
              I am an AI & Data Science B.Tech student at <strong>Gati Shakti Vishwavidyalaya, Vadodara</strong>.
              As a full-stack developer, I construct scalable backend services and modern frontend designs, with an active focus on bringing Artificial Intelligence and Machine Learning into practical applications.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 font-semibold shadow-sm">
                <Code className="w-3.5 h-3.5 text-blue-500" /> Full Stack Developer
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 font-semibold shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> AI / ML Enthusiast
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 font-semibold shadow-sm">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Backend Engineer
              </span>
            </div>

            {/* SOCIAL LINKS (Large Size Icons) */}
            <div className="pt-4 flex items-center gap-6">
              <a
                href="https://github.com/Bhaveshsuthar28"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 transition-colors duration-200"
              >
                <FaGithub className="w-8 h-8" />
              </a>
              <a
                href="https://www.linkedin.com/in/bhaveshjangid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-600 transition-colors duration-200"
              >
                <FaLinkedinIn className="w-8 h-8" />
              </a>
              <a
                href="https://www.instagram.com/bhavesh.s.k.28?igsh=d2JjOWdyejV6Nnpq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-pink-600 transition-colors duration-200"
              >
                <FaInstagram className="w-8 h-8" />
              </a>
            </div>
          </div>

        </div>

        {/* DETAILED INFORMATION SECTIONS */}
        <div className="max-w-6xl mx-auto px-6 mt-20 grid md:grid-cols-2 gap-8">
          
          {/* WHAT I DO CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-200 transition duration-300 shadow-sm shadow-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">What I Do</h3>
            <ul className="space-y-3.5 text-slate-600 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                Build modern, highly interactive full-stack web applications.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                Develop highly secure REST APIs and structured database models.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                Deploy scalable real-time systems using Socket.io and messaging queues.
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                Implement machine learning models to solve complex real-world issues.
              </li>
            </ul>
          </div>

          {/* CURRENT FOCUS & INTERESTS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-200 transition duration-300 shadow-sm shadow-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Current Focus & Interests</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Current Focus</p>
                <p className="text-sm text-slate-600 mt-1">
                  Mastering Data Structures & Algorithms, building production-ready SaaS projects, and seeking software engineering internships.
                </p>
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Core Interests</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["System Design", "Cloud Computing", "AI/ML", "Microservices", "Deep Learning"].map((interest) => (
                    <span key={interest} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200 font-medium">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SKILLS CONTAINER */}
        <div className="max-w-6xl mx-auto px-6 mt-16">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 lg:p-12 shadow-sm shadow-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <Terminal className="w-6 h-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-slate-900">Technical Toolkit</h3>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
              
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Languages</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.languages.map(s => <span key={s} className="px-2.5 py-1 bg-slate-50 text-xs text-slate-700 border border-slate-150 rounded-md font-medium">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Frontend</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.frontend.map(s => <span key={s} className="px-2.5 py-1 bg-slate-50 text-xs text-slate-700 border border-slate-150 rounded-md font-medium">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Backend</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.backend.map(s => <span key={s} className="px-2.5 py-1 bg-slate-50 text-xs text-slate-700 border border-slate-150 rounded-md font-medium">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Databases</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.databases.map(s => <span key={s} className="px-2.5 py-1 bg-slate-50 text-xs text-slate-700 border border-slate-150 rounded-md font-medium">{s}</span>)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Tools</h4>
                <div className="flex flex-wrap gap-1.5">
                  {skills.tools.map(s => <span key={s} className="px-2.5 py-1 bg-slate-50 text-xs text-slate-700 border border-slate-150 rounded-md font-medium">{s}</span>)}
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>

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
}
