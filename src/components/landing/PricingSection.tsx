import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for initial validation",
    features: ["3 test sessions/month", "Pre & post surveys", "Basic timeline view", "Session recordings"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    desc: "For teams serious about PMF",
    features: ["Unlimited sessions", "AI emotion tagging", "PMF score calculator", "Team collaboration", "Export & share results"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For scale and compliance",
    features: ["Everything in Pro", "SSO & audit logs", "Dedicated support", "Custom integrations", "On-premise option"],
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">{"{04}"} — Pricing</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-16">
          Simple pricing
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-surface-dark text-surface-dark-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <span className="text-sm font-medium mb-4">{plan.name}</span>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <p className={`text-sm mb-8 ${plan.highlighted ? "text-surface-dark-muted" : "text-muted-foreground"}`}>
                {plan.desc}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`w-4 h-4 ${plan.highlighted ? "text-accent" : "text-foreground"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/test"
                className={`inline-flex items-center justify-center gap-2 rounded-full py-3 px-6 text-sm font-medium transition-all ${
                  plan.highlighted
                    ? "bg-accent text-accent-foreground hover:brightness-95"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                Get started <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
