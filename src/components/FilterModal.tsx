"use client";

import React from "react";
import { X, Filter } from "lucide-react";
import { SlideUpModal } from "@/components/base/AnimatedModal";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  title?: string;
  filters: FilterConfig[];
  currentValues?: FilterValues;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multiselect";
  options: FilterOption[];
  icon?: React.ReactNode;
  placeholder?: string;
}

interface FilterValues {
  [key: string]: string | string[];
}

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  title = "Filtros",
  filters,
  currentValues = {},
}: FilterModalProps) {
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Detect dark mode
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize filter values with current values only when modal opens
  React.useEffect(() => {
    if (isOpen) {
      console.log("Modal opened, current values:", currentValues);
      const initialValues: FilterValues = {};
      filters.forEach((filter) => {
        // Use current values if available, otherwise use default
        initialValues[filter.key] =
          currentValues[filter.key] ||
          (filter.type === "multiselect" ? [] : "");
      });
      console.log("Setting initial values in modal:", initialValues);
      setFilterValues(initialValues);
      setHasChanges(false); // Reset changes when modal opens
    }
  }, [isOpen, currentValues, filters]); // Include all dependencies

  const handleFilterChange = (key: string, value: string | string[]) => {
    console.log("Filter changed:", key, "=", value);
    setFilterValues((prev) => {
      const newValues = {
        ...prev,
        [key]: value,
      };
      console.log("New filter values:", newValues);
      return newValues;
    });
    setHasChanges(true); // Mark as changed when any filter is modified
    console.log("hasChanges set to true");
  };

  const handleApply = () => {
    console.log("FilterModal handleApply called with values:", filterValues);
    onApply(filterValues);
    setHasChanges(false);
    onClose();
  };

  const handleClear = () => {
    const clearedValues: FilterValues = {};
    filters.forEach((filter) => {
      clearedValues[filter.key] = filter.type === "multiselect" ? [] : "";
    });
    setFilterValues(clearedValues);
    setHasChanges(true);
  };

  const getActiveFilterCount = () => {
    return Object.values(filterValues).filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== "";
    }).length;
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <SlideUpModal
        isOpen={isOpen}
        onClose={onClose}
        size="default"
        showCloseButton={false}
        className="rounded-t-3xl rounded-b-none max-w-[390px] !p-0 mx-auto !mb-0 !mt-auto shadow-2xl !max-h-[85vh]"
        backdropClassName="!items-end !justify-center !p-0"
        zIndex={99999}
        closeOnBackdrop={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C95100]/10 dark:bg-[#C95100]/20 rounded-xl">
              <Filter size={18} className="text-[#C95100]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {title}
              </h3>
              {getActiveFilterCount() > 0 && (
                <p className="text-sm text-[#C95100]">
                  {getActiveFilterCount()} filtro
                  {getActiveFilterCount() !== 1 ? "s" : ""} activo
                  {getActiveFilterCount() !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                {filter.icon && (
                  <span className="text-[#C95100]">{filter.icon}</span>
                )}
                {filter.label}
              </label>

              {filter.type === "select" && (
                <select
                  value={(filterValues[filter.key] as string) || ""}
                  onChange={(e) =>
                    handleFilterChange(filter.key, e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C95100] focus:border-[#C95100] transition-colors"
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === "multiselect" && (
                <div className="space-y-2">
                  {filter.options.map((option) => {
                    const isSelected = (
                      filterValues[filter.key] as string[]
                    )?.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 bg-white dark:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentValues =
                              (filterValues[filter.key] as string[]) || [];
                            if (e.target.checked) {
                              handleFilterChange(filter.key, [
                                ...currentValues,
                                option.value,
                              ]);
                            } else {
                              handleFilterChange(
                                filter.key,
                                currentValues.filter((v) => v !== option.value)
                              );
                            }
                          }}
                          className="w-4 h-4 text-[#C95100] border border-gray-300 dark:border-gray-600 rounded focus:ring-[#C95100] focus:ring-2"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Limpiar
            </button>
            <button
              onClick={handleApply}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                hasChanges
                  ? "bg-[#C95100] text-white hover:bg-[#A03D00]"
                  : "bg-[#C95100]/50 text-white/70 cursor-not-allowed"
              }`}
              disabled={!hasChanges}
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </SlideUpModal>
    </div>
  );
}

// Export types for reuse
export type { FilterOption, FilterConfig, FilterValues };
