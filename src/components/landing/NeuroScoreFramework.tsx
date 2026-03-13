import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Shield, Gem, Layers, Sparkles, Brain } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const stages = [
  {
    icon: Eye,
    name: "ATTENTION",
    time: "0–20s",
    measures: [
      "Eye contact proxy via facial orientation",
      "Blink rate and gaze stability",
      "Head movement and lean-in behavior",
    ],
    tellsYou: "Did your hero section capture attention in the first 5 seconds?",
    good: "Users lean forward, maintain focus, reduced blink rate",
    bad: "Looking away, checking phone, disengagement signals",
    fixes: [
      "Simplify headline to max 8 words",
      "Add a human face above the fold",
      "Remove autoplay videos that distract",
    ],
  },
  {
    icon: Shield,
    name: "SAFETY",
    time: "20–40s",
    measures: [
      "Facial tension around eyes and jaw",
      "Voice hesitation and filler words",
      "Reading speed on trust elements (logos, testimonials)",
    ],
    tellsYou: "Do users trust you enough to consider buying?",
    good: "Relaxed facial muscles, confident tone when reading social proof",
    bad: "Furrowed brow on pricing, vocal hesitation at CTA",
    fixes: [
      "Add recognizable brand logos",
      "Show real founder photo with name",
      "Include specific metrics (\"saved 12hrs/week\")",
    ],
  },
  {
    icon: Gem,
    name: "VALUE",
    time: "40–70s",
    measures: [
      "Interest spikes (raised eyebrows, widened eyes)",
      "Vocal excitement and positive pitch shifts",
      "Re-reading behavior on key sections",
    ],
    tellsYou: "Did they have an \"aha moment\"?",
    good: "Visible \"got it\" moment, positive vocal reactions, nodding",
    bad: "Flat affect, skipping benefit sections, confusion markers",
    fixes: [
      "Lead with the user's pain point, not features",
      "Use concrete outcomes: \"save X hours/week\"",
      "Show compelling before/after comparison",
    ],
  },
  {
    icon: Layers,
    name: "SIMPLICITY",
    time: "70–90s",
    measures: [
      "Confusion expressions (squinting, lip compression)",
      "Vocal uncertainty and questioning tone",
      "Navigation hesitation and scroll reversals",
    ],
    tellsYou: "Can users figure out HOW to start without frustration?",
    good: "Clear path to action, zero confusion markers",
    bad: "Visible confusion, scrolling up/down lost, abandonment signals",
    fixes: [
      "Reduce to 1 CTA per section",
      "Use \"Start Free Trial\" instead of vague labels",
      "Add a \"3 steps\" visual process",
    ],
  },
  {
    icon: Sparkles,
    name: "PEAK",
    time: "90–110s",
    measures: [
      "Emotional high points and genuine smiles",
      "Engagement with demo or interactive elements",
      "Positive sentiment clustering",
    ],
    tellsYou: "Is there a memorable moment that makes it shareable?",
    good: "Genuine delight (Duchenne smile), rewatching demo, vocal excitement",
    bad: "No emotional peaks, flat experience throughout",
    fixes: [
      "Add an interactive demo users can try",
      "Show a surprising stat that reframes the problem",
      "Include a \"magic moment\" GIF or animation",
    ],
  },
  {
    icon: Brain,
    name: "MEMORY",
    time: "110–120s + post-test",
    measures: [
      "Post-test brand recall accuracy",
      "Message retention and value prop repetition",
      "Emotional residue (sentiment after session ends)",
    ],
    tellsYou: "Will they remember you when ready to buy later?",
    good: "Can repeat your value prop, remembers brand name unprompted",
    bad: "Can't recall what you do, confuses you with competitors",
    fixes: [
      "Repeat your core message at least 3 times",
      "End with an emotional anchor or memorable line",
      "Use a distinctive metaphor users can retell",
    ],
  },
];

const scoreRanges = [
  { label: "Critical", range: "0–49", color: "bg-[hsl(var(--score-critical))]" },
  { label: "Risky", range: "50–69", color: "bg-[hsl(var(--score-risky))]" },
  { label: "Good", range: "70–84", color: "bg-[hsl(var(--score-good))]" },
  { label: "Strong PMF", range: "85–100", color: "bg-[hsl(var(--score-strong))]" },
];

const NeuroScoreFramework = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">The Framework</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            6 Stages Your Brain Goes Through
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you know it or not. Validated by 18+ years of neuroscience research. Simplified for founders.
          </p>
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {stages.map((stage, i) => (
              <AccordionItem
                key={stage.name}
                value={stage.name}
                className="border border-border rounded-xl px-6 data-[state=open]:bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5 gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <stage.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-base">
                          {i + 1}. {stage.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {stage.time}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {stage.tellsYou}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="grid gap-6 sm:grid-cols-2 ml-14">
                    {/* What we measure */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        What we measure
                      </p>
                      <ul className="space-y-1.5">
                        {stage.measures.map((m) => (
                          <li key={m} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-accent mt-1">•</span>
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Good vs Bad */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--score-strong))] mb-1">
                          Good score (70+)
                        </p>
                        <p className="text-sm text-muted-foreground">{stage.good}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--score-critical))] mb-1">
                          Bad score (&lt;50)
                        </p>
                        <p className="text-sm text-muted-foreground">{stage.bad}</p>
                      </div>
                    </div>

                    {/* Fixes */}
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Common fixes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {stage.fixes.map((fix) => (
                          <span
                            key={fix}
                            className="text-xs bg-accent/10 text-accent-foreground border border-accent/20 rounded-full px-3 py-1"
                          >
                            {fix}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-surface-dark text-surface-dark-foreground rounded-2xl p-8"
        >
          <p className="text-xs text-surface-dark-muted uppercase tracking-wider mb-4 text-center">
            NeuroScore Formula
          </p>
          <p className="font-mono text-sm sm:text-base text-center leading-relaxed">
            <span className="text-accent font-semibold">NeuroScore</span> ={" "}
            (Attention × <span className="text-accent">0.20</span>) +{" "}
            (Safety × <span className="text-accent">0.15</span>) +{" "}
            (Value × <span className="text-accent">0.25</span>) +{" "}
            (Simplicity × <span className="text-accent">0.20</span>) +{" "}
            (Peak × <span className="text-accent">0.10</span>) +{" "}
            (Memory × <span className="text-accent">0.10</span>)
          </p>

          {/* Score ranges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {scoreRanges.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-xs text-surface-dark-muted">
                  {s.range}: <span className="text-surface-dark-foreground font-medium">{s.label}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/test"
            aria-label="Start PMF test"
            className="inline-flex items-center gap-3 bg-accent text-accent-foreground rounded-full px-8 py-4 font-semibold text-base hover:brightness-95 transition-all shadow-lg shadow-accent/20"
          >
            Get Your NeuroScore <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NeuroScoreFramework;
