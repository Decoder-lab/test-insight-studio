import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    label: "Setup",
    title: "Configure your test parameters and target audience",
    items: [
      { bold: "Pre-Survey:", text: "Define questions to understand user context before the test." },
      { bold: "Task Design:", text: "Set up the screens and flows you want users to navigate." },
      { bold: "Recording Config:", text: "Enable webcam, screen, or both capture modes." },
    ],
    duration: "/5 min/",
  },
  {
    num: "02",
    label: "Record",
    title: "Watch real users interact with your product",
    items: [
      { bold: "Session Capture:", text: "Record screen activity and facial expressions simultaneously." },
      { bold: "Think Aloud:", text: "Users narrate their thought process in real-time." },
      { bold: "Auto-Tagging:", text: "AI marks moments of confusion, delight, and frustration." },
    ],
    duration: "/10-15 min/",
  },
  {
    num: "03",
    label: "Analyze",
    title: "Get actionable insights from every session",
    items: [
      { bold: "Timeline View:", text: "Visualize engagement and emotion across the session." },
      { bold: "Survey Results:", text: "Compare pre and post-test sentiment shifts." },
      { bold: "PMF Score:", text: "Get a calculated product-market fit confidence score." },
    ],
    duration: "/Instant/",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-surface-dark text-surface-dark-foreground py-24">
      <div className="container">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-surface-dark-muted">{"{03}"} — Process</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-16">How it works</h2>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-t border-border/20 py-12 grid md:grid-cols-[120px_80px_1fr_auto] gap-6 items-start"
            >
              <span className="border border-border/30 rounded-full px-4 py-1.5 text-sm w-fit">
                {step.label}
              </span>
              <span className="font-display text-2xl font-bold text-accent">/{step.num}</span>
              <div>
                <h3 className="font-display text-xl font-semibold mb-4">{step.title}</h3>
                <ul className="space-y-2">
                  {step.items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-sm text-surface-dark-muted">
                      <span className="text-accent mt-0.5">✳</span>
                      <span>
                        <strong className="text-surface-dark-foreground">{item.bold}</strong> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <span className="text-sm text-surface-dark-muted hidden md:block">{step.duration}</span>
            </motion.div>
          ))}
          <div className="border-t border-border/20" />
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
