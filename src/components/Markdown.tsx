import { cn } from "@/lib/utils";

function inline(text: string) {
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Lightweight markdown renderer for AI output (headings, lists, tables, paragraphs). */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^\|/.test(line.trim())) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test((lines[i] ?? "").trim())) {
        const raw = (lines[i] ?? "").trim();
        i++;
        if (/^\|[\s:-]+\|?$/.test(raw.replace(/\|/g, "|"))) continue;
        rows.push(
          raw
            .replace(/^\||\|$/g, "")
            .split("|")
            .map((c) => c.trim()),
        );
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            {head && (
              <thead className="bg-muted/60">
                <tr>
                  {head.map((cell, ci) => (
                    <th key={ci} className="px-3 py-2 text-left font-semibold">
                      {inline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-t border-border/70">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 align-top text-muted-foreground">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
      blocks.push(
        <p key={key++} className={cn("font-display font-semibold", sizes[level - 1])}>
          {inline(heading[2] ?? "")}
        </p>,
      );
      i++;
      continue;
    }

    if (/^\s*([-*•]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+\.)\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*([-*•]|\d+\.)\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{inline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#{1,4}\s|\||\s*([-*•]|\d+\.)\s)/.test(lines[i] ?? "")) {
      para.push(lines[i] ?? "");
      i++;
    }
    blocks.push(
      <p key={key++} className="text-sm leading-relaxed text-muted-foreground">
        {inline(para.join(" "))}
      </p>,
    );
  }

  return <div className={cn("space-y-3", className)}>{blocks}</div>;
}
