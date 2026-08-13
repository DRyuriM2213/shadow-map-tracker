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
import { BLOCK_C_CLUES, BLOCK_C_LOCATION } from "@/data/blockC";

const byId = <T extends { id: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

export const CLUES = byId(
  applyCanonicalDocumentTitles([
    ...BASE_CLUES,
    ...EXTRA_CLUES,
    ...MISSING_CANONICAL_DOCUMENTS,
    ...BLOCK_C_CLUES,
  ]),
);

export const LOCATIONS = byId([
  ...BASE_LOCATIONS,
  ...EXTRA_LOCATIONS,
  BLOCK_C_LOCATION,
]);

export {
  CONSEQUENCES,
  PLAYERS,
  ROUTE_LABEL,
  SCENES,
  START_SCENE_ID,
  TESTS,
  TIMELINE,
};