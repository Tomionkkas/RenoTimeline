import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend as ReactDndTouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, MouseTransition, TouchTransition } from 'dnd-multi-backend';

/**
 * Multi-backend configuration for React DnD v16
 * Automatically switches between HTML5Backend (desktop/mouse) and TouchBackend (mobile/touch)
 * when touch events are detected, providing seamless drag-and-drop across all devices.
 *
 * This configuration:
 * - Uses HTML5Backend for desktop/mouse interactions
 * - Uses TouchBackend for mobile/touch interactions
 * - Automatically detects and switches based on input method
 * - Enables 200ms delay for touch devices to distinguish between tap and drag
 * - Allows 5px touch slop before drag starts
 */
export const TouchBackend = MultiBackend;

export const TouchBackendOptions = {
  backends: [
    {
      id: 'html5',
      backend: HTML5Backend,
      transition: MouseTransition,
    },
    {
      id: 'touch',
      backend: ReactDndTouchBackend,
      options: {
        enableMouseEvents: true,
        delayTouchStart: 200, // 200ms delay before drag starts on touch
        ignoreContextMenu: true,
        touchSlop: 5, // Allow 5px of movement before considering it a drag
      },
      transition: TouchTransition,
    },
  ],
};
