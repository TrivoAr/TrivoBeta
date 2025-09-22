"use client";

interface FilterOption {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

interface SearchFiltersProps {
  title: string;
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
  className?: string;
}

export default function SearchFilters({
  title,
  options,
  selected,
  onSelect,
  className = ""
}: SearchFiltersProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${selected === option.key
                ? "bg-[#C95100] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <div className="flex items-center gap-2">
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.label}
                  className="w-4 h-4"
                />
              )}
              <span>{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}