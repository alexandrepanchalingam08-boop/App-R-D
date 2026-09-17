import { createContext, useCallback, useContext, useState } from 'react';

const CameraContext = createContext(null);

export function CameraProvider({ children }) {
  // request: { uploadFn(file, label) -> Promise<result>, labels: [{value,text}] | null, onDone(result) }
  // `labels` omitted or single-entry hides the label picker row.
  const [request, setRequest] = useState(null);

  const openCamera = useCallback((opts) => {
    setRequest(opts);
  }, []);
  const closeCamera = useCallback(() => setRequest(null), []);

  return <CameraContext.Provider value={{ request, openCamera, closeCamera }}>{children}</CameraContext.Provider>;
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used within CameraProvider');
  return ctx;
}
