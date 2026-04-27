import { readFileSync } from 'fs';
import { join } from 'path';

const GITIGNORE_PATH = join(__dirname, '../../../.gitignore');

describe('.gitignore', () => {
  let content: string;
  let lines: string[];

  beforeAll(() => {
    content = readFileSync(GITIGNORE_PATH, 'utf8');
    lines = content.split('\n').map((l) => l.trim());
  });

  const shouldIgnore = [
    'node_modules/',
    '.env',
    'dist/',
    'coverage/',
    '.compozy/cache/',
    '.compozy/tmp/',
    '.adal/',
    '.agents/',
    '.claude/',
    '.mcpjam/',
  ];

  shouldIgnore.forEach((pattern) => {
    it(`ignores "${pattern}"`, () => {
      expect(content).toContain(pattern);
    });
  });

  it('does NOT ignore .compozy/tasks/', () => {
    expect(lines).not.toContain('.compozy/tasks/');
    expect(lines).not.toContain('.compozy/tasks');
  });

  it('file exists and is non-empty', () => {
    expect(content.length).toBeGreaterThan(0);
  });
});
