import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Copy,
  GripVertical,
  ImagePlus,
  MinusCircle,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BLOCK_TYPES, PHOTO_ROLES } from '../data/defaultTemplates';
import { BlockType, FieldKind, PhotoRole, PipelineBlock, PipelineField } from '../types/pipeline';

interface BlockCardProps {
  block: PipelineBlock;
  index: number;
  totalBlocks: number;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleExpand: (blockId: string) => void;
  onMoveBlock: (index: number, direction: -1 | 1) => void;
  onDuplicateBlock: (index: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlockTitle: (blockId: string, title: string) => void;
  onSwapBlockType: (blockId: string, type: BlockType) => void;
  onAddField: (blockId: string, kind: FieldKind) => void;
  onUpdateField: (blockId: string, fieldId: string, patch: Partial<PipelineField>) => void;
  onMoveField: (blockId: string, fieldIndex: number, direction: -1 | 1) => void;
  onRemoveField: (blockId: string, fieldId: string) => void;
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
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const stepNumber = String(index + 1).padStart(2, '0');
  const firstPopulatedField = block.fields.find((f) => f.content.trim() || f.imageName);
  const collapsedPreview = firstPopulatedField
    ? `${firstPopulatedField.name || 'Field'}: ${firstPopulatedField.content.trim() || firstPopulatedField.imageName}`
    : 'Empty block — click to add fields';

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
              {block.fields.map((field, fieldIndex) => (
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
                            nextKind === 'image' ? field.photoRole || 'Subject Ref' : field.photoRole,
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

                    {/* Semantic Signal (text + icon, never color-only) */}
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
                            onChange={(e) => handleImageUpload(field.id, e.target.files?.[0])}
                          />
                        </label>

                        {field.imageUrl ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={field.imageUrl}
                              alt={field.imageName || field.name || 'Attached reference'}
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
                    onChange={(e) =>
                      onUpdateField(block.id, field.id, { content: e.target.value })
                    }
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
                </div>
              ))}
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
