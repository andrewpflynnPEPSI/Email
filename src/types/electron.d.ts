interface ElectronAPI {
  platform: string;
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getVersion: () => Promise<string>;
  showNotification: (title: string, body: string) => void;
  onDeepLink: (callback: (url: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    __ELECTRON_OPEN_SETTINGS?: () => void;
    __ELECTRON_SHOW_SHORTCUTS?: () => void;
  }
}

export {};
