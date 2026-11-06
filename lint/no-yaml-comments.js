import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const workflows = path.join(import.meta.dir, '../.github/workflows');
const names = await readdir(workflows);
let failed = false;

for (const name of names) {
  if (!name.endsWith('.yml') && !name.endsWith('.yaml')) continue;
  const file = path.join(workflows, name);
  const lines = (await readFile(file, 'utf8')).split('\n');
  for (let index = 0; index < lines.length; index++) {
    if (/^\s*#/.test(lines[index])) {
      console.error(
        `${path.posix.join('.github/workflows', name)}:${index + 1}: Remove this comment.`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
