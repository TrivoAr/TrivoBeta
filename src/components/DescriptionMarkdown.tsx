// components/DescriptionMarkdown.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = { text: string; isNight?: boolean };

export default function DescriptionMarkdown({ text, isNight = false }: Props) {
  // fallback por si viene vacío o null desde la DB
  const safeText = (text ?? "").trim();

  return (
    <article
      className={`
        w-full rounded-2xl p-4 max-w-none leading-relaxed
        ${isNight
          ? 'prose prose-invert [&_p]:!text-white [&_p]:!font-light [&_strong]:!text-white [&_strong]:!font-semibold [&_em]:!text-gray-200 [&_li]:!text-white [&_ul]:!text-white [&_ol]:!text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_h4]:!text-white [&_h5]:!text-white [&_h6]:!text-white [&_blockquote]:!text-gray-200 [&_blockquote]:!border-l-gray-500 [&_code]:!text-gray-100 [&_code]:!bg-gray-800 [&_pre]:!bg-gray-800 [&_pre]:!text-gray-100 [&_a]:!text-blue-300 [&_a]:!underline hover:[&_a]:!text-blue-200'
          : 'prose prose-neutral dark:prose-invert'
        }
        prose-p:my-2 prose-li:my-1 prose-strong:font-semibold prose-h3:mt-3
      `}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {safeText || "_Sin descripción._"}
      </ReactMarkdown>
    </article>
  );
}
