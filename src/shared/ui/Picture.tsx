/** One photo's files: a `srcset` per format and the `<img>` fallback. */
export interface PhotoSet {
  avif: string;
  webp: string;
  src: string;
}

export interface PictureProps {
  set: PhotoSet;
  alt: string;
  /** The layout width, for the browser to pick a file before layout. */
  sizes: string;
  /** On the `<img>`: the box, the fit, the radius. */
  className?: string;
  /** The largest image above the fold: fetched first, never lazily. */
  priority?: boolean;
}

/**
 * A photo as a `<picture>`: AVIF, then WebP, each at the widths
 * `scripts/photos.ts` cut, so a phone downloads a phone's file. No
 * `next/image`: the optimiser is off (`withLanding`) and these are already the
 * web files. Takes the files, not a name, so a client island can render one
 * without importing every photo's URLs.
 */
export function Picture({ set, alt, sizes, className, priority = false }: PictureProps) {
  return (
    // `contents`: the `<img>` is the layout box, so its classes size it in a
    // flex or grid parent as if the `<picture>` were not there. The `<source>`s
    // are then children of that parent too, and the UA does not hide them:
    // each would be an empty flex item with a gap on either side.
    <picture className="contents [&>source]:hidden">
      <source type="image/avif" srcSet={set.avif} sizes={sizes} />
      <source type="image/webp" srcSet={set.webp} sizes={sizes} />
      <img
        src={set.src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}
