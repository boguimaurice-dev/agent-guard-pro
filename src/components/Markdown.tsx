import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? "").replace(/\n$/, "");
  const isBlock = /language-/.test(className ?? "") || text.includes("\n");

  if (!isBlock) {
    return <code className={className}>{children}</code>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="group relative my-3">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 z-10 rounded-md border border-border/60 bg-background/70 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition hover:text-foreground group-hover:opacity-100"
        aria-label="Copier le code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto rounded-lg border border-border/60 bg-black/40 p-4 text-xs leading-relaxed">
        <code className={className}>{text}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-secura">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ className, children }) => (
            <CodeBlock className={className}>{children}</CodeBlock>
          ),
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
