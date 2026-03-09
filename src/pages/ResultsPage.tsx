import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Share2, Phone, AlertTriangle, CheckCircle, TrendingUp, Eye, Shield, Gem, Zap, Star, Brain } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

// --- Mock Data ---
const neuroScore = 74;

const stageScores = [
  { label: "Attention", score: 82, icon: Eye },
  { label: "Safety", score: 68, icon: Shield },
  { label: "Value", score: 79, icon: Gem },
  { label: "Simplicity", score: 61, icon: Zap },
  { label: "Peak", score: 85, icon: Star },
  { label: "Memory", score: 70, icon: Brain },
];

const emotionTimeline = Array.from({ length: 25 }, (_, i) => {
  const t = i * 5;
  const base = Math.sin(t * 0.05) * 0.4;
  const noise = (Math.random() - 0.5) * 0.3;
  return { time: t, valence: Math.round((base + noise) * 100) / 100 };
});

const keyMoments = [
  {
    id: 1,
    timestamp: 12,
    emotion: "Confusion",
    confidence: 87,
    transcript: "Wait, where do I click to sign up? I don't see the button...",
    recommendation: "Make the CTA button more prominent with higher contrast and larger size.",
    screenshot: "/placeholder.svg",
  },
  {
    id: 2,
    timestamp: 34,
    emotion: "Interest",
    confidence: 92,
    transcript: "Oh nice, the pricing is actually really clear. I like this layout.",
    recommendation: "Keep the pricing layout — it's driving positive engagement.",
    screenshot: "/placeholder.svg",
  },
  {
    id: 3,
    timestamp: 67,
    emotion: "Frustration",
    confidence: 78,
    transcript: "This form is asking too many questions. I just want to try it.",
    recommendation: "Reduce onboarding form to 2-3 essential fields. Add a 'skip' option.",
    screenshot: "/placeholder.svg",
  },
  {
    id: 4,
    timestamp: 98,
    emotion: "Delight",
    confidence: 95,
    transcript: "Wow, the dashboard preview looks amazing. I want this for my product.",
    recommendation: "Feature the dashboard preview more prominently on the landing page.",
    screenshot: "/placeholder.svg",
  },
];

const pmfSummary = {
  aiSummary:
    "The product demonstrates strong potential with a NeuroScore of 74/100. Users show high engagement during the pricing and dashboard sections, but experience friction during signup and onboarding. The core value proposition resonates well, especially with product managers and founders. Key improvements in CTA visibility and form simplification could push the score above 85.",
  topFixes: [
    "Increase CTA button contrast and size — 87% of users missed it on first scan",
    "Simplify the onboarding form from 8 fields to 3 essential ones",
    "Add a product demo video above the fold to reduce bounce rate by ~30%",
  ],
  investorSummary:
    "Decoder analysis of 1 user session reveals strong product-market fit signals: 42% would be 'very disappointed' without the product (Sean Ellis benchmark: 40%). Emotional engagement peaks during value demonstration, with a Net Promoter likelihood of 78%. Primary conversion barrier is UX friction in the signup flow, which is addressable with 2-3 targeted improvements.",
};

// --- Helpers ---
function getScoreStatus(score: number) {
  if (score > 85) return { label: "Strong", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
  if (score > 70) return { label: "Good", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" };
  if (score > 50) return { label: "Risky", color: "bg-orange-500/15 text-orange-600 border-orange-500/30" };
  return { label: "Critical", color: "bg-red-500/15 text-red-600 border-red-500/30" };
}

function getStageColor(score: number) {
  if (score > 85) return "hsl(142, 71%, 45%)";
  if (score > 70) return "hsl(78, 100%, 55%)";
  if (score > 50) return "hsl(38, 92%, 50%)";
  return "hsl(0, 84%, 60%)";
}

function getEmotionColor(emotion: string) {
  const map: Record<string, string> = {
    Confusion: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    Interest: "bg-accent/15 text-accent-foreground border-accent/30",
    Frustration: "bg-red-500/15 text-red-600 border-red-500/30",
    Delight: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  };
  return map[emotion] || "bg-muted text-muted-foreground";
}

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// --- Custom Tooltip ---
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{formatTime(label)}</p>
      <p className="text-muted-foreground">
        Valence: <span className="font-mono font-medium text-foreground">{payload[0].value}</span>
      </p>
    </div>
  );
};

