// Redirect to new login screen
import { Redirect } from 'expo-router';

export default function LoginScreen() {
  return <Redirect href="/(public)/login" />;
}
