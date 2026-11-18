import { env, pipeline } from '@huggingface/transformers';
import { LightweightModelId } from '../types/ai';

// Use remote Hugging Face Hub ONNX models directly in browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

type WorkerTask = 'text2text-generation' | 'text-generation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activePipeline: any = null;
let loadedModelId: LightweightModelId | null = null;
let loadedTask: WorkerTask | null = null;

interface LoadRequest {
  type: 'load';
  requestId: string;
  modelId: LightweightModelId;
  task: WorkerTask;
}

interface UnloadRequest {
  type: 'unload';
  requestId: string;
}

interface InferRequest {
  type: 'infer';
  requestId: string;
  mode: 'complete' | 'spell' | 'suggest-fields';
  prompt: string;
  maxNewTokens?: number;
}

type WorkerMessage = LoadRequest | UnloadRequest | InferRequest;

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'unload') {
    activePipeline = null;
    loadedModelId = null;
    loadedTask = null;
    self.postMessage({ type: 'unloaded', requestId: msg.requestId });
    return;
  }

  if (msg.type === 'load') {
    try {
      if (loadedModelId === msg.modelId && activePipeline) {
        self.postMessage({
          type: 'loaded',
          requestId: msg.requestId,
          modelId: msg.modelId,
        });
        return;
      }

      activePipeline = null;
      loadedModelId = null;
      loadedTask = null;

      const pipe = await pipeline(msg.task, msg.modelId, {
        dtype: 'q8',
        progress_callback: (progress: {
          status?: string;
          file?: string;
          progress?: number;
        }) => {
          self.postMessage({
            type: 'progress',
            requestId: msg.requestId,
            status: progress.status || 'loading',
            file: progress.file || '',
            progress: typeof progress.progress === 'number' ? progress.progress : 0,
          });
        },
      });

      activePipeline = pipe;
      loadedModelId = msg.modelId;
      loadedTask = msg.task;

      self.postMessage({
        type: 'loaded',
        requestId: msg.requestId,
        modelId: msg.modelId,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load lightweight ONNX model.';
      self.postMessage({
        type: 'error',
        requestId: msg.requestId,
        error: errorMessage,
      });
    }
    return;
  }

  if (msg.type === 'infer') {
    if (!activePipeline || !loadedTask) {
      self.postMessage({
        type: 'error',
        requestId: msg.requestId,
        error: 'No model is currently loaded.',
      });
      return;
    }

    try {
      const maxNewTokens = msg.maxNewTokens ?? 28;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output: any = await activePipeline(msg.prompt, {
        max_new_tokens: maxNewTokens,
        do_sample: false,
        repetition_penalty: 1.15,
      });

      let text = '';
      if (Array.isArray(output) && output.length > 0) {
        text = output[0].generated_text ?? '';
      }

      if (loadedTask === 'text-generation' && text.startsWith(msg.prompt)) {
        text = text.slice(msg.prompt.length);
      }

      self.postMessage({
        type: 'result',
        requestId: msg.requestId,
        mode: msg.mode,
        text: String(text).trim(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Model inference failed.';
      self.postMessage({
        type: 'error',
        requestId: msg.requestId,
        error: errorMessage,
      });
    }
  }
});
