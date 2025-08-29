// components/DescriptionMarkdown.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = { text: string };

export default function DescriptionMarkdown({ text }: Props) {
  // fallback por si viene vacío o null desde la DB
  const safeText = (text ?? "").trim();

  return (
    <article
      className="
        w-full rounded-2xl p-4
        prose prose-neutral dark:prose-invert max-w-none
        prose-p:my-2 prose-li:my-1 prose-strong:font-semibold prose-h3:mt-3
        leading-relaxed
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {safeText || "_Sin descripción._"}
      </ReactMarkdown>
    </article>
  );
}
