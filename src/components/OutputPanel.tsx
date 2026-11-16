import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { OutputFormat } from '../types/pipeline';

interface OutputPanelProps {
  compiledText: string;
  format: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  includeEmpty: boolean;
  onToggleIncludeEmpty: () => void;
  blockCount: number;
  fieldCount: number;
  photoRefCount: number;
  onDownload: () => void;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: 'markdown', label: 'Markdown', ext: '.md' },
  { value: 'json', label: 'JSON', ext: '.json' },
  { value: 'yaml', label: 'YAML', ext: '.yaml' },
];

export const OutputPanel: React.FC<OutputPanelProps> = ({
  compiledText,
  format,
  onFormatChange,
  includeEmpty,
  onToggleIncludeEmpty,
  blockCount,
  fieldCount,
  photoRefCount,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  const activeExt = FORMAT_OPTIONS.find((f) => f.value === format)?.ext || '.md';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard fallback ignored silently if blocked by browser permissions
    }
  };

  return (
    <aside className="flex flex-col rounded-xl border border-slate-200 bg-white lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Format Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Compiled Output
          </h2>
          <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
            <span aria-hidden="true"> · </span>
            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
            <span aria-hidden="true"> · </span>
            {photoRefCount} {photoRefCount === 1 ? 'photo ref' : 'photo refs'}
          </p>
        </div>

        {/* Segmented Control */}
        <div
          role="tablist"
          aria-label="Output format"
          className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
        >
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={format === opt.value}
              onClick={() => onFormatChange(opt.value)}
              className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                format === opt.value
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-toolbar: Include empty toggle + Copy / Download */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 select-none dark:text-slate-400">
          <input
            type="checkbox"
            checked={includeEmpty}
            onChange={onToggleIncludeEmpty}
            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <span>Include empty fields</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download {activeExt}</span>
          </button>
        </div>
      </div>

      {/* Live Code Preview */}
      <pre className="min-h-[320px] flex-1 overflow-auto p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
        {compiledText}
      </pre>
    </aside>
  );
};
