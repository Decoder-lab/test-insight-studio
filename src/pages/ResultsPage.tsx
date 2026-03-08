import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

const timelineData = [
  { time: "0:00", engagement: 40, emotion: 55 },
  { time: "0:30", engagement: 55, emotion: 60 },
  { time: "1:00", engagement: 70, emotion: 45 },
  { time: "1:30", engagement: 65, emotion: 70 },
  { time: "2:00", engagement: 80, emotion: 75 },
  { time: "2:30", engagement: 60, emotion: 50 },
  { time: "3:00", engagement: 75, emotion: 80 },
  { time: "3:30", engagement: 90, emotion: 85 },
  { time: "4:00", engagement: 85, emotion: 78 },
  { time: "4:30", engagement: 88, emotion: 82 },
];

const pmfScore = 72;

const ResultsPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Session: {id}</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-12">Results Dashboard</h1>

        {/* PMF Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark text-surface-dark-foreground rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-sm text-surface-dark-muted mb-1">Product-Market Fit Score</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold text-accent">{pmfScore}</span>
                <span className="text-surface-dark-muted text-lg">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: "Satisfaction", value: "4.2/5" },
                { label: "Would recommend", value: "78%" },
                { label: "Very disappointed", value: "42%" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="font-display text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-surface-dark-muted mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-xl font-semibold mb-6">Engagement Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(78, 100%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="engagement" stroke="hsl(78, 100%, 55%)" fill="url(#engGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="emotion" stroke="hsl(0, 0%, 30%)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-4 justify-center">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 bg-accent inline-block rounded" /> Engagement
            </span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 bg-foreground inline-block rounded opacity-40" style={{ borderTop: "2px dashed" }} /> Emotion
            </span>
          </div>
        </motion.div>

        {/* Survey Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="font-display text-xl font-semibold mb-4">Pre-Survey Insights</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Familiarity</span><span className="font-medium text-foreground">Somewhat</span></li>
              <li className="flex justify-between"><span>Role</span><span className="font-medium text-foreground">Product Manager</span></li>
              <li className="flex justify-between"><span>Expectations</span><span className="font-medium text-foreground">Positive</span></li>
            </ul>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="font-display text-xl font-semibold mb-4">Post-Survey Insights</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex justify-between"><span>Satisfaction</span><span className="font-medium text-foreground">Satisfied</span></li>
              <li className="flex justify-between"><span>Would recommend</span><span className="font-medium text-foreground">Probably yes</span></li>
              <li className="flex justify-between"><span>If discontinued</span><span className="font-medium text-foreground">Very disappointed</span></li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;
