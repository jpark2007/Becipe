import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  return <Redirect href={session ? '/(tabs)/feed' : '/(auth)/login'} />;
}
