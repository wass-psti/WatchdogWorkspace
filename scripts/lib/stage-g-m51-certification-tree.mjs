import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
const root=resolve(process.argv[2]||'.');
const excluded=new Set(['node_modules','.git','dist','coverage','test-results','playwright-report','.vite','.vitest','.wm-modern-test-toolchain','m51-certified-artifacts-upload']);
const excludedFiles=new Set(['CHECKSUMS.sha256','M51-CONTINUATION-STATE.md','RELEASE-STATUS-v1.43.2-STAGE-G-M51-BOARDS-REALTIME-CONCURRENCY-STABILIZATION.md','config/stage-g-m51-boards-realtime-concurrency-stabilization-target.ts']);
const files=[];
function walk(dir){for(const name of readdirSync(dir).sort()){if(excluded.has(name))continue;const p=join(dir,name);const rel=relative(root,p).replaceAll('\\','/');const s=statSync(p);if(s.isDirectory())walk(p);else if(s.isFile()&&!excludedFiles.has(rel)&&!rel.endsWith('.zip')&&!rel.endsWith('.sha256'))files.push(rel);}}
walk(root);
const h=createHash('sha256');for(const rel of files){h.update(rel);h.update('\0');h.update(readFileSync(join(root,rel)));h.update('\0');}
console.log(h.digest('hex'));
