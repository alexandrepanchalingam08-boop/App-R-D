import { createContext, useCallback, useContext, useState } from 'react';

const CameraContext = createContext(null);

export function CameraProvider({ children }) {
  const [request, setRequest] = useState(null); // { sessionId, targetLabel, onDone }

  const openCamera = useCallback((sessionId, targetLabel, onDone) => {
    setRequest({ sessionId, targetLabel, onDone });
  }, []);
  const closeCamera = useCallback(() => setRequest(null), []);

  return <CameraContext.Provider value={{ request, openCamera, closeCamera }}>{children}</CameraContext.Provider>;
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera must be used within CameraProvider');
  return ctx;
}
