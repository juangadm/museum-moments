"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { MomentNav } from "@/lib/moments";

type Props = {
  prev: MomentNav;
  next: MomentNav;
};

export function MomentNavigation({ prev, next }: Props) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const navigatePrev = useCallback(() => {
    if (prev) router.push(`/m/${prev.slug}`);
  }, [prev, router]);

  const navigateNext = useCallback(() => {
    if (next) router.push(`/m/${next.slug}`);
  }, [next, router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't navigate if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigatePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigatePrev, navigateNext]);

  // Swipe navigation
  useEffect(() => {
    const minSwipeDistance = 50;

    function handleTouchStart(e: TouchEvent) {
      touchEndX.current = null;
      touchStartX.current = e.targetTouches[0].clientX;
    }

    function handleTouchMove(e: TouchEvent) {
      touchEndX.current = e.targetTouches[0].clientX;
    }

    function handleTouchEnd() {
      if (!touchStartX.current || !touchEndX.current) return;

      const distance = touchStartX.current - touchEndX.current;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        navigateNext();
      } else if (isRightSwipe) {
        navigatePrev();
      }

      touchStartX.current = null;
      touchEndX.current = null;
    }

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigatePrev, navigateNext]);

  // This component only handles navigation logic, no visual output
  return null;
}
