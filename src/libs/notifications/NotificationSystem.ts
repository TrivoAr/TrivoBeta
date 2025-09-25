'use client';

import React from 'react';
import { observabilitySystem } from '../performance/ObservabilitySystem';

/**
 * Notification Types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationChannel = 'in-app' | 'push' | 'email' | 'sms' | 'webhook';

/**
 * Notification Definition
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  userId?: string;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  actions?: NotificationAction[];
  metadata: {
    read: boolean;
    dismissed: boolean;
    clicked: boolean;
    expiresAt?: number;
    category?: string;
    source?: string;
    groupId?: string;
  };
}

/**
 * Notification Action
 */
export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  variant?: 'primary' | 'secondary' | 'danger';
  url?: string;
  handler?: () => void | Promise<void>;
}

/**
 * Real-time Event
 */
export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Subscription
 */
export interface NotificationSubscription {
  userId: string;
  channels: NotificationChannel[];
  preferences: {
    types: NotificationType[];
    categories: string[];
    minPriority: NotificationPriority;
    quietHours?: {
      start: string; // HH:mm format
      end: string;
    };
  };
  endpoints?: {
    push?: string;
    webhook?: string;
  };
}

/**
 * Advanced Real-time Notification System
 */
export class NotificationSystem {
  private notifications: Map<string, Notification> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private eventSource: EventSource | null = null;
  private webSocket: WebSocket | null = null;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private notificationQueue: Notification[] = [];
  private isOnline = true;
  private config: NotificationSystemConfig;

  constructor(config: Partial<NotificationSystemConfig> = {}) {
    this.config = {
      maxNotifications: 100,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      enablePush: true,
      enableRealtime: true,
      realtimeUrl: '/api/realtime',
      pushEndpoint: '/api/push/subscribe',
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      ...config
    };

    this.initializeEventListeners();
    this.initializeServiceWorker();
    this.initializeRealtime();
  }

