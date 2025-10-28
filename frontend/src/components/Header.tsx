'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    
    {
      name: 'Cycles',
      href: '#cycles',
      icon: null,
      dropdown: ['Predict Cycles', 'Cycle History', 'Patterns']
    },
    {
      name: 'Track',
      href: '#track',
      icon: null,
      dropdown: ['Track Symptoms', 'Daily Logs', 'Health Metrics']
    },
    {
      name: 'Chances',
      href: '#chances',
      icon: null,
      dropdown: ['Fertility Window', 'Ovulation', 'Conception']
    },
    { name: 'Knowledge', href: '#knowledge', icon: null },
    { name: 'Community', href: '#community', icon: null },
    { 
      name: 'About', 
      href: '#about', 
      icon: null,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Auralie</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <a
                    href={item.href}
                    className="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-background-secondary/30 transition-colors duration-200 flex items-center"
                    onClick={(e) => {
                      if (item.onClick) {
                        item.onClick(e);
                      } else if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const section = document.getElementById(item.href.substring(1));
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                  >
                    {item.name}
                    {item.dropdown && (
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </a>

                  {/* Enhanced Dropdown */}
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100">
                      <div className="px-3 mb-1">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
                      </div>
                      {item.dropdown.map((dropdownItem) => (
                        <a
                          key={dropdownItem}
                          href={`${item.href}/${dropdownItem.toLowerCase().replace(' ', '-')}`}
                          className="flex items-center px-6 py-2.5 text-sm text-text-secondary hover:bg-primary/5 hover:text-primary transition-all duration-200"
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          {dropdownItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {!loading && (
                user ? (
                  <div className="hidden md:flex items-center space-x-4">
                    <Link 
                      href="/dashboard"
                      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center space-x-3">
                    <Link 
                      href="/login"
                      className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )
              )}
              
              {/* Mobile auth buttons */}
              <div className="md:hidden">
                {!loading && user && (
                  <Link 
                    href="/dashboard"
                    className="text-text-secondary hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-background-secondary/50 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="px-4 pt-2 pb-4 space-y-1 bg-white border-t border-gray-100 shadow-inner">
              {navItems.map((item) => (
                <div key={item.name} className="border-b border-gray-50 last:border-0">
                  <a
                    href={item.href}
                    className="block px-4 py-3 text-base font-medium text-text-primary hover:text-primary hover:bg-background-secondary/30 rounded-lg transition-colors duration-200"
                    onClick={(e) => {
                      if (item.onClick) {
                        item.onClick(e);
                      } else if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const section = document.getElementById(item.href.substring(1));
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {item.name}
                      {item.dropdown && (
                        <svg 
                          className={`w-4 h-4 transform transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === item.name ? null : item.name);
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </a>
                  {item.dropdown && activeDropdown === item.name && (
                    <div className="pl-6 py-1 space-y-1 bg-white/50">
                      {item.dropdown.map((dropdownItem) => (
                        <a
                          key={dropdownItem}
                          href={`${item.href}/${dropdownItem.toLowerCase().replace(' ', '-')}`}
                          className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-colors duration-200"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setActiveDropdown(null);
                          }}
                        >
                          {dropdownItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 mt-2 space-y-2">
                {!loading && !user ? (
                  <>
                    <Link 
                      href="/login"
                      className="block w-full text-center bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-button-hover transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      className="block w-full text-center border border-primary text-primary bg-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Create Account
                    </Link>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-center text-red-600 hover:bg-red-50 px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
