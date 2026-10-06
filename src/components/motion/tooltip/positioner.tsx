"use client";

import { useIsPresent } from "motion/react";
import {
  useCallback,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useTooltipPosition } from "./use-position";

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

type PositionProps = Parameters<typeof useTooltipPosition>[0];

/** Readiness lives with the mounted overlay, not a trigger ref's attach/detach cycle. */
export function TooltipPositioner({
  children,
  ...position
}: Omit<PositionProps, "open" | "onPosition"> & {
  children: (ready: boolean, present: boolean) => ReactNode;
}) {
  const present = useIsPresent();
  const [ready, setReady] = useState(false);
  const onPosition = useCallback(() => setReady(true), []);
  // React owns floatingRef as an element ref; wrapping it in a merge function
  // keeps the attach as an effect-phase callback rather than a render-time
  // ref read.
  const floatingElementRef = mergeRefs(position.floatingRef);
  useTooltipPosition({ ...position, open: present, onPosition });
  return (
    <span
      ref={floatingElementRef}
      inert={!present}
      aria-hidden={!present || undefined}
      className="pointer-events-none fixed left-0 top-0 z-[9999] w-max"
      style={{ visibility: "hidden", maxWidth: "calc(100vw - 16px)" }}
    >
      {children(ready, present)}
    </span>
  );
}
