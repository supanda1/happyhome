import { useLocation } from 'react-router-dom';
import { useSessionManager, type UseSessionManagerOptions } from './useSessionManager';

// Hook that combines useSessionManager with router location
export const useSessionManagerWithRouter = (options: Omit<UseSessionManagerOptions, 'currentPath'> = {}) => {
  const location = useLocation();
  
  return useSessionManager({
    ...options,
    currentPath: location.pathname
  });
};

export default useSessionManagerWithRouter;