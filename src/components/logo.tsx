import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <Image src="/logo.png" alt="Logo" width={150} height={30} />
    </div>
  );
};

export default Logo;
