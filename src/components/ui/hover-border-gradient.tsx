import React from "react";
import { cn } from "../../lib/utils";

interface HoverBorderGradientProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  as?: React.ElementType;
  duration?: number;
}

export const HoverBorderGradient: React.FC<HoverBorderGradientProps> = ({
  children,
  containerClassName,
  className,
  as: Component = "button",
  duration = 1,
  ...otherProps
}) => {
  return (
    <Component
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-4 py-2 text-black dark:text-white transition duration-300 hover:shadow-lg",
        "before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-violet-500 before:via-blue-500 before:to-violet-500 before:bg-[length:200%_200%] before:animate-[gradient_4s_ease-in-out_infinite] before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        "after:absolute after:inset-[1px] after:rounded-md after:bg-white dark:after:bg-black after:transition-colors after:duration-300",
        containerClassName
      )}
      style={{
        "--duration": duration,
      } as React.CSSProperties}
      {...otherProps}
    >
      <div className={cn("relative z-10 flex items-center", className)}>
        {children}
      </div>
    </Component>
  );
};

// Add the keyframe animation to your global CSS
export const borderGradientStyles = `
@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
`;
