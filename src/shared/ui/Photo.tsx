import { PHOTO_SETS, type PhotoStem } from "@/shared/portfolio";
import { Picture, type PictureProps } from "./Picture";

export type PhotoProps = Omit<PictureProps, "set"> & { stem: PhotoStem };

/** A portfolio photo by name, on the server: see {@link Picture}. */
export function Photo({ stem, ...props }: PhotoProps) {
  return <Picture set={PHOTO_SETS[stem]} {...props} />;
}
