import { useEffect } from 'react';

export function useLockBodyScroll(isLocked: boolean | null | undefined) {
  useEffect(() => {
    if (isLocked) {
      document.body.classList.add('no-scroll');
      return () => {
        document.body.classList.remove('no-scroll');
      };
    }
  }, [isLocked]);
}
