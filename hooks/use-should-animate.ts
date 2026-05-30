"use client"

import { useReducedMotion } from "framer-motion"

/**
 * Single source of truth for whether animations should run.
 * Returns false only when the user has `prefers-reduced-motion: reduce` set;
 * unknown (null, pre-resolution) defaults to animating. Consumers collapse
 * duration to ~0.001s / render the final state when this returns false.
 */
export function useShouldAnimate() {
  return !useReducedMotion()
}
