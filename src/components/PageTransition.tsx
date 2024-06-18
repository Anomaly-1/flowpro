// components/PageTransition.tsx
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
    hidden: { opacity: 0, scale: 0.8 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  };
  

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={(children as any).key}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
