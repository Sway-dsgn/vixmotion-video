export {};

export interface VixMotionHardwareInfo {
  cpu: { model: string; physicalCores: number; logicalCores: number };
  memory: { totalBytes: number; freeBytes: number };
  gpus: string[];
  encoders: string[];
  platform: "darwin" | "win32" | "linux";
  arch: string;
}

export interface VixMotionExportStartArgs {
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  format: string;
  bitrateKbps: number;
  outputPath: string;
  totalFrames: number;
  audioSampleRate: number;
  audioChannels: number;
  encodeMode?: "fast" | "balanced" | "smallest";
  quality?: number;
  proresProfile?: "proxy" | "lt" | "standard" | "hq" | "4444" | "4444xq";
}

export interface VixMotionExportSession {
  jobId: string;
}

export interface VixMotionAuroraRenderPreviewArgs {
  scene: unknown;
  assets: unknown[];
  width: number;
  height: number;
  background?: string;
  timeSeconds?: number;
  quality?: "preview" | "final";
}

export interface VixMotionAuroraPreviewSessionStartArgs
  extends VixMotionAuroraRenderPreviewArgs {
  sessionId?: string;
}

export interface VixMotionAuroraPreviewSessionStartResult {
  sessionId: string;
}

export interface VixMotionAuroraSequenceSessionStartArgs
  extends Omit<VixMotionAuroraRenderPreviewArgs, "timeSeconds"> {
  sessionId?: string;
  frameRate: number;
  durationSeconds: number;
}

export interface VixMotionAuroraSequenceSessionStartResult {
  sessionId: string;
}

export interface VixMotionAuroraRenderPreviewResult {
  backend: "native" | "cpu";
  pngBase64: string;
  dataUri: string;
  width: number;
  height: number;
  coveredPixels: number;
  shadowedPixels: number;
  renderMs: number;
}

export type VixMotionAuroraPreviewSessionEvent =
  | {
      kind: "update";
      sessionId: string;
      stage: "draft" | "refine" | "final";
      progress: number;
      done: boolean;
      targetWidth: number;
      targetHeight: number;
      result: VixMotionAuroraRenderPreviewResult;
    }
  | {
      kind: "error";
      sessionId: string;
      done: true;
      error: string;
    };

export type VixMotionAuroraSequenceSessionEvent =
  | {
      kind: "frame";
      sessionId: string;
      frameIndex: number;
      totalFrames: number;
      timeSeconds: number;
      progress: number;
      done: boolean;
      result: {
        backend: "native" | "cpu";
        rgba: Uint8Array;
        width: number;
        height: number;
        coveredPixels: number;
        shadowedPixels: number;
        renderMs: number;
      };
    }
  | {
      kind: "error";
      sessionId: string;
      done: true;
      error: string;
    };

export interface VixMotionMcpStatus {
  running: boolean;
  url: string;
  port: number;
  token: string;
  shimPath: string;
  endpointFile: string;
}

export interface VixMotionRiggingBackendProbe {
  available: boolean;
  provider: "blender";
  mode?: "configured" | "bundled" | "system";
  path?: string;
  version?: string;
  error?: string;
}

