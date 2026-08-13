import {
  CLUES as BASE_CLUES,
  CONSEQUENCES,
  LOCATIONS as BASE_LOCATIONS,
  PLAYERS,
  ROUTE_LABEL,
  SCENES,
  START_SCENE_ID,
  TESTS,
  TIMELINE,
} from "@/data/campaign";
import { EXTRA_CLUES, EXTRA_LOCATIONS } from "@/data/campus";
import {
  MISSING_CANONICAL_DOCUMENTS,
  applyCanonicalDocumentTitles,
} from "@/data/documentsCanonical";

const byId = <T extends { id: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

export const CLUES = byId(
  applyCanonicalDocumentTitles([
    ...BASE_CLUES,
    ...EXTRA_CLUES,
    ...MISSING_CANONICAL_DOCUMENTS,
  ]),
);

export const LOCATIONS = byId([...BASE_LOCATIONS, ...EXTRA_LOCATIONS]);

export {
  CONSEQUENCES,
  PLAYERS,
  ROUTE_LABEL,
  SCENES,
  START_SCENE_ID,
  TESTS,
  TIMELINE,
};
