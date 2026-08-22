import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-primary/55 bg-primary text-primary-foreground shadow-[0_8px_24px_-18px_currentColor] hover:border-primary/75 hover:bg-primary/92 hover:shadow-[0_10px_28px_-20px_currentColor]",
        destructive: "border border-destructive/55 bg-destructive/90 text-destructive-foreground shadow-none hover:bg-destructive",
        outline: "border border-border/85 bg-background/25 text-foreground shadow-none hover:border-primary/35 hover:bg-primary/[0.045] hover:text-foreground",
        secondary: "border border-border/65 bg-secondary/70 text-secondary-foreground shadow-none hover:border-primary/25 hover:bg-secondary/90",
        ghost: "border border-transparent bg-transparent shadow-none hover:border-border/65 hover:bg-white/[0.045] hover:text-foreground",
        link: "border-0 bg-transparent p-0 text-primary underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