  /**
   * Send notification
   */
  async sendNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'metadata'>
  ): Promise<string> {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      metadata: {
        read: false,
        dismissed: false,
        clicked: false,
        expiresAt: Date.now() + this.config.defaultTTL,
        ...notification.data?.metadata
      }
    };

    // Store notification
    this.notifications.set(id, fullNotification);

    // Process through channels
    await this.processNotificationChannels(fullNotification);

    // Emit to listeners
    this.emit('notification:created', fullNotification);

    // Record metrics
    observabilitySystem.incrementCounter('notifications_sent', 1, {
      type: notification.type,
      priority: notification.priority
    });

    observabilitySystem.recordEvent('notification_sent', 'info', {
      notificationId: id,
      type: notification.type,
      priority: notification.priority,
      channels: notification.channels
    });

    // Cleanup old notifications
    this.cleanup();

    return id;
  }

  /**
   * Send to specific user
   */
  async sendToUser(
    userId: string,
    notification: Omit<Notification, 'id' | 'timestamp' | 'metadata' | 'userId'>
  ): Promise<string> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      throw new Error(`No subscription found for user ${userId}`);
    }

    // Filter by user preferences
    if (!this.shouldSendToUser(notification, subscription)) {
      observabilitySystem.recordEvent('notification_filtered', 'info', {
        userId,
        reason: 'user_preferences'
      });
      return '';
    }

    return this.sendNotification({
      ...notification,
      userId,
      channels: subscription.channels
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(
    notifications: Array<Omit<Notification, 'id' | 'timestamp' | 'metadata'>>
  ): Promise<string[]> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    );

    const successfulIds = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);

    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (errors.length > 0) {
      observabilitySystem.recordEvent('bulk_notification_errors', 'error', {
        errorCount: errors.length,
        totalCount: notifications.length
      });
    }

    return successfulIds;
  }

  /**
   * Subscribe user to notifications
   */
  async subscribe(subscription: NotificationSubscription): Promise<void> {
    this.subscriptions.set(subscription.userId, subscription);

    // Setup push notifications if enabled
    if (subscription.channels.includes('push') && this.config.enablePush) {
      await this.setupPushSubscription(subscription);
    }

    observabilitySystem.recordEvent('user_subscribed', 'info', {
      userId: subscription.userId,
      channels: subscription.channels
    });
  }

  /**
   * Unsubscribe user
   */
  async unsubscribe(userId: string): Promise<void> {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      this.subscriptions.delete(userId);

      // Remove push subscription
      if (subscription.channels.includes('push')) {
        await this.removePushSubscription(userId);
      }

      observabilitySystem.recordEvent('user_unsubscribed', 'info', { userId });
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.metadata.read = true;
    this.emit('notification:read', notification);

    observabilitySystem.recordEvent('notification_read', 'info', {
      notificationId,
      type: notification.type
    });

    return true;
  }

  /**
   * Mark notification as dismissed
   */
  dismiss(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.metadata.dismissed = true;
    this.emit('notification:dismissed', notification);

    observabilitySystem.recordEvent('notification_dismissed', 'info', {
      notificationId,
      type: notification.type
    });

    return true;
  }

  /**
   * Execute notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return false;

    try {
      if (action.handler) {
        await action.handler();
      } else if (action.url) {
        window.location.href = action.url;
      }

      notification.metadata.clicked = true;
      this.emit('notification:action', { notification, action });

      observabilitySystem.recordEvent('notification_action_executed', 'info', {
        notificationId,
        actionId,
        actionType: action.type
      });

      return true;
    } catch (error) {
      observabilitySystem.recordEvent('notification_action_error', 'error', {
        notificationId,
        actionId,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Get notifications for user
   */
  getNotifications(
    userId?: string,
    filters: {
      type?: NotificationType;
      read?: boolean;
      dismissed?: boolean;
      limit?: number;
    } = {}
  ): Notification[] {
    let notifications = Array.from(this.notifications.values());

    // Filter by user
    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    // Apply filters
    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }

    if (filters.read !== undefined) {
      notifications = notifications.filter(n => n.metadata.read === filters.read);
    }

    if (filters.dismissed !== undefined) {
      notifications = notifications.filter(n => n.metadata.dismissed === filters.dismissed);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters.limit) {
      notifications = notifications.slice(0, filters.limit);
    }

    return notifications;
  }

  /**
   * Get unread count for user
   */
  getUnreadCount(userId: string): number {
    return this.getNotifications(userId, { read: false, dismissed: false }).length;
  }

  /**
   * Clear all notifications for user
   */
  clearAll(userId: string): void {
    const userNotifications = this.getNotifications(userId);
    userNotifications.forEach(notification => {
      this.notifications.delete(notification.id);
    });

    observabilitySystem.recordEvent('notifications_cleared', 'info', {
      userId,
      count: userNotifications.length
    });
  }

  /**
   * Listen to real-time events
   */
  on(eventType: string, callback: (event: RealtimeEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, payload: any): void {
    const event: RealtimeEvent = {
      type: eventType,
      payload,
      timestamp: Date.now()
    };

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Process notification through channels
   */
  private async processNotificationChannels(notification: Notification): Promise<void> {
    const promises = notification.channels.map(async channel => {
      try {
        switch (channel) {
          case 'in-app':
            await this.sendInAppNotification(notification);
            break;
          case 'push':
            await this.sendPushNotification(notification);
            break;
          case 'email':
            await this.sendEmailNotification(notification);
            break;
          case 'webhook':
            await this.sendWebhookNotification(notification);
            break;
        }
      } catch (error) {
        observabilitySystem.recordEvent('notification_channel_error', 'error', {
          notificationId: notification.id,
          channel,
          error: (error as Error).message
        });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: Notification): Promise<void> {
    // Emit to real-time listeners
    this.emit('in-app:notification', notification);

    // If offline, queue for later
    if (!this.isOnline) {
      this.notificationQueue.push(notification);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      await this.serviceWorker.showNotification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        badge: '/icons/notification-badge.png',
        tag: notification.id,
        data: notification.data,
        actions: notification.actions?.map(action => ({
          action: action.id,
          title: action.label
        })),
        requireInteraction: notification.priority === 'critical'
      });
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!notification.userId) return;

    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: notification.userId,
        subject: notification.title,
        body: notification.message,
        data: notification.data
      })
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(notification: Notification): Promise<void> {
    const subscription = notification.userId
      ? this.subscriptions.get(notification.userId)
      : null;

    const webhookUrl = subscription?.endpoints?.webhook;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });
  }

  /**
   * Check if notification should be sent to user
   */
  private shouldSendToUser(
    notification: Omit<Notification, 'id' | 'timestamp' | 'metadata' | 'userId'>,
    subscription: NotificationSubscription
  ): boolean {
    // Check type preference
    if (!subscription.preferences.types.includes(notification.type)) {
      return false;
    }

    // Check priority
    const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    if (priorityOrder[notification.priority] < priorityOrder[subscription.preferences.minPriority]) {
      return false;
    }

    // Check category
    const category = notification.data?.metadata?.category;
    if (category && !subscription.preferences.categories.includes(category)) {
      return false;
    }

    // Check quiet hours
    if (subscription.preferences.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = subscription.preferences.quietHours;

      if (start <= end) {
        // Same day range
        if (currentTime >= start && currentTime <= end) {
          return notification.priority === 'critical';
        }
      } else {
        // Overnight range
        if (currentTime >= start || currentTime <= end) {
          return notification.priority === 'critical';
        }
      }
    }

    return true;
  }

  /**
   * Setup push subscription
   */
  private async setupPushSubscription(subscription: NotificationSubscription): Promise<void> {
    if (!this.serviceWorker || !this.config.vapidPublicKey) return;

    try {
      const pushSubscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidPublicKey)
      });

      // Send subscription to server
      await fetch(this.config.pushEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: subscription.userId,
          subscription: pushSubscription
        })
      });
    } catch (error) {
      console.error('Push subscription setup error:', error);
    }
  }

  /**
   * Remove push subscription
   */
  private async removePushSubscription(userId: string): Promise<void> {
    await fetch(`${this.config.pushEndpoint}/${userId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedNotifications();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility for pausing/resuming
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.emit('app:focused', {});
      } else {
        this.emit('app:blurred', {});
      }
    });
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration;

      // Handle notification clicks
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          this.emit('notification:click', event.data.notification);
        }
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  /**
   * Initialize real-time connection
   */
  private initializeRealtime(): void {
    if (!this.config.enableRealtime || typeof window === 'undefined') return;

    // Try WebSocket first, fallback to EventSource
    this.connectWebSocket() || this.connectEventSource();
  }

  /**
   * Connect WebSocket
   */
  private connectWebSocket(): boolean {
    if (!window.WebSocket) return false;

    try {
      const wsUrl = this.config.realtimeUrl!.replace('http', 'ws');
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('realtime:message', data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.webSocket.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 5000); // Retry after 5 seconds
      };

      return true;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return false;
    }
  }

  /**
   * Connect EventSource
   */
  private connectEventSource(): boolean {
    if (!window.EventSource) return false;

    try {
      this.eventSource = new EventSource(this.config.realtimeUrl!);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('realtime:message', data);
        } catch (error) {
          console.error('EventSource message parse error:', error);
        }
      };

      this.eventSource.onerror = () => {
        setTimeout(() => this.connectEventSource(), 5000); // Retry after 5 seconds
      };

      return true;
    } catch (error) {
      console.error('EventSource connection error:', error);
      return false;
    }
  }

  /**
   * Process queued notifications
   */
  private processQueuedNotifications(): void {
    const queue = [...this.notificationQueue];
    this.notificationQueue = [];

    queue.forEach(notification => {
      this.sendInAppNotification(notification);
    });
  }

  /**
   * Cleanup expired notifications
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [id, notification] of Array.from(this.notifications.entries())) {
      if (notification.metadata.expiresAt && notification.metadata.expiresAt < now) {
        toDelete.push(id);
      }
    }

    // Keep only the most recent notifications if we exceed max
    if (this.notifications.size > this.config.maxNotifications) {
      const sortedNotifications = Array.from(this.notifications.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp);

      const toKeep = sortedNotifications.slice(0, this.config.maxNotifications);
      this.notifications.clear();
      toKeep.forEach(([id, notification]) => {
        this.notifications.set(id, notification);
      });
    } else {
      toDelete.forEach(id => this.notifications.delete(id));
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

/**
 * Notification System Configuration
 */
export interface NotificationSystemConfig {
  maxNotifications: number;
  defaultTTL: number;
  enablePush: boolean;
  enableRealtime: boolean;
  realtimeUrl: string;
  pushEndpoint: string;
  vapidPublicKey?: string;
}

/**
 * Global notification system instance
 */
export const notificationSystem = new NotificationSystem();

/**
 * React Hook for Notifications
 */
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const updateNotifications = () => {
      const userNotifications = notificationSystem.getNotifications(userId);
      setNotifications(userNotifications);
      setUnreadCount(notificationSystem.getUnreadCount(userId || ''));
    };

    updateNotifications();

    // Subscribe to notification events
    const unsubscribers = [
      notificationSystem.on('notification:created', updateNotifications),
      notificationSystem.on('notification:read', updateNotifications),
      notificationSystem.on('notification:dismissed', updateNotifications)
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    send: notificationSystem.sendNotification.bind(notificationSystem),
    sendToUser: notificationSystem.sendToUser.bind(notificationSystem),
    markAsRead: notificationSystem.markAsRead.bind(notificationSystem),
    dismiss: notificationSystem.dismiss.bind(notificationSystem),
    executeAction: notificationSystem.executeAction.bind(notificationSystem),
    clearAll: () => notificationSystem.clearAll(userId || ''),
    subscribe: notificationSystem.subscribe.bind(notificationSystem),
    on: notificationSystem.on.bind(notificationSystem)
  };
}