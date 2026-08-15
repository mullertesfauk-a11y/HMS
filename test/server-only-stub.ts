// Vitest resolves "server-only" to this empty module. The real package throws
// when bundled outside a React Server Component context, which is irrelevant
// under Node-based unit tests.
export {};
