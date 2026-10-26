import { AndroidImportance } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('exports', {
      name: 'Dublaj sonuçları',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Local-only notification: no push token or personal data leaves the device. */
export async function notifyDubReady(title: string) {
  try {
    if (!(await ensureNotificationPermission())) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dublajın hazır',
        body: `${title} videosu oynatılmaya ve paylaşılmaya hazır.`,
        data: { screen: 'community' },
      },
      trigger: null,
    });
    return true;
  } catch {
    // Notification failure must not turn a completed export into an error.
    return false;
  }
}
