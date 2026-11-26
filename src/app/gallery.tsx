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
import { LanguagePicker } from '@/components/report-controls';
import { useI18n } from '@/lib/i18n';
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

export default function GalleryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const palette = usePalette();
  const { isAuthenticated } = useAuth();

  const [people, setPeople] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api<ListResponse<MissingPerson>>(
        '/api/missing-persons?status=active&per_page=100',
      );
      setPeople(res.data ?? []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load missing persons.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.case_number?.toLowerCase().includes(q) ||
        p.last_seen_location?.toLowerCase().includes(q),
    );
  }, [people, search]);

  const headerRight = (
    <>
      {!isAuthenticated ? <LinkButton title="Sign in" onPress={() => router.push('/login')} /> : null}
      <LinkButton title="Report" onPress={() => router.push('/report')} />
    </>
  );

  return (
    <Screen>
      <ScreenHeader title="Missing Persons" right={headerRight} />
      <LanguagePicker />
      <View style={{flexDirection:'row',gap:20,paddingHorizontal:16}}>
        <LinkButton title="Track a case" onPress={()=>router.push('/tracking')} />
        <LinkButton title="Offline reports" onPress={()=>router.push('/outbox')} />
      </View>

      <View style={styles.toolbar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('Search name or location')}
          placeholderTextColor={palette.textSecondary}
          autoCapitalize="none"
          style={[
            styles.search,
            { color: palette.text, backgroundColor: palette.backgroundElement },
          ]}
        />
        <View style={[styles.toggle, { backgroundColor: palette.backgroundElement }]}>
          <Pressable
            onPress={() => setGrid(false)}
            style={[styles.toggleBtn, !grid && { backgroundColor: palette.backgroundSelected }]}>
            <Text style={[styles.toggleText, { color: palette.text }]}>{t("List")}</Text>
          </Pressable>
          <Pressable
            onPress={() => setGrid(true)}
            style={[styles.toggleBtn, grid && { backgroundColor: palette.backgroundSelected }]}>
            <Text style={[styles.toggleText, { color: palette.text }]}>{t("Grid")}</Text>
          </Pressable>
        </View>
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
          key={grid ? 'grid' : 'list'}
          numColumns={grid ? 2 : 1}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={grid ? styles.gridColumn : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              load();
            }} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No active cases"
              subtitle="Pull to refresh, or report a missing person."
            />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <PersonCard
                person={item}
                layout={grid ? 'grid' : 'list'}
                onPress={() => router.push(`/person/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  search: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  toggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  gridColumn: {
    gap: 12,
  },
});
