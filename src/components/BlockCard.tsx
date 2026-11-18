import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Copy,
  CornerDownLeft,
  Cpu,
  GripVertical,
  ImagePlus,
  Loader2,
  MinusCircle,
  Plus,
  SpellCheck2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BLOCK_TYPES, PHOTO_ROLES } from '../data/defaultTemplates';
import { AiFeatureConfig, SuggestedFieldPreset } from '../types/ai';
import {
  BlockType,
  FieldKind,
  PhotoRole,
  PipelineBlock,
  PipelineField,
} from '../types/pipeline';
import {
  checkSpelling,
  getContentAutoSuggestions,
  getFieldNameCompletions,
  getSuggestedFieldsForBlock,
} from '../utils/spellAndSuggestions';

interface BlockCardProps {
  block: PipelineBlock;
  index: number;
  totalBlocks: number;
  pipelineTitle: string;
  aiConfig: AiFeatureConfig;
  modelReady: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleExpand: (blockId: string) => void;
  onMoveBlock: (index: number, direction: -1 | 1) => void;
  onDuplicateBlock: (index: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlockTitle: (blockId: string, title: string) => void;
  onSwapBlockType: (blockId: string, type: BlockType) => void;
  onAddField: (
    blockId: string,
    kind: FieldKind,
    initial?: { name?: string; content?: string; photoRole?: PhotoRole }
  ) => void;
  onUpdateField: (blockId: string, fieldId: string, patch: Partial<PipelineField>) => void;
  onMoveField: (blockId: string, fieldIndex: number, direction: -1 | 1) => void;
  onRemoveField: (blockId: string, fieldId: string) => void;
  onRequestAiComplete: (ctx: {
    pipelineTitle: string;
    blockTitle: string;
    fieldName: string;
    currentText: string;
  }) => Promise<string>;
  onRequestAiSpellFix: (text: string) => Promise<string>;
  onRequestAiFieldSuggestions: (ctx: {
    pipelineTitle: string;
    blockTitle: string;
    blockType: string;
    existingFields: string[];
  }) => Promise<string[]>;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}

const KIND_LABELS: Record<FieldKind, string> = {
  text: 'Form Field',
  image: 'Photo Ref',
  positive: '+ Positive',
  negative: '- Negative',
};

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  index,
  totalBlocks,
  pipelineTitle,
  aiConfig,
  modelReady,
  isDragging,
  isDragOver,
  onToggleExpand,
  onMoveBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onUpdateBlockTitle,
  onSwapBlockType,
  onAddField,
  onUpdateField,
  onMoveField,
  onRemoveField,
  onRequestAiComplete,
  onRequestAiSpellFix,
  onRequestAiFieldSuggestions,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [focusedNameFieldId, setFocusedNameFieldId] = useState<string | null>(null);
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(() => new Set());

  // Neural AI suggestion states per field
  const [aiCompletions, setAiCompletions] = useState<Record<string, string>>({});
  const [aiCompletingId, setAiCompletingId] = useState<string | null>(null);
  const [aiSpellFixes, setAiSpellFixes] = useState<Record<string, string>>({});
  const [aiSpellLoadingId, setAiSpellLoadingId] = useState<string | null>(null);

