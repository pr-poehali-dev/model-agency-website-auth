import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.7)] hover:brightness-110",
        destructive:
          "bg-gradient-to-br from-destructive to-red-600 text-destructive-foreground shadow-[0_4px_20px_-4px_hsl(var(--destructive)/0.5)] hover:shadow-[0_8px_32px_-4px_hsl(var(--destructive)/0.7)] hover:brightness-110",
        outline:
          "glass border-white/15 text-foreground hover:border-primary/50 hover:text-primary hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]",
        secondary:
          "bg-secondary/60 backdrop-blur-md border border-white/10 text-secondary-foreground hover:bg-secondary/80 hover:border-white/20",
        ghost:
          "hover:bg-white/5 hover:backdrop-blur-md hover:text-accent",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }