export interface FaceInfo {
  exists: boolean;
  imagePath?: string;
  registeredAt?: string;
  updatedAt?: string;
}

export interface ImageInfo {
  name: string;
  path: string;
  size?: number;
  modifiedAt?: string;
}

export interface FaceDetectionResult {
  detected: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  landmarks?: unknown[];
}

export interface FaceVerificationResult {
  verified: boolean;
  similarity?: number;
  matchedUserId?: string;
}
