"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Props = {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  maxChars?: number;
};

export default function DescriptionEditor({
  value,
  defaultValue = "",
  onChange,
  maxChars = 2000,
}: Props) {
  const [internal, setInternal] = useState(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  useEffect(() => {
    if (value === undefined) setInternal(defaultValue);
  }, [defaultValue, value]);

  const remaining = maxChars - internal.length;
  const counterClass =
    remaining < 0
      ? "text-red-400"
      : remaining < 80
        ? "text-yellow-400"
        : "text-gray-400";

  const placeholder = useMemo(
    () =>
      [
        "### 🧗‍♂️ Social Trek – El Gauchito",
        "Primera experiencia social de montaña en Tucumán. Caminamos juntos, subimos al Gauchito y cerramos con un after.",
        "",
        "**Opciones**",
        "- Solo trekking **$10.000**",
        "- Trekking + after *(tostado + bebida incluida)* **$5.000**",
        "",
        "**📅 Sábado 30 de Agosto – 9:00 AM**  ",
        "**📍 Av. Perón 2707**  ",
        "**⏱️ Duración:** 2h 30m  ",
        "**🥾 Distancia:** 15 km  ",
        "**⚡ Cupos limitados**  ",
        "✅ Actividad con prestador de turismo habilitado.",
      ].join("\n"),
    []
  );

  return (
    <div className="space-y-3">
      <textarea
        className="
          w-full min-h-48 rounded-xl bg-white border shadow-md
          p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500
        "
        value={internal}
        onChange={(e) => {
          const next = e.target.value;
          setInternal(next);
          onChange?.(next);
        }}
        placeholder={placeholder}
        maxLength={maxChars * 2}
      />

      <div className="flex items-center justify-between text-xs">
        <p className="text-gray-400">
          **, *, #, -, listas, tablas, links y checklists (GFM).
        </p>
        <p className={counterClass}>{remaining} caracteres</p>
      </div>

      <div className="rounded-xl bg-white border shadow-md">
        <div className="px-3 py-2 text-xs text-gray-400 border-b border-neutral-800">
          Previsualización
        </div>
        <article className="p-3 prose prose-neutral dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {internal || placeholder}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
