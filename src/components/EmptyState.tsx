"use client";
import Image from "next/image";

type Action = { label: string; onClick: () => void };
type LinkAction = { label: string; href: string };

export default function EmptyState({
  title,
  description,
  imageSrc = "/assets/empty/events-empty.svg", // poné un svg/png en public/assets/empty
  primaryAction,
  secondaryAction,
  linkAction,
}: {
  title: string;
  description?: string;
  subdecription?: string;
  imageSrc?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  linkAction?: LinkAction;
}) {
  return (
    <div
      role="status"
      className="w-full rounded-2xl p-6 flex flex-col justify-center items-center text-center gap-4"
    >
      <div className="relative w-40 h-52 opacity-90">
        <Image src={imageSrc} alt="" fill className="object-contain" />
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-md">{description}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="px-4 py-2 rounded-xl bg-[#C95100] text-white font-medium"
          >
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-4 py-2 rounded-xl border font-medium"
          >
            {secondaryAction.label}
          </button>
        )}
        {linkAction && (
          <a
            href={linkAction.href}
            className="px-4 py-2 rounded-xl border font-medium"
          >
            {linkAction.label}
          </a>
        )}
      </div>
    </div>
  );
}
