import mitt from 'mitt';

// Single shared event bus for the entire game.
// Rule: game systems EMIT only. React UI LISTENS only.
export const bus = mitt();
