import React, { useEffect, useMemo, useState } from 'react';
import {
  BookmarkPlus,
  ChevronsDownUp,
  ChevronsUpDown,
  Cpu,
  Download,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
} from 'lucide-react';
import { AiAssistantBar } from './components/AiAssistantBar';
import { BlockCard } from './components/BlockCard';
import { InsertConnector } from './components/InsertConnector';
import { OutputPanel } from './components/OutputPanel';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { createUid, DEFAULT_TEMPLATES, instantiateTemplate } from './data/defaultTemplates';
import { useLocalAi } from './hooks/useLocalAi';
import { AiFeatureConfig } from './types/ai';
import {
  BlockType,
  FieldKind,
  OutputFormat,
  PhotoRole,
  PipelineBlock,
  PipelineField,
  PipelineTemplate,
} from './types/pipeline';
import { compilePipelineOutput } from './utils/compileOutput';

const CUSTOM_TEMPLATES_STORAGE_KEY = 'pipeline_studio_custom_templates_v1';
const DELETED_BUILTINS_STORAGE_KEY = 'pipeline_studio_deleted_builtins_v1';
const DRAFT_STORAGE_KEY = 'pipeline_studio_draft_v1';
const THEME_STORAGE_KEY = 'pipeline_studio_theme_v1';
const AI_CONFIG_STORAGE_KEY = 'pipeline_studio_ai_config_v1';

const QUICK_NAV_KEYS = ['video-gen', 'video-analyst', 'visual-study', 'blank'] as const;

const DEFAULT_AI_CONFIG: AiFeatureConfig = {
  enabled: false,
  modelId: 'Xenova/t5-small',
  spellCheck: true,
  autoComplete: true,
  fieldSuggestions: true,
};

function loadCustomTemplates(): Record<string, PipelineTemplate> {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadDeletedBuiltIns(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_BUILTINS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadAiConfig(): AiFeatureConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_AI_CONFIG;
}

function loadInitialDraft(): {
  templateKey: string;
  title: string;
  blocks: PipelineBlock[];
} {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.blocks)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default template
  }
  return {
    templateKey: 'video-gen',
    ...instantiateTemplate(DEFAULT_TEMPLATES['video-gen']),
  };
}

