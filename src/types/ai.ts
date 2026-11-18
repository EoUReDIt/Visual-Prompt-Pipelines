import { BlockType, FieldKind, PhotoRole } from './pipeline';

export type LightweightModelId =
  | 'Xenova/t5-small'
  | 'Xenova/pythia-70m-deduped'
  | 'Xenova/flan-t5-small';

export interface LightweightModelSpec {
  id: LightweightModelId;
  name: string;
  paramsLabel: string;
  approxDownloadLabel: string;
  task: 'text2text-generation' | 'text-generation';
  strength: string;
}

export const LIGHTWEIGHT_MODELS: LightweightModelSpec[] = [
  {
    id: 'Xenova/t5-small',
    name: 'T5 Small',
    paramsLabel: '60M params',
    approxDownloadLabel: '~35 MB (q8)',
    task: 'text2text-generation',
    strength: 'Fast spell refinement & concise phrase completion',
  },
  {
    id: 'Xenova/pythia-70m-deduped',
    name: 'Pythia 70M',
    paramsLabel: '70M params',
    approxDownloadLabel: '~42 MB (q8)',
    task: 'text-generation',
    strength: 'Low-latency next-phrase text auto-completion',
  },
  {
    id: 'Xenova/flan-t5-small',
    name: 'Flan-T5 Small',
    paramsLabel: '77M params',
    approxDownloadLabel: '~46 MB (q8)',
    task: 'text2text-generation',
    strength: 'Instruction-tuned field ideas & prompt suggestions',
  },
];

export type AiModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AiFeatureConfig {
  enabled: boolean;
  modelId: LightweightModelId;
  spellCheck: boolean;
  autoComplete: boolean;
  fieldSuggestions: boolean;
}

export interface SuggestedFieldPreset {
  kind: FieldKind;
  name: string;
  starterContent: string;
  photoRole?: PhotoRole;
  blockTypes: BlockType[];
}

export interface SpellingIssue {
  word: string;
  index: number;
  length: number;
  suggestions: string[];
}
