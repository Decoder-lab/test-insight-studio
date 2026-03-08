import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-16 bg-background relative overflow-hidden">
      {/* Subtle diagonal lines bg */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`,
      }} />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-12"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">PMF Testing Platform</span>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tight">
              Decode your{" "}
              <span className="inline-flex items-center">
                <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
                  product-market
                </span>
              </span>
              <br />
              fit with real
              <br />
              user insights
            </h1>

            <p className="mt-10 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Record user sessions, run pre & post surveys, and visualize engagement
              timelines to validate your MVP faster than ever.
            </p>

            <Link
              to="/test"
              className="mt-8 inline-flex items-center gap-3 bg-accent text-accent-foreground rounded-full pl-6 pr-2 py-2 font-medium text-base hover:brightness-95 transition-all group"
            >
              Start your first test
              <span className="w-10 h-10 rounded-full bg-card flex items-center justify-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="w-5 h-5 text-foreground" />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Stats marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-24 -mx-8 overflow-hidden"
        >
          <div className="bg-surface-dark text-surface-dark-foreground rounded-2xl py-4 px-6">
            <div className="flex animate-marquee gap-16 whitespace-nowrap">
              {["50+ / tests completed", "12 / active teams", "3min / avg setup time", ">90% / completion rate",
                "50+ / tests completed", "12 / active teams", "3min / avg setup time", ">90% / completion rate"
              ].map((stat, i) => (
                <span key={i} className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-accent">✳</span>
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
