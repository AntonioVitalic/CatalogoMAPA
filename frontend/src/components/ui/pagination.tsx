import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

// ----------------------------------------------------------------
// Reemplazamos PaginationLink por un PaginationButton que renderiza <button>
// ----------------------------------------------------------------
interface PaginationButtonProps
  extends Pick<ButtonProps, "size" | "variant">,
          React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

const PaginationButton = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ children, className, size = "default", variant = "default", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size }),
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:opacity-90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
PaginationButton.displayName = "PaginationButton"

// Wrappers para Previous, Next y los demás:
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props}/>
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props}/>
  )
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props}/>,
)
PaginationItem.displayName = "PaginationItem"

// El “…” intermedio (elipsis)
const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Más páginas</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Previous y Next pasarán un disabled y heredarán el estilo “default”
const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof PaginationButton>
>(({ className, ...props }, ref) => (
  <PaginationButton
    ref={ref}
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationButton>
))
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof PaginationButton>
>(({ className, ...props }, ref) => (
  <PaginationButton
    ref={ref}
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
))
PaginationNext.displayName = "PaginationNext"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
}
