import { Redirect } from 'expo-router';

// Root index: the navigation gate in _layout.tsx handles actual routing,
// but we need a valid initial route so Expo Router doesn't show "Unmatched Route".
export default function Index() {
  return <Redirect href="/(auth)/onboarding/welcome" />;
}
