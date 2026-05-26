import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 text-sm ring-offset-background transition-all duration-200 placeholder:text-muted-foreground/70 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:border-primary/60 focus-visible:bg-white/[0.08] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15),0_4px_24px_-4px_hsl(var(--primary)/0.3)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }