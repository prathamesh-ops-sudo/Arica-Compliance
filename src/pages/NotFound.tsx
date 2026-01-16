import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <span className="text-8xl font-bold gradient-text">404</span>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Attempted path: <code className="px-2 py-1 rounded bg-muted text-xs">{location.pathname}</code>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button asChild className="gradient-primary text-white">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Back
          </Button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-8 border-t border-border"
        >
          <p className="text-sm text-muted-foreground mb-4">Quick links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/" className="text-sm text-primary hover:underline">Dashboard</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/analytics" className="text-sm text-primary hover:underline">Analytics</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/reports" className="text-sm text-primary hover:underline">Reports</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/settings" className="text-sm text-primary hover:underline">Settings</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
