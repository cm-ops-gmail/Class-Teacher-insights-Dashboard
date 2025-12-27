import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from './logo';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
