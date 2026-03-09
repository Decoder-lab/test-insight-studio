import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-20 pb-16 bg-background relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`
      }} />

      <div className="container relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-accent-foreground">PMF Testing Platform</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Test Your Landing Page
            <br />
            <span className="bg-accent text-primary">PMF in 3 Minutes</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Get <strong className="text-foreground">NeuroScore</strong> + emotional timeline + actionable fixes.
            <br className="hidden sm:block" />
            Know exactly what users feel when they see your page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/test"
              className="inline-flex items-center gap-3 bg-accent text-accent-foreground rounded-full px-8 py-4 font-semibold text-base hover:brightness-95 transition-all shadow-lg shadow-accent/20">
              
              Test My Landing Page — €49
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#sample-results"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              
              <Play className="w-4 h-4" />
              See sample results
            </a>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative">
          
          <div className="bg-surface-dark rounded-2xl border border-border/30 p-6 sm:p-8 shadow-2xl">
            {/* Mock dashboard header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-accent/40" />
              <div className="w-3 h-3 rounded-full bg-accent/80" />
              <span className="ml-3 text-xs text-surface-dark-muted font-mono">decoder.app/results/demo</span>
            </div>

            <div className="grid md:grid-cols-[1fr_2fr] gap-6">
              {/* Score card */}
              <div className="bg-background/5 border border-border/10 rounded-xl p-6">
                <p className="text-xs text-surface-dark-muted mb-2 uppercase tracking-wider">NeuroScore</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold text-accent">67</span>
                  <span className="text-surface-dark-muted text-lg">/100</span>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                  { label: "Engagement", value: "72%" },
                  { label: "Clarity", value: "58%" },
                  { label: "Trust", value: "71%" }].
                  map((m) =>
                  <div key={m.label} className="flex justify-between text-xs">
                      <span className="text-surface-dark-muted">{m.label}</span>
                      <span className="text-surface-dark-foreground font-medium">{m.value}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mini timeline */}
              <div className="bg-background/5 border border-border/10 rounded-xl p-6">
                <p className="text-xs text-surface-dark-muted mb-4 uppercase tracking-wider">Emotional Timeline</p>
                <div className="flex items-end gap-1 h-24">
                  {[40, 55, 70, 45, 80, 60, 75, 90, 85, 65, 78, 88, 72, 60, 82].map((h, i) =>
                  <div
                    key={i}
                    className="flex-1 rounded-sm transition-all"
                    style={{
                      height: `${h}%`,
                      background: h > 70 ?
                      'hsl(var(--accent))' :
                      h > 50 ?
                      'hsl(var(--accent) / 0.4)' :
                      'hsl(var(--surface-dark-muted) / 0.3)'
                    }} />

                  )}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-surface-dark-muted">
                  <span>0:00</span>
                  <span>1:00</span>
                  <span>2:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-accent/10 blur-3xl rounded-full" />
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm text-muted-foreground">
          
          {["2-min recording", "AI-powered analysis", "Instant results", "GDPR compliant"].map((badge) =>
          <span key={badge} className="flex items-center gap-2">
              <span className="text-accent">✳</span>
              {badge}
            </span>
          )}
        </motion.div>
      </div>
    </section>);

};

export default HeroSection;