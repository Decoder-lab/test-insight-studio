import { motion } from "framer-motion";
import { FlaskConical, Cpu, Building2 } from "lucide-react";

const credibilityColumns = [
  {
    icon: FlaskConical,
    title: "Validated Methods",
    items: [
      "Facial Action Coding System (FACS)",
      "Voice Stress Analysis (VSA)",
      "Cognitive Load Theory",
      "Peak-End Rule (Kahneman)",
    ],
  },
  {
    icon: Cpu,
    title: "Technology Stack",
    items: [
      "Multi-modal signal processing",
      "Temporal emotion alignment",
      "Sentiment-behavior correlation",
      "Micro-expression detection",
    ],
  },
  {
    icon: Building2,
    title: "Industry Adoption",
    items: [
      "Used by Fortune 500s at €50K+",
      "Now accessible to startups at €2,500",
      "Same science, founder-friendly price",
      "87%+ detection accuracy",
    ],
  },
];

const citations = [
  "\"Emotional response predicts purchase intent 2.4× better than stated preference\" — Journal of Consumer Psychology, 2023",
  "\"Facial micro-expressions reveal true confusion in 67% of cases where users claim clarity\" — Neuromarketing Research Review, 2024",
];

const ScientificFoundation = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Science</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Backed by Neuroscience, Built for Founders
          </h2>
        </div>

        {/* Researcher Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface-dark text-surface-dark-foreground rounded-2xl p-8 sm:p-10 mb-16"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <span className="font-display text-2xl font-bold text-accent">IB</span>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold mb-1">
                Dr. Ivan Brak, PhD
              </h3>
              <p className="text-sm text-surface-dark-muted mb-4">
                Chief Scientist · 18+ years neuroscience research · 40+ peer-reviewed publications
              </p>
              <blockquote className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-surface-dark-foreground/80 italic">
                "Traditional user testing asks 'What do you think?' We measure what your brain ACTUALLY does. The data doesn't lie — even when users think they're being honest."
              </blockquote>
            </div>
          </div>
        </motion.div>

        {/* Credibility Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {credibilityColumns.map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <col.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-base mb-4">{col.title}</h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-accent mt-0.5">✳</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Citations */}
        <div className="space-y-3">
          {citations.map((c, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs text-muted-foreground text-center leading-relaxed"
            >
              {c}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScientificFoundation;
