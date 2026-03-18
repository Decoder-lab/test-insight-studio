import { motion } from "framer-motion";
import CalendlyButton from "@/components/CalendlyButton";

const ConsultationSection = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Not Ready to Test Yet?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Book a free 15-minute consultation to learn if NeuroScore is right for your stage.
          </p>
          <CalendlyButton className="px-8 py-4 text-base" variant="default">
            Book Free 15-Min Consultation
          </CalendlyButton>
        </motion.div>

        {/* Inline Calendly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <div
            className="calendly-inline-widget rounded-2xl overflow-hidden border border-border"
            data-url="https://calendly.com/decoder-agency/30min?hide_event_type_details=1&hide_gdpr_banner=1"
            style={{ minWidth: 320, height: 700 }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default ConsultationSection;
