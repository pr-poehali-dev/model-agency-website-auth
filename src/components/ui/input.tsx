import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-base ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-white/[0.08] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15),0_4px_24px_-4px_hsl(var(--primary)/0.3)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }