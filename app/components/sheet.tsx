"use client";

import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

/* ===========================
   Shared Types
=========================== */

type ClickableChild = React.ReactElement<{
  onClick?: React.MouseEventHandler<any>;
}>;

/* ===========================
   Context
=========================== */

interface SheetContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType | undefined>(
  undefined
);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet");
  }
  return context;
}

/* ===========================
   Sheet Root
=========================== */

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <SheetContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

/* ===========================
   Sheet Trigger
=========================== */

interface SheetTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ClickableChild;
}

export function SheetTrigger({
  children,
  asChild,
  ...props
}: SheetTriggerProps) {
  const { onOpenChange } = useSheet();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(true);
        children.props.onClick?.(e);
      },
    });
  }

  return (
    <button {...props} onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

/* ===========================
   Portal
=========================== */

interface SheetPortalProps {
  children: React.ReactNode;
}

export function SheetPortal({ children }: SheetPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

/* ===========================
   Overlay
=========================== */

interface SheetOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SheetOverlay = React.forwardRef<HTMLDivElement, SheetOverlayProps>(
  ({ className = "", style, ...props }, ref) => {
    const { open, onOpenChange } = useSheet();
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
      } else {
        const timer = setTimeout(() => setIsVisible(false), 300);
        return () => clearTimeout(timer);
      }
    }, [open]);

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={`fixed inset-0 z-50 bg-black/80 ${className}`}
        style={{
          opacity: open ? 1 : 0,
          transition: "opacity 300ms ease-in-out",
          ...style,
        }}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);
SheetOverlay.displayName = "SheetOverlay";

/* ===========================
   Content
=========================== */

type SheetSide = "top" | "right" | "bottom" | "left";

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className = "", style, children, ...props }, ref) => {
    const { open, onOpenChange } = useSheet();
    const [isVisible, setIsVisible] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
        document.body.style.overflow = "hidden";
      } else {
        const timer = setTimeout(() => {
          setIsVisible(false);
          document.body.style.overflow = "";
        }, 300);
        return () => {
          clearTimeout(timer);
          document.body.style.overflow = "";
        };
      }
    }, [open]);

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          onOpenChange(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onOpenChange]);

    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    if (!isVisible) return null;

    const effectiveSide = side === "bottom" && !isMobile ? "right" : side;

    const sideStyles: Record<SheetSide, React.CSSProperties> = {
      right: {
        top: 0,
        right: 0,
        height: "100vh",
        minWidth: "400px",
        maxWidth: "90vw",
        transform: open ? "translateX(0)" : "translateX(100%)",
      },
      left: {
        top: 0,
        left: 0,
        height: "100vh",
        minWidth: "400px",
        maxWidth: "90vw",
        transform: open ? "translateX(0)" : "translateX(-100%)",
      },
      top: {
        top: 0,
        left: 0,
        right: 0,
        maxHeight: "85vh",
        transform: open ? "translateY(0)" : "translateY(-100%)",
      },
      bottom: {
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "85vh",
        transform: open ? "translateY(0)" : "translateY(100%)",
      },
    };

    const borderStyles: Record<SheetSide, string> = {
      right: "border-l border-zinc-800",
      left: "border-r border-zinc-800",
      top: "border-b border-zinc-800",
      bottom: "border-t border-zinc-800",
    };

    return (
      <SheetPortal>
        <SheetOverlay />
        <div
          ref={ref}
          className={`fixed z-50 gap-4 bg-white p-6 shadow-lg dark:bg-zinc-900 overflow-y-auto ${borderStyles[effectiveSide]} ${className}`}
          style={{
            ...sideStyles[effectiveSide],
            transition: "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)",
            ...style,
          }}
          {...props}
        >
          {children}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = "SheetContent";

/* ===========================
   Layout Helpers
=========================== */

export function SheetHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}
      {...props}
    />
  );
}

export function SheetFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
      {...props}
    />
  );
}

export const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold text-zinc-950 dark:text-zinc-50 ${className}`}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-zinc-500 dark:text-zinc-400 ${className}`}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

/* ===========================
   Sheet Close
=========================== */

interface SheetCloseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ClickableChild;
}

export function SheetClose({ children, asChild, ...props }: SheetCloseProps) {
  const { onOpenChange } = useSheet();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(false);
        children.props.onClick?.(e);
      },
    });
  }

  return (
    <button {...props} onClick={() => onOpenChange(false)}>
      {children}
    </button>
  );
}
SheetClose.displayName = "SheetClose";
