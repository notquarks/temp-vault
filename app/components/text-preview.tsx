import {
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { highlightSource } from "~/lib/text-preview";

interface TextPreviewProps {
  source: string;
  language: string;
}

function findMatches(source: string, query: string): number[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const normalizedSource = source.toLocaleLowerCase();
  const matches: number[] = [];
  let offset = 0;
  while (offset <= normalizedSource.length) {
    const match = normalizedSource.indexOf(normalizedQuery, offset);
    if (match === -1) break;
    matches.push(match);
    offset = match + Math.max(1, normalizedQuery.length);
  }
  return matches;
}

function addSearchHighlights(
  html: string,
  query: string,
  activeMatch: number,
): string {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery || typeof document === "undefined") return html;

  const container = document.createElement("div");
  container.innerHTML = html;
  const walker = document.createTreeWalker(container, 4);
  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  let matchIndex = 0;
  for (const textNode of textNodes) {
    const value = textNode.nodeValue || "";
    const normalizedValue = value.toLocaleLowerCase();
    let cursor = 0;
    let match = normalizedValue.indexOf(normalizedQuery, cursor);
    if (match === -1) continue;

    const fragment = document.createDocumentFragment();
    while (match !== -1) {
      if (match > cursor) {
        fragment.append(value.slice(cursor, match));
      }
      const end = match + normalizedQuery.length;
      const marker = document.createElement("mark");
      marker.className =
        matchIndex === activeMatch
          ? "code-search-match code-search-match-active"
          : "code-search-match";
      marker.dataset.matchIndex = String(matchIndex);
      marker.textContent = value.slice(match, end);
      fragment.append(marker);
      matchIndex += 1;
      cursor = end;
      match = normalizedValue.indexOf(normalizedQuery, cursor);
    }
    if (cursor < value.length) {
      fragment.append(value.slice(cursor));
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return container.innerHTML;
}

export default function TextPreview({ source, language }: TextPreviewProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const highlightedSource = useMemo(
    () => highlightSource(source, language),
    [source, language],
  );
  const matches = useMemo(
    () => findMatches(source, searchQuery),
    [source, searchQuery],
  );
  const activeIndex = matches.length
    ? Math.min(activeMatch, matches.length - 1)
    : 0;
  const renderedSource = useMemo(
    () => addSearchHighlights(highlightedSource, searchQuery, activeIndex),
    [highlightedSource, searchQuery, activeIndex],
  );

  useEffect(() => {
    if (!codeRef.current || !searchQuery || !matches.length) return;
    const match = codeRef.current.querySelector<HTMLElement>(
      `[data-match-index="${activeIndex}"]`,
    );
    match?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex, matches.length, searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const moveMatch = (direction: number) => {
    if (!matches.length) return;
    setActiveMatch(
      (current) => (current + direction + matches.length) % matches.length,
    );
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="vault-card flex w-full min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="card-heading">Source</h2>
          <span className="inline-flex min-h-8 items-center rounded-full bg-paper px-3 font-mono text-xs text-bone">
            {language}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!searchOpen ? (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="btn-hud-outline btn-hud-sm"
              aria-label="Open text search"
              title="Search text"
            >
              <Search size={15} strokeWidth={2} aria-hidden />
              <span>Search</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex min-w-48 flex-1 items-center sm:w-64">
                <Search
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-4 text-muted"
                  aria-hidden
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setActiveMatch(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      moveMatch(event.shiftKey ? -1 : 1);
                    }
                    if (event.key === "Escape") {
                      setSearchQuery("");
                      setActiveMatch(0);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search text"
                  aria-label="Search preview text"
                  className="min-h-11 w-full py-2 pr-11 pl-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveMatch(0);
                    setSearchOpen(false);
                  }}
                  className="absolute right-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-bone"
                  aria-label="Close text search"
                >
                  <X size={15} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <span
                className="px-2 font-mono text-xs text-muted"
                aria-live="polite"
              >
                {searchQuery
                  ? `${matches.length ? activeIndex + 1 : 0}/${matches.length}`
                  : "0/0"}
              </span>
              <button
                type="button"
                onClick={() => moveMatch(-1)}
                disabled={matches.length === 0}
                className="btn-hud-outline btn-hud-sm px-3"
                aria-label="Previous match"
                title="Previous match"
              >
                <ChevronUp size={15} strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => moveMatch(1)}
                disabled={matches.length === 0}
                className="btn-hud-outline btn-hud-sm px-3"
                aria-label="Next match"
                title="Next match"
              >
                <ChevronDown size={15} strokeWidth={2} aria-hidden />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={copySource}
            className="btn-hud-primary btn-hud-sm"
            title="Copy source text"
          >
            {copied ? (
              <Check size={15} strokeWidth={2} aria-hidden />
            ) : (
              <Clipboard size={15} strokeWidth={2} aria-hidden />
            )}
            <span aria-live="polite">{copied ? "Copied" : "Copy text"}</span>
          </button>
        </div>
      </div>

      <pre
        tabIndex={0}
        aria-label="File text content"
        className="code-preview max-h-[60dvh] overflow-auto rounded-3xl bg-paper p-4 text-left font-mono text-xs leading-relaxed sm:p-6 sm:text-sm"
      >
        <code
          ref={codeRef}
          dangerouslySetInnerHTML={{ __html: renderedSource }}
        />
      </pre>
    </div>
  );
}
