import { Link } from "react-router-dom";
import { ArrowRight, Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Single Test",
    price: "€49",
    period: "one-time",
    desc: "Perfect for a quick landing page checkup",
    features: [
      "1 landing page analysis",
      "NeuroScore + emotional timeline",
      "Key moments with screenshots",
      "Actionable fix recommendations",
      "PDF report download",
    ],
    highlighted: false,
    cta: "Test My Landing Page",
  },
  {
    name: "Pro",
    price: "€199",
    period: "/month",
    desc: "For teams iterating fast on conversion",
    features: [
      "Unlimited landing page tests",
      "Everything in Single Test",
      "A/B comparison reports",
      "Team collaboration (5 seats)",
      "Priority AI analysis",
      "Slack & Notion integrations",
    ],
    highlighted: true,
    cta: "Start Pro Plan",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-surface-dark text-surface-dark-foreground">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-surface-dark-muted">Pricing</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-surface-dark-muted text-lg">
            No subscriptions required. Pay per test, or go unlimited.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 flex flex-col relative ${
                plan.highlighted
                  ? "bg-accent text-accent-foreground ring-2 ring-accent"
                  : "bg-background/5 border border-border/10"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-8 bg-surface-dark text-accent text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Most Popular
                </div>
              )}

              <span className="text-sm font-medium mb-4 opacity-80">{plan.name}</span>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? "opacity-60" : "text-surface-dark-muted"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-8 ${plan.highlighted ? "opacity-70" : "text-surface-dark-muted"}`}>
                {plan.desc}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 shrink-0 ${plan.highlighted ? "opacity-80" : "text-accent"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/test"
                className={`inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-surface-dark text-surface-dark-foreground hover:opacity-90"
                    : "bg-accent text-accent-foreground hover:brightness-95"
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-surface-dark-muted mt-8">
          30-day money-back guarantee · No credit card required for single test
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
