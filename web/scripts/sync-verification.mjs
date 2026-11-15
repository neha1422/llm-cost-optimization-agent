// Bundle the executed pytest report without requiring imports outside Next's root.
import { copyFileSync } from 'node:fs';
copyFileSync(new URL('../../benchmarks/redesign-tests.json', import.meta.url), new URL('../lib/verification.json', import.meta.url));
