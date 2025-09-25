'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ThemeFlags, SeasonalTheme, ThemeDateRange } from '@/lib/theme/types';

async function fetchThemeFlags(): Promise<ThemeFlags> {
  const response = await fetch('/api/themes/global');
  if (!response.ok) {
    throw new Error('Failed to fetch theme flags');
  }
  return response.json();
}

async function updateThemeFlags(flags: ThemeFlags): Promise<ThemeFlags> {
  const response = await fetch('/api/themes/global', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flags),
  });

  if (!response.ok) {
    throw new Error('Failed to update theme flags');
  }

  return response.json();
}

const seasonalThemes: { value: SeasonalTheme; label: string }[] = [
  { value: 'none', label: 'Ninguno' },
  { value: 'halloween', label: 'Halloween' },
  { value: 'christmas', label: 'Navidad' },
  { value: 'newyear', label: 'Año Nuevo' },
];

export default function AdminThemePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['theme-flags'],
    queryFn: fetchThemeFlags,
  });

  const [formData, setFormData] = useState<ThemeFlags | null>(null);

  const mutation = useMutation({
    mutationFn: updateThemeFlags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['theme-flags'] });
      toast.success('Configuración actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar configuración');
      console.error(error);
    },
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.rol !== 'admin') {
    router.push('/login');
    return null;
  }

  if (isLoading || !flags) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentData = formData || flags;

  const handleSave = () => {
    if (!currentData) return;
    mutation.mutate(currentData);
  };

  const handleSeasonalThemeChange = (theme: SeasonalTheme) => {
    if (!currentData) return;
    setFormData({ ...currentData, activeSeasonalTheme: theme });
  };

  const handleEnabledChange = (enabled: boolean) => {
    if (!currentData) return;
    setFormData({ ...currentData, enabled });
  };

  const addDateRange = () => {
    if (!currentData) return;
    const newRange: ThemeDateRange = {
      theme: 'halloween',
      start: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59.999Z',
    };
    setFormData({
      ...currentData,
      dateRanges: [...currentData.dateRanges, newRange],
    });
  };

  const updateDateRange = (index: number, range: ThemeDateRange) => {
    if (!currentData) return;
    const newRanges = [...currentData.dateRanges];
    newRanges[index] = range;
    setFormData({ ...currentData, dateRanges: newRanges });
  };

  const removeDateRange = (index: number) => {
    if (!currentData) return;
    const newRanges = currentData.dateRanges.filter((_, i) => i !== index);
    setFormData({ ...currentData, dateRanges: newRanges });
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 w-full max-w-[390px] mx-auto sm:max-w-2xl sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">Configuración de Temas</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base sm:mt-2">
          Gestiona los temas estacionales y configuraciones globales
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="bg-card border rounded-lg p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado del Sistema
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={currentData.enabled}
                  onChange={(e) => handleEnabledChange(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 bg-background border-border rounded focus:ring-orange-500"
                />
                <span className="text-sm text-foreground flex-1">
                  Habilitar sistema de temas estacionales
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tema Estacional Activo
              </label>
              <select
                value={currentData.activeSeasonalTheme}
                onChange={(e) => handleSeasonalThemeChange(e.target.value as SeasonalTheme)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
              >
                {seasonalThemes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Rangos de Fechas</h3>
            <button
              onClick={addDateRange}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors w-full sm:w-auto"
            >
              <Plus size={16} />
              Agregar Rango
            </button>
          </div>

          <div className="space-y-3">
            {currentData.dateRanges.map((range, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-md space-y-3">
                {/* Móvil: Layout vertical */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <select
                      value={range.theme}
                      onChange={(e) =>
                        updateDateRange(index, { ...range, theme: e.target.value as SeasonalTheme })
                      }
                      className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm mr-2"
                    >
                      {seasonalThemes.filter(t => t.value !== 'none').map((theme) => (
                        <option key={theme.value} value={theme.value}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeDateRange(index)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors hover:bg-red-50 rounded-md"
                      aria-label="Eliminar rango"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Inicio:</label>
                      <input
                        type="datetime-local"
                        value={range.start.slice(0, -5)}
                        onChange={(e) =>
                          updateDateRange(index, { ...range, start: e.target.value + '.000Z' })
                        }
                        className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Fin:</label>
                      <input
                        type="datetime-local"
                        value={range.end.slice(0, -5)}
                        onChange={(e) =>
                          updateDateRange(index, { ...range, end: e.target.value + '.000Z' })
                        }
                        className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Layout horizontal */}
                <div className="hidden sm:flex items-center gap-3">
                  <select
                    value={range.theme}
                    onChange={(e) =>
                      updateDateRange(index, { ...range, theme: e.target.value as SeasonalTheme })
                    }
                    className="px-2 py-1 bg-background border border-border rounded text-sm"
                  >
                    {seasonalThemes.filter(t => t.value !== 'none').map((theme) => (
                      <option key={theme.value} value={theme.value}>
                        {theme.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    value={range.start.slice(0, -5)}
                    onChange={(e) =>
                      updateDateRange(index, { ...range, start: e.target.value + '.000Z' })
                    }
                    className="px-2 py-1 bg-background border border-border rounded text-sm"
                  />

                  <input
                    type="datetime-local"
                    value={range.end.slice(0, -5)}
                    onChange={(e) =>
                      updateDateRange(index, { ...range, end: e.target.value + '.000Z' })
                    }
                    className="px-2 py-1 bg-background border border-border rounded text-sm"
                  />

                  <button
                    onClick={() => removeDateRange(index)}
                    className="p-1 text-red-600 hover:text-red-700 transition-colors"
                    aria-label="Eliminar rango"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {currentData.dateRanges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 sm:py-8">
                No hay rangos de fechas configurados
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors w-full sm:w-auto"
          >
            <Save size={16} />
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}