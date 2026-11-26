import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <Loading />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/cases' : '/gallery'} />;
}
