import { useState } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-line dark:border-dark-border bg-[#0D1117] text-[#E6EDF3] shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#161B22] border-b border-[#30363D] text-xs font-mono text-muted dark:text-dark-muted">
        <span className="uppercase text-[11px] font-semibold text-emerald-400">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#30363D] transition-colors text-xs text-muted hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-highland" />
              <span className="text-highland text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function AIMessageContent({ content = "", isStreaming = false }) {
  if (!content) return null;

  // Split content by code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "text",
      code: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  // Parse inline markdown within normal text segments
  const renderInlineFormatted = (text) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="font-semibold text-base text-ink dark:text-dark-text mt-3 mb-1">
            {formatSpans(line.slice(4))}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={lineIdx} className="font-semibold text-lg text-ink dark:text-dark-text mt-4 mb-2">
            {formatSpans(line.slice(3))}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={lineIdx} className="font-display font-semibold text-xl text-ink dark:text-dark-text mt-4 mb-2">
            {formatSpans(line.slice(2))}
          </h2>
        );
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={lineIdx}
            className="border-l-4 border-highland/60 pl-3 my-2 text-sm italic text-muted dark:text-dark-muted"
          >
            {formatSpans(line.slice(2))}
          </blockquote>
        );
      }

      // Bullet lists
      if (/^[-*]\s+/.test(line)) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-sm my-0.5 leading-relaxed">
            {formatSpans(line.replace(/^[-*]\s+/, ""))}
          </li>
        );
      }

      // Numbered lists
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li key={lineIdx} className="ml-4 list-decimal text-sm my-0.5 leading-relaxed">
            {formatSpans(line.replace(/^\d+\.\s+/, ""))}
          </li>
        );
      }

      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-sm leading-relaxed my-1">
          {formatSpans(line)}
        </p>
      );
    });
  };

  const formatSpans = (text) => {
    // Matches **bold**, *italic*, and `inline code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const segments = text.split(regex);

    return segments.map((seg, i) => {
      if (!seg) return null;
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={i} className="font-semibold text-ink dark:text-white">{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith("*") && seg.endsWith("*")) {
        return <em key={i} className="italic">{seg.slice(1, -1)}</em>;
      }
      if (seg.startsWith("`") && seg.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-mist text-highland dark:bg-dark-surface dark:text-highland-light border border-line/50 dark:border-dark-border"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }
      return seg;
    });
  };

  return (
    <div className="space-y-1 text-sm text-ink/90 dark:text-dark-text/90 leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.type === "code") {
          return <CodeBlock key={idx} language={part.language} code={part.code} />;
        }
        return <div key={idx}>{renderInlineFormatted(part.content)}</div>;
      })}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-highland animate-pulse align-middle" />
      )}
    </div>
  );
}
