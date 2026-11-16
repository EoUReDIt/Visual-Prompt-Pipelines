import { BlockType, PhotoRole, PipelineBlock, PipelineTemplate } from '../types/pipeline';

export const BLOCK_TYPES: BlockType[] = [
  'Overarching Request',
  'Model & Task',
  'Concept & Scene',
  'Subject Details',
  'Reference Photos',
  'Constraints',
  'Audio / Voiceover',
  'Output Format',
  'Custom Section',
];

export const PHOTO_ROLES: PhotoRole[] = [
  'Subject Ref',
  'Scene / Environment Ref',
  'Analysis-Only Ref',
  'Comparison Item',
  'Style / Lighting Ref',
];

export const createUid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const DEFAULT_TEMPLATES: Record<string, PipelineTemplate> = {
  'video-gen': {
    key: 'video-gen',
    label: 'Video Generation Pipeline',
    description: 'End-to-end video prompt stack with subject, scene, split-role photo refs, and constraints.',
    title: 'Video Generation Pipeline',
    blocks: [
      {
        title: 'Overarching Request',
        type: 'Overarching Request',
        expanded: true,
        fields: [
          {
            id: 'vg-1',
            kind: 'text',
            name: 'Goal',
            content: 'Create a moody, cinematic 6-second intro clip for a mechanical wristwatch launch.',
          },
        ],
      },
      {
        title: 'Model & Output Format',
        type: 'Model & Task',
        expanded: false,
        fields: [
          {
            id: 'vg-2',
            kind: 'text',
            name: 'Target Engine',
            content: 'Video Generation v2',
          },
          {
            id: 'vg-3',
            kind: 'text',
            name: 'Aspect Ratio & Duration',
            content: '16:9 · 6 seconds · 24fps',
          },
        ],
      },
      {
        title: 'Scene & Subject',
        type: 'Concept & Scene',
        expanded: true,
        fields: [
          {
            id: 'vg-4',
            kind: 'text',
            name: 'What the Video Is About',
            content: 'Subject checks their wristwatch while stepping out of a cab onto a rain-slicked street.',
          },
          {
            id: 'vg-5',
            kind: 'text',
            name: 'Subject Outfit',
            content: 'Charcoal wool overcoat, crisp white collar, dark leather gloves.',
          },
          {
            id: 'vg-6',
            kind: 'text',
            name: 'Scene Environment',
            content: 'Neon-lit city avenue at dusk with wet asphalt reflections and soft rain bokeh.',
          },
        ],
      },
      {
        title: 'Reference Photos',
        type: 'Reference Photos',
        expanded: true,
        fields: [
          {
            id: 'vg-7',
            kind: 'image',
            photoRole: 'Subject Ref',
            name: 'Watch & Wrist Pose',
            content: 'Preserve brushed steel bezel texture, dial numerals, and wrist-turn framing.',
            imageName: '',
            imageUrl: '',
          },
          {
            id: 'vg-8',
            kind: 'image',
            photoRole: 'Scene / Environment Ref',
            name: 'Rainy Street Backdrop',
            content: 'Use as the background street architecture and wet pavement environment.',
            imageName: '',
            imageUrl: '',
          },
          {
            id: 'vg-9',
            kind: 'image',
            photoRole: 'Analysis-Only Ref',
            name: 'Color Grade Study',
            content: 'Analyze teal-amber contrast and specular highlights only — do not copy objects.',
            imageName: '',
            imageUrl: '',
          },
        ],
      },
      {
        title: 'Constraints',
        type: 'Constraints',
        expanded: false,
        fields: [
          {
            id: 'vg-10',
            kind: 'positive',
            name: 'Must Include',
            content: 'Shallow depth of field, smooth 24fps dolly push-in, crisp metallic reflections.',
          },
          {
            id: 'vg-11',
            kind: 'negative',
            name: 'Avoid',
            content: 'No warped fingers, no text overlays, no synthetic lens flare or jump cuts.',
          },
        ],
      },
    ],
  },
  'video-analyst': {
    key: 'video-analyst',
    label: 'Video Analyst Pipeline',
    description: 'Audit source footage for pacing, visual continuity, and timestamped editorial feedback.',
    title: 'Video Analyst Pipeline',
    blocks: [
      {
        title: 'Overarching Request',
        type: 'Overarching Request',
        expanded: true,
        fields: [
          {
            id: 'va-1',
            kind: 'text',
            name: 'Analysis Goal',
            content: 'Audit the uploaded video cut for pacing, visual continuity, and audio-visual sync.',
          },
        ],
      },
      {
        title: 'Model & Source Video',
        type: 'Model & Task',
        expanded: false,
        fields: [
          {
            id: 'va-2',
            kind: 'text',
            name: 'Analyst Model',
            content: 'Multimodal Video Analyst',
          },
          {
            id: 'va-3',
            kind: 'text',
            name: 'Source Clip & Range',
            content: 'product_cut_v2.mp4 (00:00 – 00:45)',
          },
        ],
      },
      {
        title: 'Evaluation Criteria',
        type: 'Subject Details',
        expanded: true,
        fields: [
          {
            id: 'va-4',
            kind: 'text',
            name: 'Hook Effectiveness',
            content: 'Assess first 3 seconds for visual clarity, motion energy, and viewer retention.',
          },
          {
            id: 'va-5',
            kind: 'text',
            name: 'Continuity Errors',
            content: 'Flag wardrobe, lighting temperature, or prop position mismatches across cuts.',
          },
        ],
      },
      {
        title: 'Constraints & Output',
        type: 'Constraints',
        expanded: false,
        fields: [
          {
            id: 'va-6',
            kind: 'positive',
            name: 'Output Structure',
            content: 'List findings chronologically with exact MM:SS timestamps and actionable fixes.',
          },
          {
            id: 'va-7',
            kind: 'negative',
            name: 'Exclude',
            content: 'Do not summarize the narrative plot; focus strictly on editorial and visual critique.',
          },
        ],
      },
    ],
  },
  'visual-study': {
    key: 'visual-study',
    label: 'Visual Analyst (Two-Item Study)',
    description: 'Side-by-side comparison workflow for inspecting two reference items against strict criteria.',
    title: 'Visual Analyst — Two-Item Study',
    blocks: [
      {
        title: 'Overarching Request',
        type: 'Overarching Request',
        expanded: true,
        fields: [
          {
            id: 'vs-1',
            kind: 'text',
            name: 'Study Objective',
            content: 'Compare Item A and Item B side-by-side for material finish, alignment, and defect consistency.',
          },
        ],
      },
      {
        title: 'Items to Study',
        type: 'Reference Photos',
        expanded: true,
        fields: [
          {
            id: 'vs-2',
            kind: 'image',
            photoRole: 'Comparison Item',
            name: 'Item A (Baseline Prototype)',
            content: 'Approved golden sample used as the visual benchmark.',
            imageName: '',
            imageUrl: '',
          },
          {
            id: 'vs-3',
            kind: 'image',
            photoRole: 'Comparison Item',
            name: 'Item B (Production Sample)',
            content: 'New batch unit to inspect against Item A.',
            imageName: '',
            imageUrl: '',
          },
        ],
      },
      {
        title: 'Comparison Form',
        type: 'Custom Section',
        expanded: true,
        fields: [
          {
            id: 'vs-4',
            kind: 'text',
            name: 'Color & Surface Finish',
            content: 'Compare matte sheen, grain uniformity, and color shift under neutral lighting.',
          },
          {
            id: 'vs-5',
            kind: 'text',
            name: 'Seams & Proportions',
            content: 'Identify any stitching drift, gap variance, or asymmetric hardware placement.',
          },
        ],
      },
      {
        title: 'Constraints & Rules',
        type: 'Constraints',
        expanded: false,
        fields: [
          {
            id: 'vs-6',
            kind: 'positive',
            name: 'Report Format',
            content: 'Provide a structured comparison table followed by a clear Pass / Review verdict.',
          },
          {
            id: 'vs-7',
            kind: 'negative',
            name: 'Avoid',
            content: 'Do not estimate physical dimensions that are not visually verifiable from the photos.',
          },
        ],
      },
    ],
  },
  blank: {
    key: 'blank',
    label: 'Blank Pipeline',
    description: 'Start from a clean single-block pipeline and build your stack top-down.',
    title: 'Untitled Pipeline',
    blocks: [
      {
        title: 'Overarching Request',
        type: 'Overarching Request',
        expanded: true,
        fields: [
          {
            id: 'bl-1',
            kind: 'text',
            name: 'Request',
            content: '',
          },
        ],
      },
    ],
  },
};

export function instantiateTemplate(template: PipelineTemplate): {
  title: string;
  blocks: PipelineBlock[];
} {
  return {
    title: template.title,
    blocks: template.blocks.map((block) => ({
      ...block,
      id: createUid(),
      fields: block.fields.map((field) => ({
        ...field,
        id: createUid(),
      })),
    })),
  };
}
