import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = path.resolve(backendDir, '..');

describe('scripts ExtendScript appeles par le backend', () => {
  it('ne reference que des fichiers JSX presents', () => {
    const files = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(target);
        else if (entry.name.endsWith('.js')) files.push(target);
      }
    };
    visit(backendDir);

    const missing = [];
    const jsxLiteral = /['"]([^'"]+\.jsx)['"]/g;
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = jsxLiteral.exec(source)) !== null) {
        const script = path.resolve(repositoryDir, 'Indesign automation v1', 'scripts', path.basename(match[1]));
        if (!fs.existsSync(script)) missing.push(`${path.relative(repositoryDir, file)} -> ${script}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
