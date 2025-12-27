import React from 'react';
import Image from 'next/image';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Company Logo"
        width={150}
        height={30}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
