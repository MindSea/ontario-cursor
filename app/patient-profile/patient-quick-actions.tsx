"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Phone, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PatientQuickActions({
  patientName,
  onOpenProfile,
  className,
}: {
  patientName: string;
  onOpenProfile?: () => void;
  className?: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const showDemoToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      <div className={cn("flex shrink-0 items-center gap-1", className)}>
        {onOpenProfile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 bg-transparent hover:bg-muted"
            aria-label={`Open profile for ${patientName}`}
            onClick={onOpenProfile}
          >
            <UserCircle className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 bg-transparent hover:bg-muted"
          aria-label={`Call patient ${patientName}`}
          onClick={() =>
            showDemoToast(`Calling ${patientName} (demo).`)
          }
        >
          <Phone className="size-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 bg-transparent hover:bg-muted"
          aria-label={`Message patient ${patientName}`}
          onClick={() =>
            showDemoToast(`Message to ${patientName} (demo).`)
          }
        >
          <MessageSquare className="size-4" aria-hidden />
        </Button>
      </div>
      {toast ? (
        <span className="sr-only" role="status" aria-live="polite">
          {toast}
        </span>
      ) : null}
    </>
  );
}
