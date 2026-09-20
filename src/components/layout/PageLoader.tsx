import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <motion.div
        className="h-8 w-8 rounded-full border-2 border-cyan-glow/20 border-t-cyan-glow"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
