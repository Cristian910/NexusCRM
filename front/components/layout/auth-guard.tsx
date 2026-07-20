"use client";

/**
 * AuthGuard — wraps protected layouts.
 * Shows a full-page skeleton while the session is initializing,
 * then renders children once we know the auth state.
 *
 * Route-level redirection is handled by middleware.ts,
 * so this component only needs to block render during hydration.
 */
import { useAuthStore } from "@/lib/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isInitializing = useAuthStore((s) => s.isInitializing);

  return (
    <AnimatePresence mode="wait">
      {isInitializing ? (
        <motion.div
          key="init-skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-screen w-full items-center justify-center"
          style={{ background: "hsl(var(--background))" }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Animated logo placeholder */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl animate-pulse"
              style={{ background: "hsl(var(--primary) / 0.2)" }}
            />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="contents"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
