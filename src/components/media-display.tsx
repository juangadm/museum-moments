"use client";

import Image from "next/image";
import { isVideoUrl, isGifUrl } from "@/lib/validation";

type MediaDisplayProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  videoClassName?: string;
};

export function MediaDisplay({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority,
  className = "",
  videoClassName,
}: MediaDisplayProps) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={videoClassName || className}
        style={fill ? { position: "absolute", width: "100%", height: "100%", objectFit: "cover" } : undefined}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized={isGifUrl(src)}
    />
  );
}
