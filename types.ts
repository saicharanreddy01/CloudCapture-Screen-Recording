
export interface Recording {
  id: string;
  url: string;
  blob: Blob;
  duration: number;
  timestamp: number;
  title: string;
  description: string;
  status: 'recording' | 'processing' | 'saved';
  driveUrl?: string;
  thumbnail?: string;
}

export enum RecordingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  EDITING = 'EDITING',
  PROCESSING = 'PROCESSING'
}

export type AppSection = 'recordings' | 'assessment' | 'shared' | 'settings';

export interface UserSettings {
  userName: string;
  userEmail: string;
  userAvatar?: string;
  isAuthenticated: boolean;
  resolution: '1080p' | '720p' | '4k';
  frameRate: 30 | 60;
  autoSync: boolean;
  cloudStorage: 'google-drive' | 'dropbox' | 'onedrive';
}
