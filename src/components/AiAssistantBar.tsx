import React from 'react';
import {
  AlertCircle,
  Cpu,
  ListPlus,
  Loader2,
  Power,
  SpellCheck2,
  TextCursorInput,
  X,
} from 'lucide-react';
import {
  AiFeatureConfig,
  AiModelStatus,
  LIGHTWEIGHT_MODELS,
  LightweightModelId,
} from '../types/ai';

interface AiAssistantBarProps {
  isOpen: boolean;
  config: AiFeatureConfig;
  modelStatus: AiModelStatus;
  loadedModelId: LightweightModelId | null;
  progress: number;
  progressFile: string;
  error: string | null;
  onClose: () => void;
  onUpdateConfig: (patch: Partial<AiFeatureConfig>) => void;
  onLoadModel: (modelId: LightweightModelId) => void;
  onUnloadModel: () => void;
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  isOpen,
  config,
  modelStatus,
  loadedModelId,
  progress,
  progressFile,
  error,
  onClose,
  onUpdateConfig,
  onLoadModel,
  onUnloadModel,
}) => {
  if (!isOpen) return null;

  const selectedSpec =
    LIGHTWEIGHT_MODELS.find((m) => m.id === config.modelId) || LIGHTWEIGHT_MODELS[0];
  const isLoadedSameModel =
    modelStatus === 'ready' && loadedModelId === config.modelId;

  return (
    <section
      aria-label="Lightweight AI assistant settings"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Lightweight On-Device Assistant
              </h2>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Under 82M params
                <span aria-hidden="true"> · </span>
                Quantized ONNX (q8)
                <span aria-hidden="true"> · </span>
                Runs in Web Worker
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {selectedSpec.strength}. Instant dictionary spell-check and block field suggestions work immediately; load the local neural model for AI completions and custom field generation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Hide AI Assistant panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Model Selector & Feature Toggles */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <label
            htmlFor="local-ai-model-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Model
          </label>
          <select
            id="local-ai-model-select"
            value={config.modelId}
            disabled={modelStatus === 'loading'}
            onChange={(e) =>
              onUpdateConfig({ modelId: e.target.value as LightweightModelId })
            }
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {LIGHTWEIGHT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.paramsLabel} · {m.approxDownloadLabel}
              </option>
            ))}
          </select>

          {modelStatus === 'loading' ? (
            <button
              type="button"
              disabled
              className="inline-flex h-9 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="tabular-nums">Loading {progress}%</span>
            </button>
          ) : isLoadedSameModel ? (
            <button
              type="button"
              onClick={onUnloadModel}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Power className="h-3.5 w-3.5 text-emerald-500" />
              <span>Unload Model</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onLoadModel(config.modelId)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>
                {modelStatus === 'ready' ? 'Switch & Load Model' : 'Load Local Model'}
              </span>
            </button>
          )}

          {modelStatus === 'ready' && loadedModelId && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Active: {LIGHTWEIGHT_MODELS.find((m) => m.id === loadedModelId)?.name} (
              {LIGHTWEIGHT_MODELS.find((m) => m.id === loadedModelId)?.paramsLabel})
            </span>
          )}
        </div>

        {/* Granular Assistant Capabilities */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.spellCheck}
              onChange={(e) => onUpdateConfig({ spellCheck: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <SpellCheck2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Spell Check</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.autoComplete}
              onChange={(e) => onUpdateConfig({ autoComplete: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <TextCursorInput className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Auto-Complete</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 select-none dark:text-slate-300">
            <input
              type="checkbox"
              checked={config.fieldSuggestions}
              onChange={(e) => onUpdateConfig({ fieldSuggestions: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <ListPlus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Field Suggestions</span>
          </label>
        </div>
      </div>

      {/* Download Progress Bar */}
      {modelStatus === 'loading' && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate font-mono">{progressFile || 'Downloading weights...'}</span>
            <span className="tabular-nums font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600 transition-transform duration-150 dark:bg-indigo-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Honest Error Feedback */}
      {modelStatus === 'error' && error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Could not load local ONNX model ({error}). Instant spell-check and curated field suggestions remain active.
          </span>
        </div>
      )}
    </section>
  );
};
