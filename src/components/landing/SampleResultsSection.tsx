import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, ThumbsUp, Eye } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const timelineData = [
  { time: "0:00", emotion: 45 },
  { time: "0:10", emotion: 52 },
  { time: "0:20", emotion: 68 },
  { time: "0:30", emotion: 42 },
  { time: "0:40", emotion: 55 },
  { time: "0:50", emotion: 71 },
  { time: "1:00", emotion: 38 },
  { time: "1:10", emotion: 62 },
  { time: "1:20", emotion: 78 },
  { time: "1:30", emotion: 65 },
  { time: "1:40", emotion: 82 },
  { time: "1:50", emotion: 74 },
  { time: "2:00", emotion: 88 },
];

const keyMoments = [
  {
    time: "0:30",
    icon: AlertTriangle,
    label: "Confusion detected",
    desc: "User hesitated on pricing section — unclear value proposition",
    type: "warning" as const,
  },
  {
    time: "1:00",
    icon: Eye,
    label: "Attention drop",
    desc: "User scrolled past features section without reading",
    type: "warning" as const,
  },
  {
    time: "1:40",
    icon: ThumbsUp,
    label: "Positive reaction",
    desc: "Social proof section triggered genuine smile and engagement",
    type: "positive" as const,
  },
];

const SampleResultsSection = () => {
  return (
    <section id="sample-results" className="py-24 bg-background">
      <div className="container max-w-5xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Sample Results</span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
          See what you'll get
        </h2>
        <p className="text-muted-foreground text-lg mb-16 max-w-xl">
          Here's a real example from a landing page analysis.
        </p>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-8">
          {/* NeuroScore Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-surface-dark text-surface-dark-foreground rounded-2xl p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-surface-dark-muted uppercase tracking-wider">NeuroScore</span>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="font-display text-6xl font-bold text-accent">67</span>
              <span className="text-surface-dark-muted text-xl">/100</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "Engagement", value: 72, color: "bg-accent" },
                { label: "Clarity", value: 58, color: "bg-accent/50" },
                { label: "Trust", value: 71, color: "bg-accent/70" },
                { label: "Desire", value: 63, color: "bg-accent/40" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-surface-dark-muted">{m.label}</span>
                    <span className="text-surface-dark-foreground font-medium">{m.value}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-dark-muted/20 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Emotional Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <h3 className="font-display text-lg font-semibold mb-6">Emotional Timeline</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="emotionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(0, 0%, 7%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'hsl(0, 0%, 95%)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="emotion"
                  stroke="hsl(78, 100%, 55%)"
                  fill="url(#emotionGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Key Moments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-display text-lg font-semibold mb-4">Key Moments</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {keyMoments.map((moment) => (
              <div
                key={moment.time}
                className={`rounded-xl p-5 border ${
                  moment.type === "warning"
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-accent/5 border-accent/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <moment.icon className={`w-4 h-4 ${
                    moment.type === "warning" ? "text-destructive" : "text-accent"
                  }`} />
                  <span className="text-xs text-muted-foreground font-mono">{moment.time}</span>
                </div>
                <p className="font-medium text-sm mb-1">{moment.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{moment.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SampleResultsSection;
