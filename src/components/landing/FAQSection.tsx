import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How accurate is emotion detection?",
    a: "Our AI uses state-of-the-art facial action unit analysis with 87%+ accuracy on core emotions (engagement, confusion, delight, frustration). It's validated against academic benchmarks and improves continuously with more data.",
  },
  {
    q: "What do I need to record?",
    a: "Just a webcam and a quiet environment. The recording captures your face and voice as you browse the landing page. No special equipment needed — a laptop's built-in camera works perfectly.",
  },
  {
    q: "How long does analysis take?",
    a: "Results are typically ready within 60 seconds after your recording ends. The AI processes your facial expressions, voice patterns, and browsing behavior in parallel for near-instant insights.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. All recordings are encrypted in transit and at rest. Video data is processed and deleted within 24 hours. We're GDPR compliant and never share your data with third parties. You can request full deletion at any time.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container max-w-3xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">FAQ</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold">
            Common questions
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-6 data-[state=open]:bg-card"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-muted-foreground mb-6">Ready to decode your landing page?</p>
          <a
            href="/test"
            className="inline-flex items-center gap-3 bg-accent text-accent-foreground rounded-full px-8 py-4 font-semibold text-base hover:brightness-95 transition-all shadow-lg shadow-accent/20"
          >
            Test My Landing Page — €49
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
