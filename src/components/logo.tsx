import { FileSpreadsheet } from "lucide-react";
import React from "react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <FileSpreadsheet className="h-6 w-6" />
      <span className="font-headline">Run Sheet Data Visualization</span>
    </div>
  );
};

export default Logo;
