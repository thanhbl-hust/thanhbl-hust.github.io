// Builds the deployable site into _site/:
//   1. copies site/ as is,
//   2. renders blog/*.md (Markdown + front matter) into _site/blogs/<slug>/index.html
//      and the post list into _site/blogs/index.html, using templates/;
//      copies blog/images/ to _site/blogs/images/ (posts link them as /blogs/images/...),
//   3. replaces <!-- include:NAME --> in every HTML page with templates/partials/NAME.html.
//
// Usage: node scripts/build.mjs            (what CI runs)
//        node scripts/build.mjs --drafts   (also renders posts with `draft: true`)

import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import hcl from './hljs-hcl.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'site');
const OUT = path.join(ROOT, '_site');
const POSTS = path.join(ROOT, 'blog');
const TEMPLATES = path.join(ROOT, 'templates');
const withDrafts = process.argv.includes('--drafts');

const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

hljs.registerLanguage('hcl', hcl);

// Blog-only inline syntax (not standard Markdown):
//   :red[text] … :gray[text]  -> <span class="tc-red">text</span>  (colour tokens in main.css)
//   ==text==                  -> <mark>text</mark>
// The text inside may use other inline Markdown (**bold**, `code`, links); it can't contain "]".
const TEXT_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray'];
const COLOR_RE = new RegExp(`^:(${TEXT_COLORS.join('|')})\\[([^\\]\\n]+)\\]`);
const firstIndex = (src, re) => { const i = src.search(re); return i < 0 ? undefined : i; };

const colorText = {
  name: 'colorText',
  level: 'inline',
  start: src => firstIndex(src, new RegExp(`:(${TEXT_COLORS.join('|')})\\[`)),
  tokenizer(src) {
    const m = COLOR_RE.exec(src);
    if (m) return { type: 'colorText', raw: m[0], color: m[1], tokens: this.lexer.inlineTokens(m[2]) };
  },
  renderer(token) {
    return `<span class="tc-${token.color}">${this.parser.parseInline(token.tokens)}</span>`;
  },
};

