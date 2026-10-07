/** The lock-up's parts, each a path in `LockupSprite` and a `<use>` in `Logo`. */
export const LOCKUP_PARTS = ["house", "window", "swoosh", "star", "word", "tagline"] as const;
export type LockupPart = (typeof LOCKUP_PARTS)[number];

export const lockupId = (part: LockupPart) => `vifnet-lockup-${part}`;

/** Each part's in-document reference, for a `<use href>`. */
export const LOCKUP_PART: Record<LockupPart, string> = {
  house: `#${lockupId("house")}`,
  window: `#${lockupId("window")}`,
  swoosh: `#${lockupId("swoosh")}`,
  star: `#${lockupId("star")}`,
  word: `#${lockupId("word")}`,
  tagline: `#${lockupId("tagline")}`,
};
