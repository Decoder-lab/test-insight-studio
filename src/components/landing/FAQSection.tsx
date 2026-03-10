import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How is this different from regular user testing?",
    a: "Traditional testing captures what users SAY (surveys, interviews). NeuroScore measures what they FEEL (facial emotions, voice stress, attention patterns). Studies show 40% of users who say \"I'd buy this\" never convert — their emotions reveal the truth.",
  },
  {
    q: "What makes NeuroScore scientifically valid?",
    a: "Our methodology combines validated neuroscience techniques: Facial Action Coding System (FACS), Voice Stress Analysis, and gaze proxy via facial orientation. Developed by Dr. Ivan Brak (PhD, 18+ years research, 40+ publications).",
  },
  {
    q: "Can I just use regular A/B testing instead?",
    a: "A/B testing tells you WHAT performs better, but not WHY. NeuroScore shows you exactly where users get confused, lose trust, or check out emotionally — so you know what to fix BEFORE spending money on traffic.",
  },
  {
    q: "What if my NeuroScore is low?",
    a: "That's the point! 67% of founders launch with critical UX issues they never detected. You'll get specific, prioritized fixes with exact timestamps, screenshots, and emotional data. Better to know NOW than after burning €10K on ads.",
  },
  {
    q: "How long until I get results?",
    a: "48 hours maximum. Most tests analyzed within 24 hours. You'll receive: NeuroScore breakdown (6 stages), emotional timeline graph, key moments with screenshots, prioritized fix list, and investor-ready PMF summary.",
  },
  {
    q: "How accurate is emotion detection?",
    a: "Our AI uses state-of-the-art facial action unit analysis with 87%+ accuracy on core emotions (engagement, confusion, delight, frustration). It's validated against academic benchmarks and improves continuously.",
  },
  {
    q: "What do I need to record?",
    a: "Just a webcam and a quiet environment. The recording captures your face and voice as you browse the landing page. No special equipment needed — a laptop's built-in camera works perfectly.",
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
