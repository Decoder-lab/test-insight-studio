const Footer = () => (
  <footer className="bg-surface-dark text-surface-dark-foreground py-12 border-t border-border/20">
    <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
          <span className="font-display font-bold text-accent-foreground text-xs">D</span>
        </div>
        <span className="font-display font-semibold">Decoder MVP</span>
      </div>
      <p className="text-sm text-surface-dark-muted">© 2026 Decoder. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
