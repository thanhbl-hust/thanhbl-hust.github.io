// Minimal HCL / Terraform grammar for highlight.js (it has none built in).
// Covers what blog snippets use: blocks, attributes, strings with ${…}, heredocs,
// numbers, booleans, comments and function calls.
export default function hcl(hljs) {
  const INTERPOLATION = { className: 'subst', begin: /\$\{/, end: /\}/ };
  const STRING = {
    className: 'string',
    begin: /"/,
    end: /"/,
    contains: [hljs.BACKSLASH_ESCAPE, INTERPOLATION],
  };
  const HEREDOC = {
    className: 'string',
    begin: /<<-?\s*(EOF|EOT|POLICY|JSON|YAML)\b/,
    end: /^\s*(EOF|EOT|POLICY|JSON|YAML)\b/m,
    contains: [INTERPOLATION],
  };

  return {
    name: 'HCL',
    aliases: ['terraform', 'tf'],
    keywords: {
      keyword: 'resource data variable output module provider locals terraform backend '
        + 'required_providers moved import removed check dynamic content for in if',
      literal: 'true false null',
      built_in: 'var local each count self path',
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      HEREDOC,
      STRING,
      { className: 'number', begin: /\b\d+(\.\d+)?\b/ },
      { className: 'attr', begin: /\b[A-Za-z_][\w-]*(?=\s*=(?!=))/ }, // name = value
      { className: 'title function_', begin: /\b[a-z_]\w*(?=\()/ },   // jsonencode(…)
    ],
  };
}
