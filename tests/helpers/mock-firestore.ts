// Shared vi.mock factories: route "firebase/firestore" calls to whichever
// fake store the current test installed, and stub the app's Firebase init.
import { createFakeFirestore } from "./fake-firestore";

export const holder: { current: ReturnType<typeof createFakeFirestore> } = {
  current: createFakeFirestore(),
};

export function installFakeFirestore() {
  holder.current = createFakeFirestore();
  return holder.current;
}

export function firestoreModule() {
  const mod: Record<string, unknown> = {};
  for (const [name, v] of Object.entries(holder.current.api)) {
    mod[name] =
      typeof v === "function"
        ? (...a: unknown[]) => (holder.current.api as any)[name](...a)
        : v;
  }
  return mod;
}
