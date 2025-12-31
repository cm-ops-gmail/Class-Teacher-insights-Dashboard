import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
        <div>© 2025 10 MS Content Operations. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="transition-colors hover:text-foreground">
            Policy Book
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Automation Projects
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Automation Project Documentation
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
