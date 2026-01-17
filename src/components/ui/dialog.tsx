import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  containerClassName?: string;
}

const isBrowser = typeof document !== "undefined";

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
  containerClassName
}) => {
  const handleClose = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  React.useEffect(() => {
    if (!open || !isBrowser) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const dialogMarkup = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />
      <div
        className={cn(
          "relative z-[121] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/40 bg-white/95 text-slate-900 shadow-2xl",
          "dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-white",
          containerClassName
        )}
      >
        {children}
        <button
          className="absolute top-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-400 shadow-sm transition-colors hover:bg-white hover:text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return isBrowser ? createPortal(dialogMarkup, document.body) : dialogMarkup;
};

export const DialogContent = ({ children, className = "" }: any) => (
  <div className={cn("p-8 pr-14", className)}>{children}</div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="mb-8">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{children}</h2>
);

export const DialogDescription = ({ children }: any) => (
  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{children}</p>
);

export const DialogFooter = ({ children }: any) => (
  <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">{children}</div>
);
