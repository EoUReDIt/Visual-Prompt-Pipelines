import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AiModelStatus,
  LIGHTWEIGHT_MODELS,
  LightweightModelId,
} from '../types/ai';

interface PendingRequest {
  resolve: (text: string) => void;
  reject: (err: Error) => void;
}

export function useLocalAi() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const loadResolverRef = useRef<{
    resolve: () => void;
    reject: (err: Error) => void;
  } | null>(null);

  const [status, setStatus] = useState<AiModelStatus>('idle');
  const [loadedModelId, setLoadedModelId] = useState<LightweightModelId | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressFile, setProgressFile] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  const ensureWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('../workers/aiWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'progress') {
        if (typeof msg.progress === 'number') {
          setProgress(Math.min(100, Math.max(0, Math.round(msg.progress))));
        }
        if (typeof msg.file === 'string' && msg.file) {
          setProgressFile(msg.file.split('/').pop() || msg.file);
        }
        return;
      }

      if (msg.type === 'loaded') {
        setStatus('ready');
        setLoadedModelId(msg.modelId);
        setProgress(100);
        setProgressFile('');
        setError(null);
        loadResolverRef.current?.resolve();
        loadResolverRef.current = null;
        return;
      }

      if (msg.type === 'unloaded') {
        setStatus('idle');
        setLoadedModelId(null);
        setProgress(0);
        setProgressFile('');
        setError(null);
        return;
      }

      if (msg.type === 'result') {
        const pending = pendingRef.current.get(msg.requestId);
        if (pending) {
          pendingRef.current.delete(msg.requestId);
          pending.resolve(msg.text || '');
        }
        setIsInferring(pendingRef.current.size > 0);
        return;
      }

      if (msg.type === 'error') {
        const errMsg = msg.error || 'Model execution error';
        if (loadResolverRef.current) {
          setStatus('error');
          setError(errMsg);
          loadResolverRef.current.reject(new Error(errMsg));
          loadResolverRef.current = null;
          return;
        }
        const pending = pendingRef.current.get(msg.requestId);
        if (pending) {
          pendingRef.current.delete(msg.requestId);
          pending.reject(new Error(errMsg));
        }
        setIsInferring(pendingRef.current.size > 0);
      }
    });

    workerRef.current = worker;
    return worker;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  const loadModel = useCallback(
    async (modelId: LightweightModelId) => {
      const spec = LIGHTWEIGHT_MODELS.find((m) => m.id === modelId);
      if (!spec) return;

      const worker = ensureWorker();
      setStatus('loading');
      setProgress(0);
      setProgressFile('Initializing ONNX runtime...');
      setError(null);

      const requestId = `load-${Date.now()}`;
      await new Promise<void>((resolve, reject) => {
        loadResolverRef.current = { resolve, reject };
        worker.postMessage({
          type: 'load',
          requestId,
          modelId: spec.id,
          task: spec.task,
        });
      });
    },
    [ensureWorker]
  );

  const unloadModel = useCallback(() => {
    if (!workerRef.current) {
      setStatus('idle');
      setLoadedModelId(null);
      return;
    }
    workerRef.current.postMessage({
      type: 'unload',
      requestId: `unload-${Date.now()}`,
    });
  }, []);

  const runInfer = useCallback(
    async (
      mode: 'complete' | 'spell' | 'suggest-fields',
      prompt: string,
      maxNewTokens = 28
    ): Promise<string> => {
      if (status !== 'ready' || !workerRef.current) {
        throw new Error('Lightweight AI model is not loaded yet.');
      }

      const requestId = `infer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setIsInferring(true);

      return new Promise<string>((resolve, reject) => {
        pendingRef.current.set(requestId, { resolve, reject });
        workerRef.current?.postMessage({
          type: 'infer',
          requestId,
          mode,
          prompt,
          maxNewTokens,
        });
      });
    },
    [status]
  );

  const completeText = useCallback(
    async (context: {
      pipelineTitle: string;
      blockTitle: string;
      fieldName: string;
      currentText: string;
    }): Promise<string> => {
      const spec = LIGHTWEIGHT_MODELS.find((m) => m.id === loadedModelId);
      const trimmed = context.currentText.trim();

      if (spec?.task === 'text-generation') {
        const prompt = `${context.fieldName || context.blockTitle}: ${trimmed}`;
        return runInfer('complete', prompt, 24);
      }

      const prompt = `Complete this prompt field concisely.\nSection: ${context.blockTitle}\nField: ${context.fieldName || 'Note'}\nText: ${trimmed}`;
      return runInfer('complete', prompt, 28);
    },
    [loadedModelId, runInfer]
  );

  const fixSpellingAi = useCallback(
    async (text: string): Promise<string> => {
      const spec = LIGHTWEIGHT_MODELS.find((m) => m.id === loadedModelId);
      if (spec?.task === 'text-generation') {
        const prompt = `Corrected spelling: ${text.trim()}\nRevised:`;
        return runInfer('spell', prompt, 40);
      }
      const prompt = `Fix spelling and grammar only: ${text.trim()}`;
      return runInfer('spell', prompt, 48);
    },
    [loadedModelId, runInfer]
  );

  const suggestFieldsAi = useCallback(
    async (context: {
      pipelineTitle: string;
      blockTitle: string;
      blockType: string;
      existingFields: string[];
    }): Promise<string[]> => {
      const prompt = `Suggest 3 short form field names for "${context.blockTitle}" (${context.blockType}) in pipeline "${context.pipelineTitle}". Existing: ${context.existingFields.join(', ') || 'none'}. List comma-separated names:`;
      const raw = await runInfer('suggest-fields', prompt, 32);
      return raw
        .split(/[,\n;|]+/)
        .map((s) => s.replace(/^[-*\d.)\s]+/, '').trim())
        .filter((s) => s.length >= 3 && s.length <= 36)
        .filter(
          (s) =>
            !context.existingFields.some(
              (existing) => existing.toLowerCase() === s.toLowerCase()
            )
        )
        .slice(0, 4);
    },
    [runInfer]
  );

  return {
    status,
    loadedModelId,
    progress,
    progressFile,
    error,
    isInferring,
    loadModel,
    unloadModel,
    completeText,
    fixSpellingAi,
    suggestFieldsAi,
  };
}
