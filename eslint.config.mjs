import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "app/admin/**",
    "app/api/admin/**",
    "app/api/auth/**",
    "app/api/ingest/**",
    "app/api/upload-logo/**",
    "components/admin-*.tsx",
    "components/bayer-dither-bg.tsx",
    "components/breadcrumbs.tsx",
    "components/page-header.tsx",
    "components/ripple-grid.tsx",
    "components/ui/**",
    "lib/actions/**",
    "lib/chunking.ts",
    "lib/cost-control.ts",
    "lib/embeddings.ts",
    "lib/encryption.ts",
    "lib/supabase/**",
  ]),
]);

export default eslintConfig;
