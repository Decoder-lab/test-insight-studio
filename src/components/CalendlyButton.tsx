import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

const CALENDLY_URL = "https://calendly.com/neuroinsight-labs/pmf-consultation";

interface CalendlyButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  children?: React.ReactNode;
}

const CalendlyButton = ({ className, variant = "outline", children }: CalendlyButtonProps) => {
  const handleClick = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    } else {
      window.open(CALENDLY_URL, "_blank", "noopener");
    }

    // Analytics tracking
    window.addEventListener("message", (e) => {
      if (e.origin === "https://calendly.com" && e.data?.event === "calendly.event_scheduled") {
        console.log("Consultation Booked", { source: "calendly", uri: e.data.payload?.event?.uri });
      }
    }, { once: true });
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={cn("rounded-full gap-2", className)}
      aria-label="Book a free consultation"
    >
      <Calendar className="w-4 h-4" />
      {children || "Book Free Consultation"}
    </Button>
  );
};

export default CalendlyButton;
