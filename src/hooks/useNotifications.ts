import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  nombre: string;
  imagen: string;
  fromUserId: string;
  actionUrl?: string;
  salidaId?: string;
  academiaId?: string;
  teamSocialId?: string;
}

// Hook para obtener todas las notificaciones
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch('/api/notificaciones');
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para marcar notificación como leída
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notificaciones/${notificationId}/markAsRead`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }
      return response.json();
    },
    onSuccess: (_, notificationId) => {
      // Actualizar el cache local
      queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        );
      });
    },
  });
}

// Hook para obtener el conteo de notificaciones no leídas
export function useUnreadNotificationsCount() {
  const { data: notifications } = useNotifications();
  
  return notifications?.filter(notification => !notification.read).length || 0;
}

// Hook para invalidar y refrescar notificaciones
export function useRefreshNotifications() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}