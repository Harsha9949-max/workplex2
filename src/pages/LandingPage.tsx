/**
 * LandingPage Component
 * Premium landing page for WorkPlex with glassmorphism design
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Shield,
  TrendingUp,
  Trophy,
  Award,
  Star,
  Menu,
  X,
  ChevronDown,
  CreditCard,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Ventures', 'Tasks', 'Wallet', 'Leaderboard'];

  const ventures = ['BUYRIX', 'VYUMA', 'TRENDYVERSE', 'GROWPLEX'];

  const features = [
    {
      icon: CheckCircle2,
      title: 'Choose Your Role',
      description: 'Select from Creator, Promoter, Reseller, or Support Agent roles',
      color: 'from-amber-400/20 to-amber-600/5',
    },
    {
      icon: Shield,
      title: 'Submit Proof',
      description: 'Simple proof submission with instant verification system',
      color: 'from-teal-400/20 to-teal-600/5',
    },
    {
      icon: CreditCard,
      title: 'Instant Joining Bonus',
      description: 'Get Rs.27 guaranteed bonus upon joining - up to Rs.500 total',
      color: 'from-purple-400/20 to-purple-600/5',
    },
  ];

  const gamificationCards = [
    {
      icon: Star,
      title: 'Weekly Streaks',
      description: 'Maintain daily activity streaks for bonus multipliers',
      bgGradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
      borderColor: 'border-orange-500/20',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
    {
      icon: Trophy,
      title: 'Leaderboard Rank',
      description: 'Compete with top performers and climb the ranks',
      bgGradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-teal-500/20',
      iconBg: 'bg-teal-500/20',
      iconColor: 'text-teal-400',
    },
    {
      icon: Award,
      title: 'Badge Economy',
      description: 'Earn exclusive badges and unlock premium perks',
      bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-500/20',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ];

  const scrollReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.1 },
    }),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative">
      {/* Glow Orbs Background - Obsidian Foundry Edition */}
      <div className="fixed inset-0 pointer-events-none opacity-60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00C9A7]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E8B84B]/5 rounded-full blur-[120px]" />
        
        {/* Subtle Ambient Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(229,226,225,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(229,226,225,0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />

        {/* Grain Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-white/[0.03]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap size={28} className="text-amber-400" fill="url(#goldGradient)" />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E8B84B" />
                      <stop offset="100%" stopColor="#F5C95C" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span
                className="text-xl font-bold tracking-wider font-display"
              >
                WORKPLEX
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="relative px-6 py-2.5 rounded-xl text-sm font-semibold text-black overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />
                <span className="relative flex items-center gap-2">
                  Start Earning
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden"
              >
                <div className="pt-4 pb-6 space-y-4 border-t border-white/[0.03] mt-4">
                  {navLinks.map((link) => (
                    <a
                      key={link}
                      href={`#${link.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm text-gray-400 hover:text-white transition-colors py-2"
                    >
                      {link}
                    </a>
                  ))}
                  <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.03]">
                    <button
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600"
                    >
                      Start Earning
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Floating Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/[0.03] border border-white/[0.06]"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={14} className="text-amber-400" />
            </motion.div>
            <span className="text-xs font-medium text-gray-400">
              Powered by <span className="text-white font-semibold">HVRS Innovations</span>
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-8xl font-bold uppercase mb-6 font-display"
            style={{ lineHeight: 1.1, letterSpacing: '0.01em', overflow: 'visible' }}
          >
            <span className="text-white">Work From Home</span>
            <br />
            <span
              className="inline-block bg-gradient-to-r from-amber-400 via-amber-500 to-teal-400 bg-clip-text text-transparent pb-2"
            >
              Earn Daily
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            India's most advanced commission-based gig network. Join thousands of earners building their future.
          </motion.p>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/auth')}
              className="group relative px-8 py-4 rounded-2xl text-base font-bold text-black overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />
              <span className="relative flex items-center gap-2">
                Start Your Journey
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </span>
            </button>
            <button
              onClick={() => {
                document.getElementById('ventures')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-2xl text-base font-semibold text-white border border-white/10 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all"
            >
              Explore Ventures
            </button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2 text-gray-500"
            >
              <span className="text-xs">Scroll to explore</span>
              <ChevronDown size={16} />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Venture Ecosystem */}
      <section id="ventures" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={scrollReveal}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold uppercase mb-4 font-display"
              style={{ lineHeight: 1.1, letterSpacing: '0.01em' }}
            >
              Our Venture Ecosystem
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Trusted brands powering the gig economy across India
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {ventures.map((venture, index) => (
              <motion.div
                key={venture}
                custom={index + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollReveal}
                whileHover={{ scale: 1.05, borderColor: 'rgba(232,184,75,0.3)' }}
                className="px-8 py-4 rounded-2xl border border-white/[0.03] bg-white/[0.02] cursor-pointer transition-all"
              >
                <span
                  className="text-xl md:text-2xl font-bold text-gray-500 hover:text-amber-400 transition-colors tracking-wider font-display"
                >
                  {venture}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={scrollReveal}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl md:text-5xl font-bold uppercase mb-4 font-display"
              style={{ lineHeight: 1.1, letterSpacing: '0.01em' }}
            >
              Simple Tasks. <span className="inline-block text-amber-400">Real Earnings.</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Features List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  custom={index + 1}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scrollReveal}
                  whileHover={{ x: 8 }}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:border-amber-400/20 transition-all"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <feature.icon size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: Mockup Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/[0.06] p-8 relative overflow-hidden">
                {/* Mockup Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Submit Proof</div>
                      <div className="text-xs text-gray-500">Task #1247</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 bg-white/[0.06] rounded-full w-3/4" />
                    <div className="h-3 bg-white/[0.06] rounded-full w-1/2" />
                    <div className="h-3 bg-white/[0.06] rounded-full w-5/6" />
                  </div>

                  <div className="pt-4">
                    <div className="px-4 py-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-center">
                      <span className="text-amber-400 font-bold text-lg">₹150</span>
                      <span className="text-gray-500 text-sm ml-2">earned</span>
                    </div>
                  </div>

                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-black font-bold text-sm">
                    Verify & Claim
                  </button>
                </div>
              </div>

              {/* Floating Bonus Badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-400/20"
              >
                <div className="text-black font-bold text-sm">Joining Bonus</div>
                <div className="text-black/70 text-xs">Up to ₹500</div>
              </motion.div>

              {/* Disclaimer */}
              <div className="mt-4 text-center">
                <span className="text-xs text-gray-500">₹27 guaranteed on signup</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gamification Engine */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={scrollReveal}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl md:text-5xl font-bold uppercase mb-4 font-display"
              style={{ lineHeight: 1.1, letterSpacing: '0.01em' }}
            >
              Climb the <span className="inline-block text-teal-400">Leaderboard</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Gamified rewards system that keeps you motivated
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {gamificationCards.map((card, index) => (
              <motion.div
                key={card.title}
                custom={index + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scrollReveal}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative p-8 rounded-3xl bg-gradient-to-b ${card.bgGradient} border ${card.borderColor} cursor-pointer transition-all`}
              >
                <div className={`${card.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  <card.icon size={28} className={card.iconColor} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-400">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-12 md:p-16 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-center overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block mb-6"
              >
                <Zap size={48} className="text-amber-400 mx-auto" fill="url(#goldGradient2)" />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E8B84B" />
                      <stop offset="100%" stopColor="#00C9A7" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              <h2
                className="text-4xl md:text-6xl font-bold uppercase mb-6 font-display"
                style={{ lineHeight: 1.1, letterSpacing: '0.01em' }}
              >
                Start Earning{' '}
                <span className="inline-block bg-gradient-to-r from-amber-400 to-teal-400 bg-clip-text text-transparent pb-2">
                  TONIGHT
                </span>
              </h2>

              <p className="text-gray-400 max-w-lg mx-auto mb-10">
                Join thousands of verified earners. Get your joining bonus instantly and start your journey today.
              </p>

              <button
                onClick={() => navigate('/auth')}
                className="group relative px-10 py-5 rounded-2xl text-lg font-bold text-black overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600" />
                <span className="relative flex items-center gap-3">
                  Get Started Now
                  <ArrowRight
                    size={24}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </button>

              {/* Credibility Badge */}
              <div className="mt-10 flex items-center justify-center gap-2 text-gray-500">
                <Shield size={16} />
                <span className="text-sm">100% Secure Payments via Razorpay</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-amber-400" />
            <span className="text-sm font-semibold tracking-wider font-display">
              WORKPLEX
            </span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 HVRS Innovations Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