  // Neural AI field name suggestions for this block
  const [aiFieldIdeas, setAiFieldIdeas] = useState<string[]>([]);
  const [aiFieldIdeasLoading, setAiFieldIdeasLoading] = useState<boolean>(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const stepNumber = String(index + 1).padStart(2, '0');
  const firstPopulatedField = block.fields.find((f) => f.content.trim() || f.imageName);
  const collapsedPreview = firstPopulatedField
    ? `${firstPopulatedField.name || 'Field'}: ${firstPopulatedField.content.trim() || firstPopulatedField.imageName}`
    : 'Empty block — click to add fields';

  const existingFieldNames = useMemo(
    () => block.fields.map((f) => f.name),
    [block.fields]
  );

  const curatedFieldSuggestions: SuggestedFieldPreset[] = useMemo(() => {
    if (!aiConfig.enabled || !aiConfig.fieldSuggestions) return [];
    return getSuggestedFieldsForBlock(block.type, existingFieldNames);
  }, [aiConfig.enabled, aiConfig.fieldSuggestions, block.type, existingFieldNames]);

  const handleImageUpload = (fieldId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = typeof ev.target?.result === 'string' ? ev.target.result : '';
      onUpdateField(block.id, fieldId, {
        imageName: file.name,
        imageUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerNeuralCompletion = async (field: PipelineField) => {
    if (!modelReady || !field.content.trim()) return;
    setAiCompletingId(field.id);
    try {
      const completion = await onRequestAiComplete({
        pipelineTitle,
        blockTitle: block.title || block.type,
        fieldName: field.name,
        currentText: field.content,
      });
      if (completion && completion.trim()) {
        setAiCompletions((prev) => ({ ...prev, [field.id]: completion.trim() }));
      }
    } catch {
      // Errors surfaced at assistant bar level
    } finally {
      setAiCompletingId((curr) => (curr === field.id ? null : curr));
    }
  };

  const handleContentChange = (field: PipelineField, nextValue: string) => {
    onUpdateField(block.id, field.id, { content: nextValue });

    if (aiCompletions[field.id]) {
      setAiCompletions((prev) => {
        const copy = { ...prev };
        delete copy[field.id];
        return copy;
      });
    }
    if (aiSpellFixes[field.id]) {
      setAiSpellFixes((prev) => {
        const copy = { ...prev };
        delete copy[field.id];
        return copy;
      });
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (
      aiConfig.enabled &&
      aiConfig.autoComplete &&
      modelReady &&
      nextValue.trim().length >= 12
    ) {
      debounceRef.current = window.setTimeout(() => {
        void triggerNeuralCompletion({ ...field, content: nextValue });
      }, 650);
    }
  };

  const applyNeuralCompletion = (field: PipelineField, snippet: string) => {
    const base = field.content.trimEnd();
    const cleaned = snippet.trim();
    if (!cleaned) return;
    const next =
      cleaned.toLowerCase().startsWith(base.toLowerCase())
        ? cleaned
        : `${base}${base ? ' ' : ''}${cleaned}`;
    onUpdateField(block.id, field.id, { content: next });
    setAiCompletions((prev) => {
      const copy = { ...prev };
      delete copy[field.id];
      return copy;
    });
  };

  const triggerNeuralSpellFix = async (field: PipelineField) => {
    if (!modelReady || !field.content.trim()) return;
    setAiSpellLoadingId(field.id);
    try {
      const fixed = await onRequestAiSpellFix(field.content);
      if (fixed && fixed.trim() && fixed.trim() !== field.content.trim()) {
        setAiSpellFixes((prev) => ({ ...prev, [field.id]: fixed.trim() }));
      }
    } catch {
      // ignore
    } finally {
      setAiSpellLoadingId((curr) => (curr === field.id ? null : curr));
    }
  };

  const triggerNeuralFieldIdeas = async () => {
    if (!modelReady) return;
    setAiFieldIdeasLoading(true);
    try {
      const ideas = await onRequestAiFieldSuggestions({
        pipelineTitle,
        blockTitle: block.title,
        blockType: block.type,
        existingFields: existingFieldNames.filter(Boolean),
      });
      setAiFieldIdeas(ideas);
    } catch {
      // ignore
    } finally {
      setAiFieldIdeasLoading(false);
    }
  };

  const applySpellingReplacement = (
    field: PipelineField,
    issueIndex: number,
    issueLength: number,
    replacement: string
  ) => {
    const before = field.content.slice(0, issueIndex);
    const after = field.content.slice(issueIndex + issueLength);
    onUpdateField(block.id, field.id, { content: `${before}${replacement}${after}` });
  };

  const handleIgnoreWord = (word: string) => {
    setIgnoredWords((prev) => {
      const next = new Set(prev);
      next.add(word.toLowerCase());
      return next;
    });
  };

  return (
    <article
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`rounded-xl border bg-white transition-colors duration-150 dark:bg-slate-900 ${
        isDragOver
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      {/* Collapsed / Clickable Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={block.expanded}
        onClick={() => onToggleExpand(block.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand(block.id);
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left select-none focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="hidden cursor-grab text-slate-400 hover:text-slate-600 sm:inline-flex dark:text-slate-600 dark:hover:text-slate-400"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>

          <span className="font-mono text-xs font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
            {stepNumber}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {block.title.trim() || block.type}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {block.type}
                <span aria-hidden="true"> · </span>
                <span className="tabular-nums">
                  {block.fields.length} {block.fields.length === 1 ? 'field' : 'fields'}
                </span>
              </span>
            </div>

            {!block.expanded && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {collapsedPreview}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onMoveBlock(index, -1)}
            disabled={index === 0}
            aria-label="Move block up"
            title="Move up"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveBlock(index, 1)}
            disabled={index === totalBlocks - 1}
            aria-label="Move block down"
            title="Move down"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateBlock(index)}
            aria-label="Duplicate block"
            title="Duplicate block"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveBlock(block.id)}
            aria-label="Delete block"
            title="Delete block"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 dark:text-slate-400 dark:hover:bg-red-950/50 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleExpand(block.id)}
            aria-label={block.expanded ? 'Collapse block' : 'Expand block'}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                block.expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {block.expanded && (
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          {/* Block Title & Type Swap */}
          <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Block Name
              </label>
              <input
                type="text"
                value={block.title}
                onChange={(e) => onUpdateBlockTitle(block.id, e.target.value)}
                placeholder="Section title..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Block Type
              </label>
              <select
                value={block.type}
                onChange={(e) => onSwapBlockType(block.id, e.target.value as BlockType)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {BLOCK_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Key-Value Form Fields */}
          {block.fields.length === 0 ? (
            <div className="border-t border-dashed border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No fields in this block yet. Add a form field, photo reference, or rule below.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {block.fields.map((field, fieldIndex) => {
                const nameSuggestions =
                  aiConfig.enabled &&
                  aiConfig.autoComplete &&
                  focusedNameFieldId === field.id
                    ? getFieldNameCompletions(field.name)
                    : [];

                const contentSuggestions =
                  aiConfig.enabled &&
                  aiConfig.autoComplete &&
                  focusedFieldId === field.id
                    ? getContentAutoSuggestions(field.content)
                    : [];

                const neuralCompletion = aiCompletions[field.id];
                const spellingIssues =
                  aiConfig.enabled && aiConfig.spellCheck
                    ? checkSpelling(field.content, ignoredWords)
                    : [];
                const aiSpellFix = aiSpellFixes[field.id];

                return (
                  <div key={field.id} className="py-3.5 first:pt-3.5 last:pb-2">
                    {/* Top Row: Kind + Field Name + Row Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Field type"
                        value={field.kind}
                        onChange={(e) => {
                          const nextKind = e.target.value as FieldKind;
                          onUpdateField(block.id, field.id, {
                            kind: nextKind,
                            photoRole:
                              nextKind === 'image'
                                ? field.photoRole || 'Subject Ref'
                                : field.photoRole,
                          });
                        }}
                        className="h-9 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                      >
                        {(Object.keys(KIND_LABELS) as FieldKind[]).map((k) => (
                          <option key={k} value={k}>
                            {KIND_LABELS[k]}
                          </option>
                        ))}
                      </select>

                      {field.kind === 'positive' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Include</span>
                        </span>
                      )}
                      {field.kind === 'negative' && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <MinusCircle className="h-3.5 w-3.5" />
                          <span>Exclude</span>
                        </span>
                      )}

                      <input
                        type="text"
                        value={field.name}
                        onFocus={() => setFocusedNameFieldId(field.id)}
                        onBlur={() =>
                          window.setTimeout(
                            () =>
                              setFocusedNameFieldId((curr) =>
                                curr === field.id ? null : curr
                              ),
                            150
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' && nameSuggestions.length > 0) {
                            e.preventDefault();
                            onUpdateField(block.id, field.id, {
                              name: nameSuggestions[0],
                            });
                          }
                        }}
                        onChange={(e) =>
                          onUpdateField(block.id, field.id, { name: e.target.value })
                        }
                        placeholder={
                          field.kind === 'image'
                            ? 'Reference label (e.g., Watch Closeup)'
                            : 'Field name (e.g., Subject Outfit)'
                        }
                        className="h-9 min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                      />

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onMoveField(block.id, fieldIndex, -1)}
                          disabled={fieldIndex === 0}
                          aria-label="Move field up"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveField(block.id, fieldIndex, 1)}
                          disabled={fieldIndex === block.fields.length - 1}
                          aria-label="Move field down"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveField(block.id, field.id)}
                          aria-label="Remove field"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Field Name Auto-Completions */}
                    {nameSuggestions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Suggestions:
                        </span>
                        {nameSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onUpdateField(block.id, field.id, { name: suggestion });
                            }}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                          >
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Photo Ref Controls */}
                    {field.kind === 'image' && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950/70">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Role:
                          </label>
                          <select
                            value={field.photoRole || 'Subject Ref'}
                            onChange={(e) =>
                              onUpdateField(block.id, field.id, {
                                photoRole: e.target.value as PhotoRole,
                              })
                            }
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {PHOTO_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-2.5">
                          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                            <Upload className="h-3.5 w-3.5" />
                            <span>{field.imageUrl ? 'Replace Photo' : 'Attach Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) =>
                                handleImageUpload(field.id, e.target.files?.[0])
                              }
                            />
                          </label>

                          {field.imageUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={field.imageUrl}
                                alt={
                                  field.imageName || field.name || 'Attached reference'
                                }
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                              />
                              <span className="max-w-[180px] truncate font-mono text-xs text-amber-700 dark:text-amber-400">
                                {field.imageName}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateField(block.id, field.id, {
                                    imageName: '',
                                    imageUrl: '',
                                  })
                                }
                                aria-label="Clear attached photo"
                                className="rounded p-1 text-slate-400 hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                              <ImagePlus className="h-3.5 w-3.5" />
                              <span>No photo attached</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Field Content Textarea */}
                    <textarea
                      rows={2}
                      value={field.content}
                      onFocus={() => setFocusedFieldId(field.id)}
                      onBlur={() =>
                        window.setTimeout(
                          () =>
                            setFocusedFieldId((curr) =>
                              curr === field.id ? null : curr
                            ),
                          180
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && neuralCompletion) {
                          e.preventDefault();
                          applyNeuralCompletion(field, neuralCompletion);
                        } else if (
                          e.key === 'Tab' &&
                          !neuralCompletion &&
                          contentSuggestions.length > 0
                        ) {
                          e.preventDefault();
                          onUpdateField(block.id, field.id, {
                            content: contentSuggestions[0],
                          });
                        } else if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
                          e.preventDefault();
                          void triggerNeuralCompletion(field);
                        }
                      }}
                      onChange={(e) => handleContentChange(field, e.target.value)}
                      placeholder={
                        field.kind === 'image'
                          ? 'Instructions for how the model should interpret this reference...'
                          : field.kind === 'positive'
                            ? 'Required element, framing, or formatting rule...'
                            : field.kind === 'negative'
                              ? 'Artifacts, elements, or behaviors to exclude...'
                              : 'Enter field content...'
                      }
                      className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                    />

                    {/* Assistant Controls & Inline Feedback (Spell Check + Auto-Completion) */}
                    {aiConfig.enabled && (
                      <div className="mt-1.5 space-y-1.5">
                        {/* Instant / Neural Auto-Completion Row */}
                        {aiConfig.autoComplete &&
                          (neuralCompletion ||
                            contentSuggestions.length > 0 ||
                            (modelReady && focusedFieldId === field.id && field.content.trim().length > 2)) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {neuralCompletion && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    applyNeuralCompletion(field, neuralCompletion);
                                  }}
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-left text-xs text-indigo-800 transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
                                >
                                  <CornerDownLeft className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{neuralCompletion}</span>
                                  <span className="shrink-0 font-mono text-[11px] opacity-75">
                                    Tab
                                  </span>
                                </button>
                              )}

                              {contentSuggestions.map((phrase) => (
                                <button
                                  key={phrase}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    onUpdateField(block.id, field.id, { content: phrase });
                                  }}
                                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-left text-xs text-slate-700 transition-colors hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                                >
                                  <span className="truncate">{phrase}</span>
                                </button>
                              ))}

                              {modelReady &&
                                focusedFieldId === field.id &&
                                field.content.trim().length >= 3 && (
                                  <button
                                    type="button"
                                    disabled={aiCompletingId === field.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      void triggerNeuralCompletion(field);
                                    }}
                                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-400"
                                  >
                                    {aiCompletingId === field.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Cpu className="h-3 w-3" />
                                    )}
                                    <span>AI Complete</span>
                                  </button>
                                )}
                            </div>
                          )}

                        {/* Spell Check Issues & AI Spelling Fix */}
                        {aiConfig.spellCheck &&
                          (spellingIssues.length > 0 ||
                            aiSpellFix ||
                            (modelReady &&
                              focusedFieldId === field.id &&
                              field.content.trim().length > 6)) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                              {spellingIssues.map((issue) => (
                                <div
                                  key={`${issue.index}-${issue.word}`}
                                  className="inline-flex flex-wrap items-center gap-1.5"
                                >
                                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                                    <SpellCheck2 className="h-3.5 w-3.5" />
                                    <span className="line-through">{issue.word}</span>
                                    <span aria-hidden="true">→</span>
                                  </span>
                                  {issue.suggestions.map((fix) => (
                                    <button
                                      key={fix}
                                      type="button"
                                      onClick={() =>
                                        applySpellingReplacement(
                                          field,
                                          issue.index,
                                          issue.length,
                                          fix
                                        )
                                      }
                                      className="whitespace-nowrap rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60"
                                    >
                                      {fix}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => handleIgnoreWord(issue.word)}
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                  >
                                    Ignore
                                  </button>
                                </div>
                              ))}

                              {modelReady &&
                                focusedFieldId === field.id &&
                                field.content.trim().length > 6 && (
                                  <button
                                    type="button"
                                    disabled={aiSpellLoadingId === field.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      void triggerNeuralSpellFix(field);
                                    }}
                                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-400"
                                  >
                                    {aiSpellLoadingId === field.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <SpellCheck2 className="h-3 w-3" />
                                    )}
                                    <span>AI Spell Fix</span>
                                  </button>
                                )}

                              {aiSpellFix && (
                                <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                                  <span>Suggested: {aiSpellFix}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateField(block.id, field.id, {
                                        content: aiSpellFix,
                                      });
                                      setAiSpellFixes((prev) => {
                                        const copy = { ...prev };
                                        delete copy[field.id];
                                        return copy;
                                      });
                                    }}
                                    className="font-semibold underline hover:no-underline"
                                  >
                                    Apply
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Contextual Field Suggestions Strip */}
          {aiConfig.enabled &&
            aiConfig.fieldSuggestions &&
            (curatedFieldSuggestions.length > 0 || aiFieldIdeas.length > 0 || modelReady) && (
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Suggested fields for {block.type}
                  </span>
                  {modelReady && (
                    <button
                      type="button"
                      disabled={aiFieldIdeasLoading}
                      onClick={() => void triggerNeuralFieldIdeas()}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {aiFieldIdeasLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Cpu className="h-3 w-3" />
                      )}
                      <span>Generate with AI</span>
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {curatedFieldSuggestions.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        onAddField(block.id, preset.kind, {
                          name: preset.name,
                          content: preset.starterContent,
                          photoRole: preset.photoRole,
                        })
                      }
                      title={preset.starterContent}
                      className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{preset.name}</span>
                    </button>
                  ))}

                  {aiFieldIdeas.map((idea) => (
                    <button
                      key={`ai-${idea}`}
                      type="button"
                      onClick={() => {
                        onAddField(block.id, 'text', { name: idea, content: '' });
                        setAiFieldIdeas((prev) => prev.filter((item) => item !== idea));
                      }}
                      className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50/70 px-2.5 text-xs font-medium text-indigo-800 transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{idea}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Add Field Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onAddField(block.id, 'text')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Form Field</span>
            </button>
            <button
              type="button"
              onClick={() => onAddField(block.id, 'image')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Photo Ref</span>
            </button>
            <button
              type="button"
              onClick={() => onAddField(block.id, 'positive')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Positive Rule</span>
            </button>
            <button
              type="button"
              onClick={() => onAddField(block.id, 'negative')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Negative Rule</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
