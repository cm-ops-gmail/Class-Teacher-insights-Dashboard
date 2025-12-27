import React from "react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <svg
        width="150"
        height="30"
        viewBox="0 0 150 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <rect width="30" height="30" rx="8" fill="currentColor" />
        <path
          d="M11 9H15V21H11V9Z"
          fill="hsl(var(--primary-foreground))"
        />
        <path
          d="M17 9H21V21H17V9Z"
          fill="hsl(var(--primary-foreground))"
        />
        <text
          x="40"
          y="22"
          fontFamily="Inter, sans-serif"
          fontSize="20"
          fontWeight="bold"
          fill="hsl(var(--foreground))"
        >
          ANALYSIS
        </text>
      </svg>
    </div>
  );
};

export default Logo;
