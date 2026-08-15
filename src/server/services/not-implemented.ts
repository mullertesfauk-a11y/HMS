import "server-only";

/**
 * Marks a service method that is scaffolded but implemented in a later phase.
 * Keeps the architecture contract visible and compiling without shipping
 * half-finished business logic.
 */
export function notImplemented(phase: string): never {
  throw new Error(`Not implemented yet — scheduled for ${phase}`);
}
