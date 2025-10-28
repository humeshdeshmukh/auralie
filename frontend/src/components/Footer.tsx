'use client';

import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook, Heart } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
    { name: 'Privacy', href: '#privacy' },
    { name: 'Terms', href: '#terms' }
  ];

  const socialLinks = [
    { name: 'Instagram', href: '#', icon: <Instagram className="w-5 h-5" /> },
    { name: 'Twitter', href: '#', icon: <Twitter className="w-5 h-5" /> },
    { name: 'Facebook', href: '#', icon: <Facebook className="w-5 h-5" /> }
  ];

  return (
    <footer className="bg-background-light border-t border-gray-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-text-primary">Auralie</span>
            </div>
            <p className="text-text-secondary text-sm">
              Empowering women to take control of their health journey with confidence and clarity.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-text-secondary hover:text-primary transition-colors duration-200"
                  whileHover={{ y: -2 }}
                  aria-label={item.name}
                >
                  {item.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {links.slice(0, 4).map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-text-secondary hover:text-primary text-sm transition-colors duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              {links.slice(4).map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-text-secondary hover:text-primary text-sm transition-colors duration-200">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Stay Updated</h3>
            <div className="space-y-3">
              <p className="text-text-secondary text-sm">Subscribe to our newsletter for the latest updates.</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-r-lg text-sm font-medium transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-text-secondary text-sm">
              &copy; {currentYear} Auralie. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-text-secondary hover:text-primary text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="#" className="text-text-secondary hover:text-primary text-sm transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
