import { useState, useRef, useEffect } from 'react';

export function useMeta() {
  const [meta, setMeta] = useState({ 
      honor: 0, 
      unlockedProvisions: [], 
      equippedItem: null,
      conqueredRegions: [],
      totalRuns: 0
  });
  
  const metaRef = useRef(meta);
  
  useEffect(() => { 
      metaRef.current = meta; 
  }, [meta]);

  return { meta, setMeta, metaRef };
}
