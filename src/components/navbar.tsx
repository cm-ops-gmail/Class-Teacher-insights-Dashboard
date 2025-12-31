
'use client';

import React from 'react';
import Logo from './logo';
import { Button } from './ui/button';
import Link from 'next/link';
import { Home, User, AppWindow, Combine } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useYear } from '@/contexts/year-context';

interface NavbarProps {
    children?: React.ReactNode;
}

const Navbar = ({ children }: NavbarProps) => {
  const { selectedYear, setSelectedYear } = useYear();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/central-dashboard" passHref>
             <Logo />
          </Link>
          <Tabs value={selectedYear} onValueChange={(value) => setSelectedYear(value as '2025' | '2026')}>
            <TabsList>
              <TabsTrigger value="2025">2025</TabsTrigger>
              <TabsTrigger value="2026">2026</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
           <Link href="/central-dashboard" passHref>
             <Button variant="ghost">
                <Combine className="mr-2 h-4 w-4" />
                Central Dashboard
             </Button>
           </Link>
           <Link href="/" passHref>
             <Button variant="ghost">
                <Home className="mr-2 h-4 w-4" />
                FB Dashboard
             </Button>
           </Link>
           <Link href="/app-dashboard" passHref>
             <Button variant="ghost">
                <AppWindow className="mr-2 h-4 w-4" />
                APP Dashboard
             </Button>
           </Link>
           <Link href="/teacher-profile" passHref>
             <Button variant="ghost">
                <User className="mr-2 h-4 w-4" />
                Teacher Profile
             </Button>
           </Link>
          {children}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
