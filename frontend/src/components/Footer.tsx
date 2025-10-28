import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const links = [
    { name: 'Privacy', href: '#privacy' },
    { name: 'Terms', href: '#terms' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { name: 'Instagram', href: '#', icon: '📷' },
    { name: 'Twitter', href: '#', icon: '🐦' },
    { name: 'Facebook', href: '#', icon: '📘' }
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-text-primary font-medium">Auralie</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-4 md:mb-0">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-text-secondary hover:text-primary text-sm transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="text-text-secondary hover:text-primary transition-colors"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100 text-center md:text-left">
          <p className="text-xs text-text-secondary">
            &copy; {currentYear} Auralie. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
