import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-muted-foreground">
        <div>© 2025 10 MS Content Operations. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="https://content-ops-project-and-ticket-management-system.vercel.app/" className="transition-colors hover:text-foreground">
            Requisition & Project Management Dashboard
          </a>
          <a href="https://10ms-content-operations-projects-teal.vercel.app/" className="transition-colors hover:text-foreground">
            Automation Projects
          </a>
          <a href="https://meadow-lock-db7.notion.site/262f4f581e0d806796c1f9aa8fa0d6c9?v=262f4f581e0d809fbf2d000cfed8444c" className="transition-colors hover:text-foreground">
            Automation Project Documentation
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
