import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CalendlyButton from "@/components/CalendlyButton";

const StickyBottomCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.1)]">
      <div className="container flex items-center justify-between h-16 gap-4">
        <div className="hidden sm:block min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Ready to validate your PMF?</p>
          <p className="text-xs text-muted-foreground">Join 150+ founders</p>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/test"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-5 py-2.5 text-sm font-semibold hover:brightness-95 transition-all">Start Test  PMF Demo

            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="hidden md:block">
            <CalendlyButton variant="outline" className="px-4 py-2.5 text-sm">
              Book Call
            </CalendlyButton>
          </div>
        </div>
      </div>
    </div>);

};

export default StickyBottomCTA;