export interface VixMotionRiggingWarning {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface VixMotionRigHumanoidModelArgs {
  modelUrl: string;
  outputPath?: string;
  name?: string;
  heightMeters?: number;
  overwriteExisting?: boolean;
}

export interface VixMotionRigHumanoidModelResult {
  ok: boolean;
  provider: "blender";
  inputUrl: string;
  outputUrl?: string;
  outputPath?: string;
  armatureName?: string;
  createdArmature: boolean;
  preservedExistingArmature: boolean;
  skinnedMeshCount: number;
  meshCount: number;
  boneCount: number;
  warnings: VixMotionRiggingWarning[];
  error?: string;
}

export type VixMotionUpdaterStatus =
  | { state: "checking" }
  | { state: "available"; version: string }
  | { state: "none" }
  | { state: "downloading"; percent: number }
  | { state: "downloaded"; version: string }
  | { state: "error"; message: string };

declare global {
  interface Window {
    vixmotion?: {
      platform: "desktop";
      publicOrigin: string;
      probeHardware(): Promise<VixMotionHardwareInfo>;
      onMenuAction(cb: (id: string) => void): () => void;
      fs: {
        showSaveDialog(opts: {
          defaultPath: string;
          filters: { name: string; extensions: string[] }[];
        }): Promise<string | null>;
        showOpenDialog(opts: {
          filters: { name: string; extensions: string[] }[];
        }): Promise<string | null>;
        readFile(path: string): Promise<string>;
        readFileBytes(path: string): Promise<ArrayBuffer>;
        tempFilePath(ext: string): Promise<string>;
        writeFile(path: string, data: string): Promise<void>;
        openWrite(path: string): Promise<string>;
        writeChunk(handleId: string, data: ArrayBuffer | Uint8Array, position: number): Promise<void>;
        closeWrite(handleId: string): Promise<void>;
        abortWrite(handleId: string): Promise<void>;
        revealInFolder(path: string): Promise<void>;
      };
      keychain: {
        get(id: string): Promise<string | null>;
        set(id: string, value: string): Promise<void>;
        delete(id: string): Promise<void>;
      };
      export: {
        start(args: VixMotionExportStartArgs): Promise<VixMotionExportSession>;
        writeAudioWav(jobId: string, wav: ArrayBuffer): Promise<void>;
        writeAudioChunk(jobId: string, chunk: ArrayBuffer, position: number): Promise<void>;
        finishAudio(jobId: string): Promise<void>;
        cancel(jobId: string): Promise<void>;
      };
      aurora?: {
        renderPreview(
          args: VixMotionAuroraRenderPreviewArgs,
        ): Promise<VixMotionAuroraRenderPreviewResult>;
        startPreviewSession(
          args: VixMotionAuroraPreviewSessionStartArgs,
        ): Promise<VixMotionAuroraPreviewSessionStartResult>;
        cancelPreviewSession(sessionId: string): Promise<void>;
        onPreviewEvent(
          cb: (event: VixMotionAuroraPreviewSessionEvent) => void,
        ): () => void;
        startSequenceSession(
          args: VixMotionAuroraSequenceSessionStartArgs,
        ): Promise<VixMotionAuroraSequenceSessionStartResult>;
        cancelSequenceSession(sessionId: string): Promise<void>;
        onSequenceEvent(
          cb: (event: VixMotionAuroraSequenceSessionEvent) => void,
        ): () => void;
      };
      cloud: {
        fetch(
          service: "elevenlabs" | "openai" | "anthropic",
          path: string,
          options?: { method?: string; headers?: Record<string, string>; body?: string },
        ): Promise<{ status: number; statusText: string; headers: Record<string, string>; body: ArrayBuffer }>;
      };
      gpu: {
        uploadMedia(args: { srcPath: string; filename: string; contentType?: string }): Promise<{ mediaKey: string; downloadUrl?: string }>;
        uploadExport(args: { bytes: ArrayBuffer | Uint8Array; filename: string; contentType?: string }): Promise<{ mediaKey: string; downloadUrl?: string }>;
        submitJob(args: { kind: string; params: Record<string, unknown>; mediaKey?: string; mediaFilename?: string }): Promise<{ jobID: string; status: string; manifestURL?: string }>;
        jobStatus(jobID: string): Promise<{ jobID: string; status: string; progress?: number; message?: string; manifestURL?: string; error?: string; queuePosition?: number; pendingAhead?: number }>;
        fetchManifest(jobID: string): Promise<Record<string, unknown>>;
        downloadArtifact(jobID: string, relativePath: string): Promise<{ tempPath: string; mime: string }>;
        cancelJob(jobID: string): Promise<{ jobID: string; status: string }>;
      };
      win: {
        minimize(): Promise<void>;
        toggleMaximize(): Promise<void>;
        close(): Promise<void>;
        isMaximized(): Promise<boolean>;
      };
      lifecycle: {
        onQueryUnsaved(handler: () => boolean): () => void;
        onFlush(handler: () => Promise<void>): () => void;
      };
      updater: {
        onStatus(cb: (status: VixMotionUpdaterStatus) => void): () => void;
        download(): Promise<void>;
        install(): Promise<void>;
      };
      crash: {
        report(payload: { message: string; stack?: string; type?: string; context?: unknown }): void;
      };
      mcp?: {
        onRequest(
          handler: (req: {
            callId: string;
            kind: "listTools" | "callTool";
            name?: string;
            args?: Record<string, unknown>;
          }) => Promise<{ ok: boolean; result?: unknown; error?: string }>,
        ): () => void;
        getStatus(): Promise<VixMotionMcpStatus>;
        rotateToken(): Promise<VixMotionMcpStatus>;
        testConnection(): Promise<{ ok: boolean; message?: string; toolCount?: number }>;
      };
      media: {
        generateProxy(args: { srcPath: string; preset: "low" | "medium" | "high" }): Promise<{ outPath: string }>;
        transcode(args: {
          srcPath: string;
          container?: "mp4" | "webm" | "mov";
          videoBitrateKbps?: number;
          audioBitrateKbps?: number;
        }): Promise<{ outPath: string }>;
        extractAudioWav(args: { srcPath: string; streamIndex?: number }): Promise<{ outPath: string }>;
        probeAudioStreams(args: { srcPath: string }): Promise<{
          streams: { index: number; codec: string; channels: number; sampleRate: number; language?: string }[];
        }>;
        fetchUrl(args: { url: string; maxBytes?: number }): Promise<{
          ok: boolean;
          status: number;
          statusText: string;
          contentType: string;
          body: ArrayBuffer;
          error?: string;
        }>;
      };
      rigging?: {
        probeBackend(): Promise<VixMotionRiggingBackendProbe>;
        rigHumanoidModel(
          args: VixMotionRigHumanoidModelArgs,
        ): Promise<VixMotionRigHumanoidModelResult>;
      };
    };
  }
}
