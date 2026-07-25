# @VixMotion/creation-core

Phase 0 native engine scaffold for the agent-native creation engine.

This package holds the **C++20 native core** and its **C ABI boundary**
(`include/creation_core.h`). The deterministic CPU reference implementation of
every kernel lives in the TypeScript package
[`@VixMotion/core/creation`](../core/src/creation) (geometry, sdf, rig, sim,
render, material). The native build must produce results that match that
reference for the golden tests.

## Layout

- `include/creation_core.h` â€” stable C ABI exposed to the host.
- `src/creation_core.cpp` â€” native implementation (mirrors the TS reference).
- `CMakeLists.txt` â€” native (desktop shared library) and WASM (emscripten) builds.

## Build

Native (requires CMake + a C++20 toolchain):

```bash
pnpm --filter @VixMotion/creation-core build:native
```

WASM (requires emscripten):

```bash
pnpm --filter @VixMotion/creation-core build:wasm
```

## Loading

[`@VixMotion/creation-bindings`](../creation-bindings) loads the compiled native
addon / WASM module through this ABI and **falls back to the CPU reference**
(`@VixMotion/core/creation`) when no native build is present â€” so the desktop app
works on every platform and CI without the native toolchain.

## Golden preview regression

The desktop Aurora test suite keeps a committed preview golden at
[`apps/desktop/test/goldens/aurora-preview-box.json`](../../apps/desktop/test/goldens/aurora-preview-box.json)
and verifies the current renderer against it in
[`apps/desktop/test/aurora-golden.test.ts`](../../apps/desktop/test/aurora-golden.test.ts).

Refresh that baseline intentionally with:

```bash
cd apps/desktop
UPDATE_AURORA_GOLDENS=1 ./node_modules/.bin/vitest run test/aurora-golden.test.ts
```
