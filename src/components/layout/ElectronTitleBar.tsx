'use client';

import { useEffect, useState } from 'react';

export function useIsElectron() {
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron);
  }, []);
  return isElectron;
}

export default function ElectronTitleBar() {
  const isElectron = useIsElectron();

  if (!isElectron) return null;

  return (
    <div
      className="h-8 w-full flex-shrink-0 bg-zinc-950"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    />
  );
}
