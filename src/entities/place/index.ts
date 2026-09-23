// A thin slice over the config: the data lives in `shared/config/places.ts`,
// the model in `shared/landing`. Upper layers reach a place through here.
export { PLACE } from "@/shared/config/places";
export { isPublished, type Place, type ServiceArea } from "@/shared/landing";
