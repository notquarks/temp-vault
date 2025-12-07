"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const AnimatedList = React.memo(
  ({ className, children, delay = 1000, loop = true }) => {
    const [index, setIndex] = useState(0);
    const childrenArray = React.Children.toArray(children);

    useEffect(() => {
      if (loop || index < childrenArray.length - 1) {
        const interval = setInterval(() => {
          setIndex((prevIndex) => {
            if (loop) {
              return (prevIndex + 1) % childrenArray.length;
            } else {
              return Math.min(prevIndex + 1, childrenArray.length - 1);
            }
          });
        }, delay);

        return () => clearInterval(interval);
      }
    }, [childrenArray.length, delay, loop, index]);

    const itemsToShow = useMemo(
      () => childrenArray.slice(0, index + 1),
      [index, childrenArray],
    );

    return (
      <div className={`flex w-full flex-col items-center gap-4 ${className}`}>
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={item.key}>{item}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({ children }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}
