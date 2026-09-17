import { AnkiCsvExportAdapter } from './anki-csv-export.adapter';
import { Roadmap } from '../../schemas/roadmap.schema';

describe('AnkiCsvExportAdapter', () => {
  let adapter: AnkiCsvExportAdapter;

  beforeEach(() => {
    adapter = new AnkiCsvExportAdapter();
  });

  it('should export an empty string when roadmap has no steps', () => {
    const roadmap: Roadmap = {
      title: 'Empty Roadmap',
      language: 'en',
      owner: 'user-1' as any,
      steps: [],
    };
    expect(adapter.export(roadmap)).toBe('');
  });

  it('should extract vocabularies from steps and subSteps', () => {
    const roadmap: Roadmap = {
      title: 'Language Roadmap',
      language: 'fr',
      owner: 'user-1' as any,
      steps: [
        {
          id: 'step-1',
          title: 'Basics',
          completed: false,
          vocabularies: [
            { front: 'Hello', back: 'Bonjour' },
            { front: 'Goodbye', back: 'Au revoir' },
          ],
          subSteps: [
            {
              id: 'sub-1',
              title: 'Greetings',
              completed: false,
              vocabularies: [{ front: 'Good evening', back: 'Bonsoir' }],
            },
          ],
        },
      ],
    };

    const csv = adapter.export(roadmap);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('"Hello","Bonjour"');
    expect(lines[1]).toBe('"Goodbye","Au revoir"');
    expect(lines[2]).toBe('"Good evening","Bonsoir"');
  });

  it('should correctly escape double quotes, commas, and newlines in CSV cells', () => {
    const roadmap: Roadmap = {
      title: 'Escaping Roadmap',
      language: 'en',
      owner: 'user-1' as any,
      steps: [
        {
          id: 'step-1',
          title: 'Special Chars',
          completed: false,
          vocabularies: [
            { front: 'He said "Hello"', back: 'Il a dit "Bonjour"' },
            { front: 'Apple, Banana, Orange', back: 'Pomme, Banane, Orange' },
            { front: 'Line 1\nLine 2', back: 'Ligne 1\nLigne 2' },
          ],
          subSteps: [],
        },
      ],
    };

    const csv = adapter.export(roadmap);
    expect(csv).toContain('"He said ""Hello"""');
    expect(csv).toContain('"Il a dit ""Bonjour"""');
    expect(csv).toContain('"Apple, Banana, Orange"');
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it('should handle steps/substeps with empty or undefined vocabularies gracefully', () => {
    const roadmap: Roadmap = {
      title: 'Partial Roadmap',
      language: 'en',
      owner: 'user-1' as any,
      steps: [
        {
          id: 'step-1',
          title: 'No Vocab',
          completed: false,
          vocabularies: [],
          subSteps: [
            {
              id: 'sub-1',
              title: 'Sub with vocab',
              completed: false,
              vocabularies: [{ front: 'Word', back: 'Mot' }],
            },
            {
              id: 'sub-2',
              title: 'Sub without vocab',
              completed: false,
              vocabularies: [],
            },
          ],
        },
      ],
    };

    const csv = adapter.export(roadmap);
    expect(csv).toBe('"Word","Mot"');
  });
});
