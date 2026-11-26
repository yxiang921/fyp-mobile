import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  EmptyState,
  ErrorBanner,
  LinkButton,
  Loading,
  Screen,
  ScreenHeader,
  usePalette,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format';
import type { AppNotification, ListResponse } from '@/lib/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<ListResponse<AppNotification>>('/api/notifications?per_page=100');
      setItems(res.data ?? []);
      setUnreadCount(res.unread_count ?? 0);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    load();
  }, [isAuthenticated, load, router]);

  const markRead = async (n: AppNotification) => {
    if (!n.is_unread) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_unread: false } : x)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api(`/api/notifications/${n.id}/read`, { method: 'POST' });
    } catch {
      // revert is unnecessary; next refresh will reconcile
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setItems((prev) => prev.map((x) => ({ ...x, is_unread: false })));
    setUnreadCount(0);
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
    } catch {
      // ignore
    }
  };

  const headerRight = (
    <LinkButton title="Mark all read" onPress={markAllRead} />
  );

  return (
    <Screen>
      <ScreenHeader
        title={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'}
        right={unreadCount > 0 ? headerRight : undefined}
        onBack={() => router.back()}
      />

      {error ? (
        <View style={{ padding: 16 }}>
          <ErrorBanner message={error} />
        </View>
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState title="No notifications" subtitle="Pull to refresh." />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                markRead(item);
                router.push({ pathname: '/notification/[id]', params: { id: String(item.id) } });
              }}
              style={[
                styles.card,
                {
                  backgroundColor: item.is_unread
                    ? '#208AEF1A'
                    : palette.backgroundElement,
                },
              ]}>
              <View style={styles.cardHead}>
                <Text
                  style={[
                    styles.title,
                    { color: palette.text, fontWeight: item.is_unread ? '700' : '600' },
                  ]}>
                  {item.title}
                </Text>
                {item.is_unread ? <View style={styles.dot} /> : null}
              </View>
              <Text style={[styles.message, { color: palette.textSecondary }]}>
                {item.message}
              </Text>
              <Text style={[styles.time, { color: palette.textSecondary }]}>
                {formatDateTime(item.created_at)}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 12,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 16,
    flexShrink: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#208AEF',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
});
