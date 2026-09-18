import type { LanguageFn } from "highlight.js";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cpp from "highlight.js/lib/languages/cpp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import objectivec from "highlight.js/lib/languages/objectivec";
import perl from "highlight.js/lib/languages/perl";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const languages: Record<string, LanguageFn> = {
  bash,
  cpp,
  css,
  go,
  ini,
  java,
  javascript,
  json,
  kotlin,
  markdown,
  objectivec,
  perl,
  php,
  python,
  ruby,
  rust,
  sql,
  typescript,
  xml,
  yaml,
};

for (const [name, language] of Object.entries(languages)) {
  hljs.registerLanguage(name, language);
}

const extensionLanguages: Record<string, string> = {
  asm: "cpp",
  c: "cpp",
  cc: "cpp",
  conf: "ini",
  cpp: "cpp",
  css: "css",
  csv: "plaintext",
  cxx: "cpp",
  dockerfile: "bash",
  env: "bash",
  go: "go",
  h: "cpp",
  hpp: "cpp",
  htm: "xml",
  html: "xml",
  ini: "ini",
  java: "java",
  js: "javascript",
  json: "json",
  json5: "json",
  jsonl: "json",
  jsx: "javascript",
  kt: "kotlin",
  kts: "kotlin",
  log: "plaintext",
  md: "markdown",
  markdown: "markdown",
  mjs: "javascript",
  mts: "typescript",
  perl: "perl",
  php: "php",
  pl: "perl",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sass: "css",
  scss: "css",
  sh: "bash",
  sql: "sql",
  svg: "xml",
  toml: "ini",
  ts: "typescript",
  tsx: "typescript",
  txt: "plaintext",
  xml: "xml",
  xhtml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

const mimeLanguages: Array<[RegExp, string]> = [
  [/^text\/css(?:$|;)/, "css"],
  [/^text\/html(?:$|;)/, "xml"],
  [/^text\/markdown(?:$|;)/, "markdown"],
  [/^text\/x-python(?:$|;)/, "python"],
  [/^application\/(?:json|.+\+json)(?:$|;)/, "json"],
  [/^application\/(?:javascript|x-javascript|typescript)(?:$|;)/, "javascript"],
  [/^application\/(?:xml|.+\+xml)(?:$|;)/, "xml"],
  [/^application\/(?:yaml|x-yaml)(?:$|;)/, "yaml"],
  [/^application\/sql(?:$|;)/, "sql"],
  [/^text\//, "plaintext"],
];

export const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024;

function extensionOf(name: string): string {
  const normalized = name.toLowerCase().split(/[?#]/)[0];
  if (normalized.endsWith("/dockerfile") || normalized === "dockerfile") {
    return "dockerfile";
  }
  return normalized.split(".").pop() || "";
}

export function getTextPreviewLanguage(
  fileType: string | undefined,
  fileName: string,
): string | null {
  const extensionLanguage = extensionLanguages[extensionOf(fileName)];
  if (extensionLanguage) return extensionLanguage;

  const mimeLanguage = mimeLanguages.find(([pattern]) =>
    pattern.test(fileType || ""),
  )?.[1];
  return mimeLanguage || null;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] || character,
  );
}

export function highlightSource(source: string, language: string): string {
  if (language === "plaintext" || !hljs.getLanguage(language)) {
    return escapeHtml(source);
  }

  try {
    return hljs.highlight(source, {
      language,
      ignoreIllegals: true,
    }).value;
  } catch {
    return escapeHtml(source);
  }
}
