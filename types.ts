
export enum GenerationStatus {
  PENDING = 'PENDING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  IMAGE_READY = 'IMAGE_READY',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Scene {
  id: number;
  title: string;
  description: string;
  image: string; // base64 data URL
  script: string;
  caption?: string; // New field for social media caption
  overlayTextSuggestion?: string;
  videoUrl?: string; // blob URL
  status: GenerationStatus;
  errorMessage?: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface SceneStructure {
    id: string;
    name: string;
    description: string;
    requiredParts: ('product' | 'model')[];
    planningPrompt: (productName: string, additionalBrief: string, sceneCount: number, ctaPerScene: boolean) => string;
}
