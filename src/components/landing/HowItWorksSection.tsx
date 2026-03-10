import { motion } from "framer-motion";
import { Link2, Video, Brain, FileBarChart, Monitor, FileUp } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Link2,
    title: "Paste your landing page URL — or upload a screenshot",
    desc: "Enter the URL of the page you want to test, or upload a PDF screenshot to explore during the session. No setup, no SDK, no code changes needed.",
    options: [
      { icon: Monitor, label: "Live URL", desc: "We'll load your page in-browser for a real-time session" },
      { icon: FileUp, label: "Upload PDF", desc: "Upload a screenshot or mockup to walk through instead" },
    ],
  },
  {
    num: "02",
    icon: Video,
    title: "Record yourself browsing (2 min max)",
    desc: "Your webcam captures facial expressions while you navigate the page. Think aloud as you go.",
  },
  {
    num: "03",
    icon: Brain,
    title: "AI analyzes your facial emotions & voice",
    desc: "Our AI detects micro-expressions, voice tone shifts, and engagement patterns in real time.",
  },
  {
    num: "04",
    icon: FileBarChart,
    title: "Get instant PMF report with fixes",
    desc: "Receive your NeuroScore, emotional timeline, key moments, and prioritized recommendations.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-surface-dark text-surface-dark-foreground py-24">
      <div className="container max-w-5xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-surface-dark-muted">How it works</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
          Four steps to clarity
        </h2>
        <p className="text-surface-dark-muted text-lg mb-16 max-w-xl">
          From URL to actionable insights in under 3 minutes.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background/5 border border-border/10 rounded-2xl p-8 group hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="font-display text-sm font-bold text-accent">/{step.num}</span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-surface-dark-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