export default function App() {
  const [customTemplates, setCustomTemplates] = useState<Record<string, PipelineTemplate>>(
    () => loadCustomTemplates()
  );
  const [deletedBuiltInKeys, setDeletedBuiltInKeys] = useState<string[]>(() =>
    loadDeletedBuiltIns()
  );

  const initialDraft = useMemo(() => loadInitialDraft(), []);
  const [templateKey, setTemplateKey] = useState<string>(initialDraft.templateKey);
  const [pipelineTitle, setPipelineTitle] = useState<string>(initialDraft.title);
  const [blocks, setBlocks] = useState<PipelineBlock[]>(initialDraft.blocks);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [includeEmpty, setIncludeEmpty] = useState<boolean>(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [aiConfig, setAiConfig] = useState<AiFeatureConfig>(() => loadAiConfig());
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(false);

  const localAi = useLocalAi();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(aiConfig));
    } catch {
      // ignore
    }
  }, [aiConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ templateKey, title: pipelineTitle, blocks })
      );
    } catch {
      try {
        const strippedBlocks = blocks.map((b) => ({
          ...b,
          fields: b.fields.map((f) => ({ ...f, imageUrl: '' })),
        }));
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ templateKey, title: pipelineTitle, blocks: strippedBlocks })
        );
      } catch {
        // ignore
      }
    }
  }, [templateKey, pipelineTitle, blocks]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const builtInTemplates = useMemo(() => {
    const entries: Record<string, PipelineTemplate> = {};
    Object.entries(DEFAULT_TEMPLATES).forEach(([key, tpl]) => {
      if (!deletedBuiltInKeys.includes(key)) {
        entries[key] = tpl;
      }
    });
    return entries;
  }, [deletedBuiltInKeys]);

  const allTemplates = useMemo(
    () => ({ ...builtInTemplates, ...customTemplates }),
    [builtInTemplates, customTemplates]
  );

  const activeTemplate = allTemplates[templateKey];

  const compiledOutput = useMemo(
    () => compilePipelineOutput(pipelineTitle, blocks, outputFormat, { includeEmpty }),
    [pipelineTitle, blocks, outputFormat, includeEmpty]
  );

  const stats = useMemo(() => {
    let fieldCount = 0;
    let photoRefCount = 0;
    blocks.forEach((b) => {
      fieldCount += b.fields.length;
      b.fields.forEach((f) => {
        if (f.kind === 'image') photoRefCount += 1;
      });
    });
    return { blockCount: blocks.length, fieldCount, photoRefCount };
  }, [blocks]);

  const selectTemplate = (key: string) => {
    const tpl = allTemplates[key];
    if (!tpl) return;
    const next = instantiateTemplate(tpl);
    setTemplateKey(key);
    setPipelineTitle(next.title);
    setBlocks(next.blocks);
    setConfirmDeleteTemplate(false);
  };

  const handleSaveCustomTemplate = (name: string, description: string) => {
    const key = `custom-${createUid()}`;
    const newTemplate: PipelineTemplate = {
      key,
      label: name,
      description: description || 'Saved custom pipeline stack.',
      title: name,
      isCustom: true,
      blocks: blocks.map((b) => ({
        title: b.title,
        type: b.type,
        expanded: b.expanded,
        fields: b.fields.map((f) => ({
          ...f,
          imageUrl: '',
        })),
      })),
    };

    const nextCustom = { ...customTemplates, [key]: newTemplate };
    setCustomTemplates(nextCustom);
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(nextCustom));
    } catch {
      // ignore
    }
    setTemplateKey(key);
    setPipelineTitle(name);
    setIsSaveModalOpen(false);
    setConfirmDeleteTemplate(false);
    setNotice(`Saved "${name}" to templates`);
  };

  const handleDeleteTemplate = () => {
    const remainingKeys = Object.keys(allTemplates).filter((k) => k !== templateKey);
    if (remainingKeys.length === 0) return;

    const deletedLabel = activeTemplate?.label || 'Template';

    if (activeTemplate?.isCustom) {
      const nextCustom = { ...customTemplates };
      delete nextCustom[templateKey];
      setCustomTemplates(nextCustom);
      try {
        localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(nextCustom));
      } catch {
        // ignore
      }
    } else if (DEFAULT_TEMPLATES[templateKey]) {
      const nextDeleted = Array.from(new Set([...deletedBuiltInKeys, templateKey]));
      setDeletedBuiltInKeys(nextDeleted);
      try {
        localStorage.setItem(DELETED_BUILTINS_STORAGE_KEY, JSON.stringify(nextDeleted));
      } catch {
        // ignore
      }
    }

    const fallbackKey = remainingKeys[0];
    const fallbackTpl = allTemplates[fallbackKey];
    if (fallbackTpl) {
      const next = instantiateTemplate(fallbackTpl);
      setTemplateKey(fallbackKey);
      setPipelineTitle(next.title);
      setBlocks(next.blocks);
    }

    setConfirmDeleteTemplate(false);
    setNotice(`Deleted "${deletedLabel}"`);
  };

  const handleRestoreBuiltInTemplates = () => {
    setDeletedBuiltInKeys([]);
    try {
      localStorage.removeItem(DELETED_BUILTINS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setConfirmDeleteTemplate(false);
    setNotice('Restored built-in templates');
  };

  const handleResetTemplate = () => {
    const tpl =
      allTemplates[templateKey] ||
      Object.values(allTemplates)[0] ||
      DEFAULT_TEMPLATES['blank'];
    const next = instantiateTemplate(tpl);
    setPipelineTitle(next.title);
    setBlocks(next.blocks);
    setNotice(`Reset to "${tpl.label}"`);
  };

  const handleExpandCollapseAll = (expanded: boolean) => {
    setBlocks((prev) => prev.map((b) => ({ ...b, expanded })));
  };

  const handleToggleBlock = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, expanded: !b.expanded } : b))
    );
  };

  const handleInsertBlockAt = (insertIndex: number) => {
    const newBlock: PipelineBlock = {
      id: createUid(),
      title: 'Custom Section',
      type: 'Custom Section',
      expanded: true,
      fields: [
        {
          id: createUid(),
          kind: 'text',
          name: '',
          content: '',
        },
      ],
    };
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(insertIndex, 0, newBlock);
      return next;
    });
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleDuplicateBlock = (index: number) => {
    const source = blocks[index];
    if (!source) return;
    const clone: PipelineBlock = {
      ...source,
      id: createUid(),
      title: `${source.title || source.type} (Copy)`,
      expanded: true,
      fields: source.fields.map((f) => ({ ...f, id: createUid() })),
    };
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleUpdateBlockTitle = (blockId: string, title: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title } : b))
    );
  };

  const handleSwapBlockType = (blockId: string, type: BlockType) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const shouldSyncTitle = b.title === b.type || !b.title.trim();
        return {
          ...b,
          type,
          title: shouldSyncTitle ? type : b.title,
        };
      })
    );
  };

  const handleAddField = (
    blockId: string,
    kind: FieldKind,
    initial?: { name?: string; content?: string; photoRole?: PhotoRole }
  ) => {
    const newField: PipelineField = {
      id: createUid(),
      kind,
      name: initial?.name || '',
      content: initial?.content || '',
      ...(kind === 'image'
        ? {
            photoRole: initial?.photoRole || 'Subject Ref',
            imageName: '',
            imageUrl: '',
          }
        : {}),
    };
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, expanded: true, fields: [...b.fields, newField] } : b
      )
    );
  };

  const handleUpdateField = (
    blockId: string,
    fieldId: string,
    patch: Partial<PipelineField>
  ) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              fields: b.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
            }
          : b
      )
    );
  };

  const handleMoveField = (blockId: string, fieldIndex: number, direction: -1 | 1) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const target = fieldIndex + direction;
        if (target < 0 || target >= b.fields.length) return b;
        const nextFields = [...b.fields];
        [nextFields[fieldIndex], nextFields[target]] = [
          nextFields[target],
          nextFields[fieldIndex],
        ];
        return { ...b, fields: nextFields };
      })
    );
  };

  const handleRemoveField = (blockId: string, fieldId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, fields: b.fields.filter((f) => f.id !== fieldId) }
          : b
      )
    );
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex !== null && dragIndex !== dropIndex) {
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(dropIndex, 0, moved);
        return next;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDownloadOutput = () => {
    const extMap: Record<OutputFormat, string> = {
      markdown: 'md',
      json: 'json',
      yaml: 'yaml',
    };
    const mimeMap: Record<OutputFormat, string> = {
      markdown: 'text/markdown',
      json: 'application/json',
      yaml: 'text/yaml',
    };
    const slug = (pipelineTitle || 'pipeline')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const blob = new Blob([compiledOutput], { type: mimeMap[outputFormat] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slug || 'pipeline'}.${extMap[outputFormat]}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleAiAssistant = () => {
    setAiConfig((prev) => {
      const nextEnabled = !prev.enabled;
      if (nextEnabled) setIsAiPanelOpen(true);
      else setIsAiPanelOpen(false);
      return { ...prev, enabled: nextEnabled };
    });
  };

  const builtInEntries = Object.values(builtInTemplates);
  const customTemplateEntries = Object.values(customTemplates);
  const totalTemplatesCount = Object.keys(allTemplates).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
      {/* Three-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-slate-100"
          >
            <svg
              className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="16" height="5" rx="1.5" />
              <path d="M12 8v3" />
              <rect x="4" y="11" width="16" height="5" rx="1.5" />
              <path d="M12 16v3" />
              <path d="M9 19h6" />
            </svg>
            <span>Pipeline Studio</span>
          </a>

          {/* Zone 2: Preset Quick-Links */}
          <nav
            aria-label="Pipeline presets"
            className="hidden items-center gap-6 md:flex"
          >
            {QUICK_NAV_KEYS.filter((key) => Boolean(allTemplates[key])).map((key) => {
              const tpl = allTemplates[key];
              const isActive = templateKey === key;
              const shortNames: Record<string, string> = {
                'video-gen': 'Video Gen',
                'video-analyst': 'Video Analyst',
                'visual-study': 'Visual Study',
                blank: 'Blank Canvas',
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTemplate(key)}
                  className={`whitespace-nowrap shrink-0 border-b-2 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-slate-900 dark:border-indigo-400 dark:text-slate-100'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {shortNames[key] || tpl.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleDownloadOutput}
              className="inline-flex h-9 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Pipeline</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* Workspace Toolbar */}
        <section
          aria-label="Template and view controls"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="template-selector"
              className="text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Template
            </label>
            <select
              id="template-selector"
              value={allTemplates[templateKey] ? templateKey : ''}
              onChange={(e) => selectTemplate(e.target.value)}
              className="h-9 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {builtInEntries.length > 0 && (
                <optgroup label="Built-in Pipelines">
                  {builtInEntries.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {customTemplateEntries.length > 0 && (
                <optgroup label="Saved Custom Templates">
                  {customTemplateEntries.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Save as Template</span>
            </button>

            {/* Delete Option for ANY Selected Template */}
            {activeTemplate &&
              totalTemplatesCount > 1 &&
              (confirmDeleteTemplate ? (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 dark:border-red-900/60 dark:bg-red-950/30">
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">
                    Delete template?
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteTemplate}
                    className="whitespace-nowrap rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteTemplate(false)}
                    className="whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTemplate(true)}
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Template</span>
                </button>
              ))}

            {deletedBuiltInKeys.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreBuiltInTemplates}
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore Defaults</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetTemplate}
              title="Reset blocks to selected template defaults"
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {notice && (
              <span
                role="status"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                {notice}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Opt-In Lightweight AI Assistant (<82M) Control */}
            <button
              type="button"
              onClick={() => {
                if (!aiConfig.enabled) {
                  handleToggleAiAssistant();
                } else {
                  setIsAiPanelOpen((v) => !v);
                }
              }}
              aria-expanded={isAiPanelOpen}
              className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                aiConfig.enabled
                  ? 'border-indigo-500/60 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/50 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950/80'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>
                {aiConfig.enabled
                  ? localAi.status === 'ready'
                    ? 'AI Active (<82M)'
                    : 'AI Assistant On'
                  : 'Add AI Assistant (<82M)'}
              </span>
            </button>

            {aiConfig.enabled && (
              <button
                type="button"
                onClick={handleToggleAiAssistant}
                className="inline-flex h-9 items-center whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Disable AI
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExpandCollapseAll(true)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              onClick={() => handleExpandCollapseAll(false)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronsDownUp className="h-3.5 w-3.5" />
              <span>Collapse All</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </section>

        {/* Collapsible Lightweight <82M AI Model Bar */}
        <AiAssistantBar
          isOpen={isAiPanelOpen && aiConfig.enabled}
          config={aiConfig}
          modelStatus={localAi.status}
          loadedModelId={localAi.loadedModelId}
          progress={localAi.progress}
          progressFile={localAi.progressFile}
          error={localAi.error}
          onClose={() => setIsAiPanelOpen(false)}
          onUpdateConfig={(patch) =>
            setAiConfig((prev) => ({ ...prev, ...patch }))
          }
          onLoadModel={(modelId) => {
            void localAi.loadModel(modelId);
          }}
          onUnloadModel={localAi.unloadModel}
        />

        {/* Two-Column Split: Top-Down Pipeline Stack + Live Compiled Output */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.25fr_0.95fr]">
          {/* Left Column: Flowchart Stack */}
          <section aria-label="Pipeline blocks">
            <div className="mb-5">
              <label htmlFor="pipeline-title" className="sr-only">
                Pipeline Title
              </label>
              <input
                id="pipeline-title"
                type="text"
                value={pipelineTitle}
                onChange={(e) => setPipelineTitle(e.target.value)}
                placeholder="Untitled Pipeline..."
                className="font-display w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-bold tracking-tight text-slate-900 transition-colors hover:border-slate-200 hover:bg-white focus:border-indigo-500 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
              />
              {activeTemplate?.description && (
                <p className="mt-1 px-2 text-sm text-slate-500 dark:text-slate-400">
                  {activeTemplate.description}
                </p>
              )}
            </div>

            {blocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Your pipeline stack is empty.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add a block below or pick a template from the dropdown above.
                </p>
                <button
                  type="button"
                  onClick={() => handleInsertBlockAt(0)}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Block</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {blocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    {index > 0 && (
                      <InsertConnector onInsert={() => handleInsertBlockAt(index)} />
                    )}
                    <BlockCard
                      block={block}
                      index={index}
                      totalBlocks={blocks.length}
                      pipelineTitle={pipelineTitle}
                      aiConfig={aiConfig}
                      modelReady={localAi.status === 'ready'}
                      isDragging={dragIndex === index}
                      isDragOver={dragOverIndex === index && dragIndex !== index}
                      onToggleExpand={handleToggleBlock}
                      onMoveBlock={handleMoveBlock}
                      onDuplicateBlock={handleDuplicateBlock}
                      onRemoveBlock={handleRemoveBlock}
                      onUpdateBlockTitle={handleUpdateBlockTitle}
                      onSwapBlockType={handleSwapBlockType}
                      onAddField={handleAddField}
                      onUpdateField={handleUpdateField}
                      onMoveField={handleMoveField}
                      onRemoveField={handleRemoveField}
                      onRequestAiComplete={localAi.completeText}
                      onRequestAiSpellFix={localAi.fixSpellingAi}
                      onRequestAiFieldSuggestions={localAi.suggestFieldsAi}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                    />
                  </React.Fragment>
                ))}

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleInsertBlockAt(blocks.length)}
                    className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:border-indigo-500 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Block to Pipeline</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Live Output Compiler */}
          <OutputPanel
            compiledText={compiledOutput}
            format={outputFormat}
            onFormatChange={setOutputFormat}
            includeEmpty={includeEmpty}
            onToggleIncludeEmpty={() => setIncludeEmpty((v) => !v)}
            blockCount={stats.blockCount}
            fieldCount={stats.fieldCount}
            photoRefCount={stats.photoRefCount}
            onDownload={handleDownloadOutput}
          />
        </div>
      </main>

      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        defaultTitle={pipelineTitle}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCustomTemplate}
      />
    </div>
  );
}
