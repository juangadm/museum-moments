import sharp from 'sharp';

/**
 * Extracts the dominant color from an image URL.
 * Uses sharp to analyze the image and return the most prominent color.
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const { dominant } = await sharp(buffer)
      .resize(100, 100, { fit: 'inside' }) // Downsample for speed
      .stats();

    const { r, g, b } = dominant;
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  } catch (error) {
    console.error('Failed to extract color:', error);
    return '#1a1a1a'; // Fallback to foreground
  }
}

/**
 * Calculates a contrasting text color (black or white) for a given background color.
 * Uses the luminance formula to determine readability.
 */
export function getContrastColor(hex: string): string {
  // Handle invalid hex
  if (!hex || hex.length < 7) {
    return '#ffffff';
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}
