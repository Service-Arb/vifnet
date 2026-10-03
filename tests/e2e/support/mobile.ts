import { randomInt } from "node:crypto";

/**
 * A French mobile number no other test submits, so a row looked up by it is
 * this test's own. Random, not the clock: with `fullyParallel` and one
 * project per breakpoint, two workers read the same millisecond and a
 * `Date.now()`-based number came out twice. Eight random digits after `06` or
 * `07`, never eight of one digit — kitstart's phone rule reads that as a
 * refusal to give a number.
 */
export function freshMobile(prefix: "06" | "07"): string {
  for (;;) {
    const subscriber = String(randomInt(100_000_000)).padStart(8, "0");
    if (!/^(\d)\1+$/.test(subscriber)) return `${prefix}${subscriber}`;
  }
}
