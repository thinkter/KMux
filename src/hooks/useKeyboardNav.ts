import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export const useKeyboardNav = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Super (Meta) + Arrow keys
      if (e.metaKey) {
        const state = useCanvasStore.getState();
        
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            state.moveUp();
            break;
          case 'ArrowDown':
            e.preventDefault();
            state.moveDown();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            state.moveLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            state.moveRight();
            break;
        }
      }
    };

    // Use capturing phase to intercept commands reliably
    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
};
