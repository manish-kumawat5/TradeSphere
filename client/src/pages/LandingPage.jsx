import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { TiMenu2, TiChevronDown } from "react-icons/ti";
import { FaSearch } from "react-icons/fa";
import { FiBarChart2, FiDollarSign, FiBell, FiBriefcase, FiShield, FiTrendingUp } from "react-icons/fi";
import { useInView } from "react-intersection-observer";

/* Helper hook for animated counters */
function useCounter(target, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / target));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* Navbar */
function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  const [shadow, setShadow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShadow(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`sticky top-0 z-50 bg-white border-b border-[#E8E8E8] ${shadow ? "shadow-[0_2px_12px_rgba(0,0,0,0.08)]" : ""}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00D09C] to-[#00A878]" />
          <span className="text-[#1A1A2E] font-inter font-semibold text-lg">TradeSphere</span>
        </div>
        {/* Desktop Nav Links */}
        <ul className="hidden md:flex space-x-6 text-[#1A1A2E]">
          <li><Link to="/markets">Stocks</Link></li>
          <li><Link to="/fno">F&amp;O</Link></li>
          <li><Link to="/funds">Mutual Funds</Link></li>
          <li className="flex items-center"><Link to="#">More</Link><TiChevronDown className="ml-1" size={12} /></li>
        </ul>
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <input
              type="text"
              placeholder="Search stocks, funds…"
              className="w-56 h-9 rounded-full border border-[#E0E0E0] px-4 text-sm focus:outline-none"
            />
            <span className="ml-2 text-xs text-gray-500">Ctrl+K</span>
          </div>
          {/* Auth links */}
          {isAuthenticated ? (
            <Link to="/dashboard" className="text-[#1A1A2E]">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-[#1A1A2E]">Login</Link>
              <Link to="/signup" className="bg-[#00D09C] text-white rounded-full px-5 py-2 font-semibold hover:bg-[#00B889]">Sign up</Link>
            </>
          )}
          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <TiMenu2 size={28} />
          </button>
        </div>
      </div>
      {/* Mobile panel */}
      <div className={`md:hidden overflow-hidden transition-max-height duration-300 ${open ? "max-h-screen" : "max-h-0"}`}>
        <ul className="flex flex-col space-y-2 bg-white px-4 pb-4">
          <li><Link to="/markets" onClick={() => setOpen(false)}>Stocks</Link></li>
          <li><Link to="/fno" onClick={() => setOpen(false)}>F&amp;O</Link></li>
          <li><Link to="/funds" onClick={() => setOpen(false)}>Mutual Funds</Link></li>
          <li><Link to="#" onClick={() => setOpen(false)}>More</Link></li>
        </ul>
      </div>
    </nav>
  );
}

/* Market Ticker */
const tickerItems = [
  { symbol: "NIFTY 50", value: "22,525.68", change: "+1.03%", direction: "up" },
  { symbol: "SENSEX", value: "76,033.32", change: "+1.22%", direction: "up" },
  { symbol: "BANKNIFTY", value: "47,722.11", change: "-3.01%", direction: "down" },
  { symbol: "INDIAVIX", value: "15.58", change: "-0.32%", direction: "down" },
  { symbol: "FINNIFTY", value: "25,262.85", change: "+0.22%", direction: "up" },
  { symbol: "NIFTYMIDSELECT", value: "13,903.15", change: "+0.87%", direction: "up" },
];
function MarketTicker() {
  return (
    <div className="h-10 border-b border-[#F0F0F0] overflow-hidden bg-white flex items-center text-sm">
      <div className="animate-ticker whitespace-nowrap flex space-x-6 px-4">
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-1">
            <span className="text-gray-500">{item.symbol}</span>
            <span className="font-medium text-[#1A1A2E]">{item.value}</span>
            <span className={item.direction === "up" ? "text-[#00D09C]" : "text-[#FF5252]"}>{item.change}</span>
            <span className="text-gray-300">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Hero Section */
function HeroSection() {
  const heroVariants = { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 } };
  return (
    <section className="min-h-screen flex flex-col lg:flex-row items-center bg-white px-4 py-12 lg:py-0 max-w-7xl mx-auto">
      {/* Left */}
      <motion.div className="lg:w-5/12 space-y-4" variants={heroVariants} initial="initial" animate="animate" transition={{ staggerChildren: 0.15 }}>
        <div className="bg-[#E8FBF5] text-[#00A878] text-xs rounded-full px-4 py-1 inline-block">India's smartest virtual trading platform</div>
        <h1 className="font-inter font-bold text-5xl leading-snug text-[#1A1A2E]">
          Trade <span className="text-[#00D09C]">smarter</span>, grow faster
        </h1>
        <p className="text-lg text-[#555] max-w-md">
          Practice trading with ₹1,00,000 virtual money. Real charts, real prices, zero risk.
        </p>
        <div className="flex space-x-4 mt-4">
          <Link to="/signup" className="bg-[#00D09C] text-white rounded-full px-7 py-3.5 font-semibold hover:scale-105 transform transition">
            Start trading free
          </Link>
          <Link to="/demo" className="border-2 border-[#00D09C] text-[#00D09C] rounded-full px-7 py-3.5 font-medium hover:bg-[#E8FBF5]">
            Watch demo
          </Link>
        </div>
        <div className="text-xs text-gray-500 mt-4 flex space-x-4">
          <span>✓ No credit card required</span>
          <span>✓ Free forever</span>
          <span>✓ Instant access</span>
        </div>
      </motion.div>
      {/* Right – SVG Illustration */}
      <motion.div className="lg:w-7/12 mt-8 lg:mt-0" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        {/* Simplified isometric SVG */}
        <svg viewBox="0 0 600 500" className="w-full h-auto">
          {/* Grid base */}
          <rect width="600" height="500" fill="#F2F4F7" />
          {/* Stock exchange tower */}
          <rect x="260" y="150" width="80" height="200" fill="white" stroke="#00D09C" strokeWidth="2" />
          {/* Bank building */}
          <rect x="150" y="250" width="120" height="100" fill="#1A1A2E" />
          {/* Dome building */}
          <ellipse cx="460" cy="300" rx="70" ry="40" fill="#E8FBF5" stroke="#00D09C" strokeWidth="2" />
          {/* Trees */}
          {[...Array(5)].map((_, i) => (
            <g key={i} transform={`translate(${80 + i * 100},380)`}>
              <line y2="-30" stroke="#00D09C" strokeOpacity="0.6" strokeWidth="2" />
              <circle r="10" fill="#00D09C" fillOpacity="0.6" />
            </g>
          ))}
          {/* Road */}
          <rect x="0" y="430" width="600" height="40" fill="#E0E4EA" />
          {/* Ticker board */}
          <rect x="270" y="140" width="60" height="10" fill="#00D09C" />
          {/* Signboard */}
          <text x="260" y="120" fill="#00D09C" fontSize="20" fontFamily="Inter" fontWeight="700">TradeSphere</text>
        </svg>
      </motion.div>
    </section>
  );
}

/* Stats Banner */
function StatsBanner() {
  const stats = [
    { value: 200000, label: "Virtual traders" },
    { value: 50000000000, label: "Virtual volume traded" },
    { value: 5000, label: "Stocks & ETFs" },
    { value: 4.8, label: "App rating" },
  ];
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <section className="bg-[#F8FFF9] border-t border-b border-[#E0F5EC] py-10" ref={ref}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        {stats.map((s, i) => {
          const count = inView ? useCounter(Math.round(s.value)) : 0;
          return (
            <div key={i} className={`flex flex-col items-center ${i < stats.length - 1 ? "border-r border-[#D0EDE3]" : ""}`}>
              <span className="font-inter font-bold text-2xl text-[#1A1A2E]">
                {s.label === "App rating" ? `${count / 10}` : count.toLocaleString()}
                {s.label === "Virtual volume traded" ? "Cr+" : ""}
              </span>
              <span className="text-sm text-[#666] mt-1">{s.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* Feature Card */
function FeatureCard({ Icon, title, desc }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white border border-[#EDEDED] rounded-xl p-7 transition-colors duration-200" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 40 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-11 h-11 flex items-center justify-center bg-[#E8FBF5] rounded">
          <Icon className="text-[#00D09C]" size={22} />
        </div>
        <h3 className="font-inter font-semibold text-lg text-[#1A1A2E]">{title}</h3>
      </div>
      <p className="text-sm text-[#666]">{desc}</p>
    </motion.div>
  );
}

/* Features Grid */
function FeaturesGrid() {
  const features = [
    { Icon: FiBarChart2, title: "Live candlestick charts", desc: "Real-time OHLCV data with 9 chart types and all major technical indicators." },
    { Icon: FiDollarSign, title: "₹1L virtual funds", desc: "Start with one lakh rupees in virtual money. No deposits. No risk." },
    { Icon: FiBell, title: "Smart price alerts", desc: "Get notified by email when your target price is hit. Never miss a move." },
    { Icon: FiBriefcase, title: "Portfolio tracker", desc: "Track your holdings, P&L, and XIRR returns across stocks and mutual funds." },
    { Icon: FiShield, title: "Paper trading", desc: "Practice F&O and intraday strategies without risking real capital." },
    { Icon: FiTrendingUp, title: "Mutual funds", desc: "Explore and invest in 5,000+ direct mutual fund schemes with live NAV." },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center mb-12">
        <h2 className="font-inter font-bold text-3xl text-[#1A1A2E]">Everything you need to trade like a pro</h2>
        <p className="text-lg text-[#666] mt-2">Built for beginners and seasoned traders alike.</p>
      </div>
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <FeatureCard key={i} Icon={f.Icon} title={f.title} desc={f.desc} />
        ))}
      </div>
    </section>
  );
}

/* How It Works */
function HowItWorks() {
  const steps = [
    { num: 1, title: "Create your account", desc: "Sign up with email and verify with OTP in under 60 seconds." },
    { num: 2, title: "Get ₹1L virtual funds", desc: "Your account is instantly credited with virtual trading capital." },
    { num: 3, title: "Start trading", desc: "Search stocks, view live charts, place orders, and track your portfolio." },
  ];
  return (
    <section className="bg-[#FAFAFA] py-20">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-inter font-bold text-3xl text-[#1A1A2E]">Start trading in 3 simple steps</h2>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-center items-stretch gap-8 px-4">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center text-center relative">
            <div className="w-10 h-10 rounded-full bg-[#00D09C] flex items-center justify-center text-white font-bold mb-2">{s.num}</div>
            <h3 className="text-xl font-semibold text-[#1A1A2E] mb-1">{s.title}</h3>
            <p className="text-sm text-[#666]">{s.desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute right-0 top-5 w-1/2 border-t-2 border-dashed border-[#00D09C]" style={{ marginLeft: "50%" }} />
            )}
          </div>
        ))}
      </div>
      {/* Mini dashboard mockup */}
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-[#1A1A2E] text-white rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="block text-sm opacity-80">RELIANCE</span>
            <span className="block text-xl font-bold">₹2,847.30 <span className="text-[#00D09C]">+1.2%</span></span>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="w-24 h-4 bg-green-500 rounded" />
            <button className="bg-[#00D09C] text-white px-4 py-1 rounded-full">Buy</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Testimonials */
function Testimonials() {
  const testimonials = [
    { quote: "TradeSphere helped me understand the market before I invested real money.", name: "Priya Sharma", location: "Mumbai" },
    { quote: "The charts are as good as any paid platform. I use it daily for practice.", name: "Rahul Verma", location: "Bangalore" },
    { quote: "Finally a platform that makes F&O practice accessible to beginners.", name: "Ankit Joshi", location: "Delhi" },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="font-inter font-bold text-3xl text-[#1A1A2E]">What our traders say</h2>
      </div>
      <div className="max-w-6xl mx-auto px-4 overflow-x-auto flex gap-6 snap-x snap-mandatory">
        {testimonials.map((t, i) => (
          <div key={i} className="min-w-[280px] bg-white border border-[#EDEDED] rounded-xl p-6 snap-center flex-shrink-0">
            <p className="text-[#444] mb-4">“{t.quote}”</p>
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 flex items-center justify-center bg-[#E8FBF5] rounded-full text-[#00A878] font-bold">
                {t.name.split(' ')[0][0]}{t.name.split(' ')[1][0]}
              </div>
              <div>
                <p className="font-semibold text-[#1A1A2E]">{t.name}</p>
                <p className="text-sm text-gray-500">{t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Final CTA & Footer */
function FinalCTAAndFooter() {
  return (
    <>
      {/* CTA Banner */}
      <section className="bg-[#00D09C] text-white py-16 text-center">
        <motion.h2 className="text-4xl font-bold mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          Ready to trade smarter?
        </motion.h2>
        <p className="text-lg mb-6 opacity-90">Join 2 lakh+ virtual traders. Free forever.</p>
        <Link to="/signup" className="bg-white text-[#00A878] font-bold py-3 px-8 rounded-full hover:scale-105 transform transition">
          Get started for free
        </Link>
      </section>
      {/* Footer */}
      <footer className="bg-[#1A1A2E] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00D09C] to-[#00A878]" />
              <span className="font-semibold">TradeSphere</span>
            </div>
            <p className="text-sm opacity-70">Practice. Learn. Grow.</p>
            <p className="text-xs opacity-50 mt-2">© 2025 TradeSphere</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Products</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/markets" className="link-accent">Stocks</Link></li>
              <li><Link to="/funds" className="link-accent">Mutual Funds</Link></li>
              <li><Link to="/fno" className="link-accent">F&amp;O</Link></li>
              <li><Link to="/tools/sip-calculator" className="link-accent">SIP Calculator</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Company</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/about" className="link-accent">About</Link></li>
              <li><Link to="/blog" className="link-accent">Blog</Link></li>
              <li><Link to="/careers" className="link-accent">Careers</Link></li>
              <li><Link to="/contact" className="link-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Legal</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/privacy" className="link-accent">Privacy Policy</Link></li>
              <li><Link to="/terms" className="link-accent">Terms of Use</Link></li>
              <li><Link to="/disclaimer" className="link-accent">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-4 text-center">
          <div className="flex justify-center space-x-4 mb-2">
            <a href="#" className="text-white/60 hover:text-white"><i className="ti ti-brand-twitter" /></a>
            <a href="#" className="text-white/60 hover:text-white"><i className="ti ti-brand-linkedin" /></a>
            <a href="#" className="text-white/60 hover:text-white"><i className="ti ti-brand-instagram" /></a>
          </div>
          <p className="text-xs opacity-50">© 2025 TradeSphere. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <MarketTicker />
      <HeroSection />
      <StatsBanner />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <FinalCTAAndFooter />
    </>
  );
}
