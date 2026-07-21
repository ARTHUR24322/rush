'use client';

import { useState, useEffect } from 'react';
import { Vault, Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { href: '#features',    label: 'À quoi ça sert' },
  { href: '#how-it-works', label: 'Comment ça marche' },
  { href: '#get-started', label: 'Par où commencer' },
  { href: '#install',     label: 'Installation' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight active section on scroll
  useEffect(() => {
    const ids = navLinks.map(l => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-rush-gradient flex items-center justify-center shadow-glow transition-transform group-hover:scale-110">
                <Vault className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">RushVault</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <button
                  key={href}
                  onClick={() => handleClick(href)}
                  className={`nav-link text-sm font-medium transition-all duration-200 ${
                    active === href.slice(1)
                      ? 'text-rush-400 bg-rush-500/10 border border-rush-500/20'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-zinc-600 font-mono">v0.1.0</span>
              <a href="#install" onClick={(e) => { e.preventDefault(); handleClick('#install'); }} className="btn-primary text-sm px-5">
                Installer →
              </a>
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-6 pb-4 pt-2 border-t border-white/5 bg-black/90 backdrop-blur-xl space-y-1">
            {navLinks.map(({ href, label }) => (
              <button
                key={href}
                onClick={() => handleClick(href)}
                className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active === href.slice(1)
                    ? 'text-rush-400 bg-rush-500/10 border border-rush-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {label}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
            <div className="pt-2 border-t border-white/5">
              <button
                onClick={() => handleClick('#install')}
                className="btn-primary w-full text-sm"
              >
                Installer maintenant
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer pour compenser le header fixed */}
      <div className="h-16" />
    </>
  );
}
