/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

declare global {
  const EdgeRuntime: {
    waitUntil: (promise: Promise<any>) => void;
  };
}

export {};
