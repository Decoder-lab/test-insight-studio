import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Eye, Lightbulb, MemoryStick } from "lucide-react";

const comparisonData = [
{
  category: "Data Source",
  traditional: "Surveys & interviews",
  selfReported: "User opinions",
  neuro: "Facial emotions & voice prosody"
},
{
  category: "Signal Type",
  traditional: "Conscious responses",
  selfReported: "Biased, polite lies",
  neuro: "Subconscious real signals"
},
{
  category: "Accuracy",
  traditional: "~60% predictive",
  selfReported: "~40% predictive",
  neuro: "87%+ accuracy"
},
{
  category: "Insight Depth",
  traditional: "What users SAY",
  selfReported: "What users THINK they feel",
  neuro: "What users ACTUALLY feel"
}];


const measurements = [
{
  icon: Brain,
  title: "Emotional Authenticity",
  desc: "Micro-expressions reveal confusion vs. genuine interest — beyond what words can hide."
},
{
  icon: Eye,
  title: "Attention Economics",
  desc: "Where users look, what they skip, and when attention drops below engagement threshold."
},
{
  icon: Lightbulb,
  title: "Value Perception",
  desc: "Aha moments, skepticism signals, and the exact second your value proposition clicks (or doesn't)."
},
{
  icon: MemoryStick,
  title: "Memory Encoding",
  desc: "What sticks after the session ends — brand recall, message retention, emotional residue."
}];


const WhatWeTestSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">Methodology</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">Most founders test the wrong things

          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional user testing captures what people SAY. We measure what they{" "}
            <strong className="text-foreground">FEEL</strong>.
          </p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border overflow-hidden mb-12">
          
          <div className="grid grid-cols-4 bg-muted text-xs font-semibold uppercase tracking-wider">
            <div className="p-4 text-muted-foreground" />
            <div className="p-4 text-muted-foreground">Traditional Testing</div>
            <div className="p-4 text-muted-foreground">Self-Reported</div>
            <div className="p-4 text-accent-foreground bg-accent font-bold">
</div>
          </div>
          {comparisonData.map((row, i) => <div key={i} className="grid grid-cols-4 border-t border-border text-sm">
              <div className="p-4 font-medium text-foreground">{row.category}</div>
              <div className="p-4 text-muted-foreground">{row.traditional}</div>
              <div className="p-4 text-muted-foreground">{row.selfReported}</div>
              <div className="p-4 bg-accent/5 font-medium text-foreground">{row.neuro}</div>
            </div>
          )}
        </motion.div>

        {/* Stats callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface-dark text-surface-dark-foreground rounded-2xl p-8 text-center mb-16">
          
          <p className="font-display text-2xl sm:text-3xl font-bold">
            <span className="text-accent">40%</span> of users who say "I'd definitely buy this" never convert
          </p>
          <p className="text-surface-dark-muted text-sm mt-2">
            — Journal of Consumer Psychology, 2023
          </p>
        </motion.div>

        {/* Measurement Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {measurements.map((m, i) =>
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-8 group hover:border-accent/30 transition-colors">
            
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <m.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            </motion.div>
          )}
        </div>

        {/* Bottom stat + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center">
          
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            <strong className="text-foreground">67%</strong> of landing pages fail because founders optimize for what users SAY, not what brains RESPOND to.
          </p>
          <Link
            to="/test"
            className="inline-flex items-center gap-3 bg-accent text-accent-foreground rounded-full px-8 py-4 font-semibold text-base hover:brightness-95 transition-all shadow-lg shadow-accent/20">
            
            Test What Really Matters <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>);

};

export default WhatWeTestSection;