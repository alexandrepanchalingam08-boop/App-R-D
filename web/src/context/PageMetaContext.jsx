import { createContext, useContext, useEffect, useState } from 'react';

const PageMetaContext = createContext(null);

const DEFAULT_META = { kicker: '', heading: '', showBack: false, showNew: false };

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(DEFAULT_META);
  return <PageMetaContext.Provider value={{ meta, setMeta }}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta() {
  const ctx = useContext(PageMetaContext);
  if (!ctx) throw new Error('usePageMeta must be used within PageMetaProvider');
  return ctx;
}

// Call from a page component to drive the shared header. Pass a plain
// object; changes are compared shallowly so it's safe to call every render.
export function useSetPageMeta(next) {
  const { setMeta } = usePageMeta();
  const { kicker = '', heading = '', showBack = false, showNew = false } = next;
  useEffect(() => {
    setMeta({ kicker, heading, showBack, showNew });
  }, [kicker, heading, showBack, showNew, setMeta]);
}
