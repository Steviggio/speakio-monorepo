import { Roadmap } from '../../schemas/roadmap.schema';

export interface RoadmapExportAdapter {
  export(roadmap: Roadmap): string;
}

export class AnkiCsvExportAdapter implements RoadmapExportAdapter {
  /**
   * Generates Anki-compatible CSV string from a Roadmap's vocabulary items.
   * Extracts vocabularies from all steps and sub-steps, formatting each
   * as "front","back" with CSV quote escaping.
   */
  export(roadmap: Roadmap): string {
    const allVocabs: { front: string; back: string }[] = [];

    if (roadmap.steps) {
      for (const step of roadmap.steps) {
        if (step.vocabularies && step.vocabularies.length > 0) {
          allVocabs.push(...step.vocabularies);
        }
        if (step.subSteps) {
          for (const sub of step.subSteps) {
            if (sub.vocabularies && sub.vocabularies.length > 0) {
              allVocabs.push(...sub.vocabularies);
            }
          }
        }
      }
    }

    const escapeCsvString = (str: string) =>
      `"${(str || '').replace(/"/g, '""')}"`;

    return allVocabs
      .map(
        (card) =>
          `${escapeCsvString(card.front)},${escapeCsvString(card.back)}`,
      )
      .join('\n');
  }
}