// --- Component ---
const ResultsPage = () => {
  const { id } = useParams();
  const status = getScoreStatus(neuroScore);
  const [selectedMoment, setSelectedMoment] = useState<number | null>(null);

  const anim = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-6xl">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground font-mono">Session: {id}</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-12">Results Dashboard</h1>

        {/* NeuroScore Card */}
        <motion.div {...anim(0)}>
          <Card className="bg-surface-dark text-surface-dark-foreground border-0 mb-8 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Score */}
                <div className="flex flex-col items-center lg:items-start gap-3 lg:min-w-[200px]">
                  <p className="text-sm text-surface-dark-muted">NeuroScore™</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-7xl font-bold text-accent">{neuroScore}</span>
                    <span className="text-surface-dark-muted text-xl">/100</span>
                  </div>
                  <Badge className={`${status.color} border text-xs font-medium`}>
                    {status.label}
                  </Badge>
                </div>

                {/* Stage Breakdown */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
                  {stageScores.map((stage) => (
                    <div key={stage.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-surface-dark-muted">
                          <stage.icon className="w-3.5 h-3.5" />
                          {stage.label}
                        </span>
                        <span className="font-mono font-semibold text-surface-dark-foreground">{stage.score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getStageColor(stage.score) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.score}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emotional Timeline */}
        <motion.div {...anim(0.1)}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">Emotional Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Click a marker to view that moment's details</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={emotionTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatTime(v)}
                    stroke="hsl(0, 0%, 70%)"
                  />
                  <YAxis
                    domain={[-1, 1]}
                    ticks={[-1, -0.5, 0, 0.5, 1]}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(0, 0%, 70%)"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valence"
                    stroke="hsl(78, 100%, 55%)"
                    fill="url(#valenceGrad)"
                    strokeWidth={2}
                  />
                  {keyMoments.map((m) => (
                    <ReferenceDot
                      key={m.id}
                      x={m.timestamp}
                      y={emotionTimeline.find((d) => d.time === m.timestamp)?.valence || 0}
                      r={6}
                      fill={m.emotion === "Frustration" || m.emotion === "Confusion" ? "hsl(0, 84%, 60%)" : "hsl(78, 100%, 55%)"}
                      stroke="hsl(0, 0%, 100%)"
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedMoment(m.id)}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-4 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> Positive
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" /> Negative moment
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Moments */}
        <motion.div {...anim(0.2)}>
          <h2 className="font-display text-2xl font-bold mb-6">Key Moments</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {keyMoments.map((m) => (
              <Card
                key={m.id}
                className={`transition-all cursor-pointer hover:shadow-md ${selectedMoment === m.id ? "ring-2 ring-accent" : ""}`}
                onClick={() => setSelectedMoment(m.id)}
              >
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                    <img src={m.screenshot} alt={`Screenshot at ${formatTime(m.timestamp)}`} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="secondary" className="font-mono text-xs bg-surface-dark text-surface-dark-foreground border-0">
                        {formatTime(m.timestamp)}
                      </Badge>
                      <Badge className={`${getEmotionColor(m.emotion)} border text-xs`}>
                        {m.emotion} · {m.confidence}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-foreground italic">"{m.transcript}"</p>
                    <div className="flex items-start gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">{m.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* PMF Conclusion */}
        <motion.div {...anim(0.3)}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">PMF Analysis & Conclusion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{pmfSummary.aiSummary}</p>

              <div>
                <h4 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Top 3 Things to Fix
                </h4>
                <ol className="space-y-2">
                  {pmfSummary.topFixes.map((fix, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-mono font-bold text-accent shrink-0">{i + 1}.</span>
                      <span className="text-muted-foreground">{fix}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 border border-border">
                <h4 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" /> Investor-Ready Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{pmfSummary.investorSummary}"
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div {...anim(0.4)}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-display font-semibold">
              <Download className="w-4 h-4" /> Download PDF Report
            </Button>
            <Button size="lg" variant="outline" className="gap-2 font-display">
              <Share2 className="w-4 h-4" /> Share Results
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 font-display">
              <Phone className="w-4 h-4" /> Book a Call
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