const highlightText = {
  name: 'highlightText',
  level: 'inline',
  start: src => firstIndex(src, /==/),
  tokenizer(src) {
    const m = /^==(?=\S)([^\n]*?\S)==/.exec(src);
    if (m) return { type: 'highlightText', raw: m[0], tokens: this.lexer.inlineTokens(m[1]) };
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline(token.tokens)}</mark>`;
  },
};

// Headings get ASCII ids ("1. Tạo bài mới" -> "1-tao-bai-moi") so the table of contents
// and #links work; renderToc() turns the ## / ### of one post into the TOC.
let headings = []; // filled by the heading renderer while one post is parsed
const stripTags = html => html.replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const slugify = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';

function renderToc(list) {
  const groups = [];
  for (const h of list) {
    if (h.depth === 2 || !groups.length) groups.push({ ...h, children: [] });
    else if (h.depth === 3) groups.at(-1).children.push(h);
  }
  if (groups.length < 2) return ''; // not worth a TOC
  const link = h => `<a href="#${h.id}">${h.html.replace(/<\/?a\b[^>]*>/g, '')}</a>`; // no <a> inside <a>
  const items = groups.map(g => `<li>${link(g)}${g.children.length ? `<ol>${g.children.map(c => `<li>${link(c)}</li>`).join('')}</ol>` : ''}</li>`);
  return `<nav class="toc" aria-label="Contents"><div class="toc-inner"><p class="toc-title">Contents</p><ol>${items.join('')}</ol></div></nav>`;
}

// Fenced code blocks are syntax-highlighted here, at build time (highlight.js classes,
// coloured by the --hl-* tokens in main.css), and get a label with the language name.
// An unknown or missing language renders as plain text.
const marked = new Marked({
  gfm: true,
  extensions: [colorText, highlightText],
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      const base = slugify(stripTags(html));
      let id = base;
      for (let n = 2; headings.some(h => h.id === id); n++) id = `${base}-${n}`;
      headings.push({ id, depth, html });
      return `<h${depth} id="${id}">${html}</h${depth}>\n`;
    },
    code({ text, lang }) {
      const name = (lang || '').trim().split(/\s+/)[0].toLowerCase();
      const known = Boolean(name && hljs.getLanguage(name));
      const body = known ? hljs.highlight(text, { language: name, ignoreIllegals: true }).value : escapeHtml(text);
      const label = name ? `<span class="code-lang">${escapeHtml(name)}</span>` : '';
      const cls = known ? `hljs language-${name}` : 'hljs';
      return `<div class="code-block">${label}<pre><code class="${cls}">${body}</code></pre></div>\n`;
    },
  },
});

// {{key}} = escaped value, {{{key}}} = raw HTML.
function render(template, data) {
  return template
    .replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => data[k] ?? '')
    .replace(/\{\{(\w+)\}\}/g, (_, k) => escapeHtml(data[k] ?? ''));
}

// Minimal front matter: `key: value` lines between two `---` lines.
function parseFrontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^(\w+)\s*:\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return { meta, body: src.slice(m[0].length) };
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

async function loadPosts() {
  const posts = [];
  const files = (await readdir(POSTS).catch(() => [])).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const { meta, body } = parseFrontMatter(await readFile(path.join(POSTS, file), 'utf8'));
    if (meta.draft === 'true' && !withDrafts) continue;

    const slug = meta.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const date = meta.date || file.slice(0, 10);
    if (!meta.title) throw new Error(`${file}: front matter needs a title`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${file}: date must be YYYY-MM-DD (front matter or file name)`);
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`${file}: slug "${slug}" may only use a-z, 0-9 and -`);

    const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
    headings = [];
    const html = marked.parse(body);
    posts.push({
      slug,
      date,
      title: meta.title,
      description: meta.description || '',
      draft: meta.draft === 'true',
      minutes: Math.max(1, Math.round(words / 200)),
      html,
      toc: renderToc(headings),
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

const postRow = p => `
      <li>
        <a class="post-row" href="${p.slug}/">
          <time datetime="${p.date}">${p.date}</time>
          <span class="post-title" lang="vi">${escapeHtml(p.title)}${p.draft ? ' <span class="draft">draft</span>' : ''}</span>
        </a>
        ${p.description ? `<p class="post-desc" lang="vi">${escapeHtml(p.description)}</p>` : ''}
      </li>`;

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await cp(SRC, OUT, { recursive: true });

  const posts = await loadPosts();
  const postTpl = await readFile(path.join(TEMPLATES, 'blog-post.html'), 'utf8');
  const indexTpl = await readFile(path.join(TEMPLATES, 'blog-index.html'), 'utf8');

  for (const post of posts) {
    const dir = path.join(OUT, 'blogs', post.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), render(postTpl, post));
  }
  await mkdir(path.join(OUT, 'blogs'), { recursive: true });
  await cp(path.join(POSTS, 'images'), path.join(OUT, 'blogs', 'images'), { recursive: true })
    .catch(err => { if (err.code !== 'ENOENT') throw err; }); // no images yet is fine
  await writeFile(path.join(OUT, 'blogs', 'index.html'), render(indexTpl, {
    posts: posts.length ? posts.map(postRow).join('') : '\n      <li class="empty">No posts yet.</li>',
  }));

  // Shared partials (e.g. the contact bar) into every page, generated ones included.
  const partials = new Map();
  for (const file of await htmlFiles(OUT)) {
    const html = await readFile(file, 'utf8');
    const out = await replaceAsync(html, /<!-- include:([\w-]+) -->/g, async name => {
      if (!partials.has(name)) partials.set(name, (await readFile(path.join(TEMPLATES, 'partials', `${name}.html`), 'utf8')).trim());
      return partials.get(name);
    });
    if (out !== html) await writeFile(file, out);
  }

  console.log(`built _site/: ${posts.length} post(s)${withDrafts ? ' (drafts included)' : ''}`);
}

async function replaceAsync(str, re, fn) {
  const names = [...str.matchAll(re)].map(m => m[1]);
  const values = await Promise.all(names.map(fn));
  let i = 0;
  return str.replace(re, () => values[i++]);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
