import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PersonCard } from '@/components/person-card';
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
import type { ListResponse, MissingPerson } from '@/lib/types';

const STATUS_FILTERS = ['all', 'pending', 'active', 'found', 'closed', 'reopened'] as const;

export default function CasesScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { isAuthenticated } = useAuth();

  const [people, setPeople] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');

  const load = useCallback(async () => {
    try {
      const res = await api<ListResponse<MissingPerson>>('/api/missing-persons?per_page=200');
      setPeople(res.data ?? []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases.');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!q) return true;
      return (
        p.full_name?.toLowerCase().includes(q) ||
        p.case_number?.toLowerCase().includes(q) ||
        p.last_seen_location?.toLowerCase().includes(q)
      );
    });
  }, [people, search, status]);

  const headerRight = (
    <>
      <LinkButton title="Notifications" onPress={() => router.push('/notifications')} />
      <LinkButton title="Profile" onPress={() => router.push('/profile')} />
    </>
  );

  return (
    <Screen>
      <ScreenHeader title="Cases" right={headerRight} />

      <View style={styles.toolbar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or case number"
          placeholderTextColor={palette.textSecondary}
          autoCapitalize="none"
          style={[styles.search, { color: palette.text, backgroundColor: palette.backgroundElement }]}
        />
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s)}
            style={[
              styles.chip,
              {
                backgroundColor: status === s ? '#208AEF' : palette.backgroundElement,
              },
            ]}>
            <Text style={[styles.chipText, { color: status === s ? '#FFFFFF' : palette.text }]}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={{ padding: 16 }}>
          <ErrorBanner message={error} />
        </View>
      ) : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={filtered}
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
            <EmptyState title="No cases" subtitle="Pull to refresh." />
          }
          renderItem={({ item }) => (
            <PersonCard
              person={item}
              layout="list"
              onPress={() => router.push(`/case/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  search: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
});
