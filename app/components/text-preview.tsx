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
    if (cursor < value.length) fragment.append(value.slice(cursor));
    textNode.replaceWith(fragment);
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
    <div className="shadow-brutal w-full max-w-[min(90vw,1100px)] overflow-hidden border-2 border-line-strong bg-panel">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-line px-3 py-2 sm:px-4">
        <span className="mr-auto font-mono text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
          Text preview
        </span>
        {!searchOpen ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="btn-hud-outline btn-hud-info btn-hud-sm px-2"
            aria-label="Search preview text"
            title="Search preview text"
          >
            <Search size={14} aria-hidden />
          </button>
        ) : (
          <>
            <label className="relative flex min-w-[10rem] items-center sm:min-w-[14rem]">
              <Search
                size={13}
                aria-hidden
                className="pointer-events-none absolute left-2 text-muted"
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
                className="h-8 w-full border border-line-strong bg-paper pr-7 pl-7 font-mono text-[11px] text-bone outline-none placeholder:text-muted/70 focus:border-info"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveMatch(0);
                  setSearchOpen(false);
                }}
                className="absolute right-1 flex h-6 w-6 items-center justify-center text-muted transition-colors hover:text-bone"
                aria-label="Close search"
                title="Close search"
              >
                <X size={13} aria-hidden />
              </button>
            </label>
            {searchQuery.trim() && (
              <span
                className="min-w-[3.5rem] text-center font-mono text-[10px] text-muted"
                aria-live="polite"
              >
                {`${matches.length ? activeIndex + 1 : 0}/${matches.length}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => moveMatch(-1)}
              disabled={!matches.length}
              className="btn-hud-outline btn-hud-info btn-hud-sm px-2"
              aria-label="Previous match"
              title="Previous match"
            >
              <ChevronUp size={14} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => moveMatch(1)}
              disabled={!matches.length}
              className="btn-hud-outline btn-hud-info btn-hud-sm px-2"
              aria-label="Next match"
              title="Next match"
            >
              <ChevronDown size={14} aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={copySource}
          className="btn-hud-outline btn-hud-info btn-hud-sm"
          title="Copy source text"
        >
          {copied ? (
            <Check size={13} aria-hidden />
          ) : (
            <Clipboard size={13} aria-hidden />
          )}
          <span>&nbsp;{copied ? "Copied" : "Copy text"}</span>
        </button>
        <span className="font-mono text-[10px] tracking-[0.16em] text-info uppercase">
          {language}
        </span>
      </div>
      <pre className="code-preview max-h-[calc(100dvh-20rem)] overflow-auto p-4 text-left font-mono text-xs leading-relaxed sm:p-5 sm:text-sm">
        <code
          ref={codeRef}
          dangerouslySetInnerHTML={{ __html: renderedSource }}
        />
      </pre>
    </div>
  );
}
