export type FieldKind = 'text' | 'image' | 'positive' | 'negative';

export type PhotoRole =
  | 'Subject Ref'
  | 'Scene / Environment Ref'
  | 'Analysis-Only Ref'
  | 'Comparison Item'
  | 'Style / Lighting Ref';

export type BlockType =
  | 'Overarching Request'
  | 'Model & Task'
  | 'Concept & Scene'
  | 'Subject Details'
  | 'Reference Photos'
  | 'Constraints'
  | 'Audio / Voiceover'
  | 'Output Format'
  | 'Custom Section';

export type OutputFormat = 'markdown' | 'json' | 'yaml';

export interface PipelineField {
  id: string;
  kind: FieldKind;
  name: string;
  content: string;
  photoRole?: PhotoRole;
  imageName?: string;
  imageUrl?: string;
}

export interface PipelineBlock {
  id: string;
  title: string;
  type: BlockType;
  expanded: boolean;
  fields: PipelineField[];
}

export interface PipelineTemplate {
  key: string;
  label: string;
  description: string;
  title: string;
  isCustom?: boolean;
  blocks: Omit<PipelineBlock, 'id'>[];
}
