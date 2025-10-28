'use client';

import { useState } from 'react';

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'About', href: '#about', icon: null },
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
    { name: 'Community', href: '#community', icon: null }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Auralie</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <a
                    href={item.href}
                    className="flex items-center px-4 py-3 text-text-secondary hover:text-primary transition-all duration-200 font-medium text-sm tracking-wide rounded-lg hover:bg-background-secondary/50"
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.name}
                    {item.dropdown && (
                      <svg 
                        className="ml-2 w-4 h-4 transition-transform group-hover:rotate-180" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
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

            {/* CTA Section */}
            <div className="flex items-center space-x-4">
              <button className="hidden sm:flex items-center bg-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 hover:shadow-button-hover transition-all duration-200 transform hover:-translate-y-0.5">
                Get Started
                <svg 
                  className="ml-2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

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
                    onClick={() => setIsMobileMenuOpen(false)}
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
              <div className="pt-3 mt-2">
                <button 
                  className="w-full flex items-center justify-center bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 hover:shadow-button-hover transition-all duration-200 transform hover:-translate-y-0.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
