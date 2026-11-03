import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useRef, useState, type ComponentType, type Ref, type RefAttributes } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView as NativeWebView } from 'react-native-webview';

import { ActionButton, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';

const STUDIO = {
  latitude: 41.10974,
  longitude: 29.02043,
  title: 'DublajLab Stüdyo',
  address: 'Maslak, Sarıyer / İstanbul',
};

type Coordinate = { latitude: number; longitude: number };
type MapWebViewHandle = { postMessage: (message: string) => void; reload: () => void };
type MapWebViewProps = RefAttributes<MapWebViewHandle> & {
  style?: StyleProp<ViewStyle>;
  source: { html: string };
  originWhitelist?: string[];
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  onHttpError?: () => void;
  ref?: Ref<MapWebViewHandle>;
};

// react-native-webview 14's cross-platform declaration intersects mutually
// exclusive platform props under RN 0.88. The native component supports this
// deliberately small, platform-neutral subset used by the map.
const MapWebView = NativeWebView as unknown as ComponentType<MapWebViewProps>;

const MAP_HTML = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; background: #11141b; }
      .leaflet-control-attribution { background: rgba(17,20,27,.86) !important; color: #9ca3af; }
      .leaflet-control-attribution a { color: #a6ff3f; }
      .studio-pin, .user-pin { width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #080a0e; box-shadow: 0 3px 12px #0009; }
      .studio-pin { background: #a6ff3f; }
      .user-pin { background: #a78bfa; }
      .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #11141b; color: #f7f8fa; }
      .leaflet-popup-content { font: 700 13px system-ui, sans-serif; line-height: 1.45; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var studio = [${STUDIO.latitude}, ${STUDIO.longitude}];
      var map = L.map('map', { zoomControl: false }).setView(studio, 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap katkıda bulunanlar'
      }).addTo(map);
      var studioIcon = L.divIcon({ className: '', html: '<div class="studio-pin"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
      var userIcon = L.divIcon({ className: '', html: '<div class="user-pin"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });
      L.marker(studio, { icon: studioIcon }).addTo(map).bindPopup('<b>DublajLab Stüdyo</b><br/>Maslak, Sarıyer / İstanbul<br/><small>Temsili konum</small>').openPopup();
      var userMarker = null;
      function receive(event) {
        try {
          var message = JSON.parse(event.data);
          if (message.type === 'focusStudio') map.setView(studio, 15, { animate: true });
          if (message.type === 'userLocation') {
            var user = [message.latitude, message.longitude];
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker(user, { icon: userIcon }).addTo(map).bindPopup('Konumun');
            map.fitBounds([studio, user], { padding: [45, 45], maxZoom: 15 });
          }
        } catch (_) {}
      }
      document.addEventListener('message', receive);
      window.addEventListener('message', receive);
    </script>
  </body>
</html>`;

export default function StudioLocationScreen() {
  const mapRef = useRef<MapWebViewHandle>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  const focusStudio = useCallback(() => {
    mapRef.current?.postMessage(JSON.stringify({ type: 'focusStudio' }));
  }, []);

  const showMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Konum izni verilmedi',
          'Kendi konumunu haritada göstermek için cihaz ayarlarından konum izni verebilirsin.',
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinate = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setUserLocation(coordinate);
      mapRef.current?.postMessage(JSON.stringify({ type: 'userLocation', ...coordinate }));
    } catch (reason) {
      Alert.alert(
        'Konum alınamadı',
        reason instanceof Error ? reason.message : 'Konum servisini açıp tekrar deneyebilirsin.',
      );
    } finally {
      setLocating(false);
    }
  }, []);

  const openDirections = useCallback(async () => {
    const destination = `${STUDIO.latitude},${STUDIO.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Harita açılamadı', 'Yol tarifi bağlantısı şu anda açılamıyor.');
    }
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={theme.text} size={23} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>STÜDYO KONUMU</Text>
          <Text style={styles.title}>DublajLab&apos;e ulaş</Text>
        </View>
      </View>

      <View style={styles.mapFrame}>
        <MapWebView
          ref={mapRef}
          style={styles.map}
          source={{ html: MAP_HTML }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onLoadStart={() => { setMapLoading(true); setMapError(false); }}
          onLoadEnd={() => {
            setMapLoading(false);
            if (userLocation) mapRef.current?.postMessage(JSON.stringify({ type: 'userLocation', ...userLocation }));
          }}
          onError={() => { setMapLoading(false); setMapError(true); }}
          onHttpError={() => { setMapLoading(false); setMapError(true); }}
        />
        {mapLoading ? <View style={styles.mapStatus}><ActivityIndicator color={theme.green} /><Text style={styles.mapStatusText}>Harita yükleniyor…</Text></View> : null}
        {mapError ? <View style={styles.mapStatus}><Ionicons name="cloud-offline-outline" color={theme.muted} size={26} /><Text style={styles.mapStatusText}>Harita yüklenemedi.</Text><Pressable onPress={() => mapRef.current?.reload()}><Text style={styles.retryText}>Tekrar dene</Text></Pressable></View> : null}
        <View style={styles.mapControls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Stüdyo konumuna dön" onPress={focusStudio} style={styles.mapButton}>
            <Ionicons name="business" color={theme.text} size={20} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Kendi konumumu göster" disabled={locating} onPress={() => void showMyLocation()} style={[styles.mapButton, locating && styles.mapButtonDisabled]}>
            <Ionicons name={locating ? 'hourglass' : 'locate'} color={theme.green} size={21} />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <View style={styles.pinIcon}><Ionicons name="location" color={theme.green} size={23} /></View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>{STUDIO.title}</Text>
            <Text style={styles.address}>{STUDIO.address}</Text>
          </View>
        </View>
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" color={theme.purple} size={19} />
          <Text style={styles.noticeText}>Bu adres ders projesi için eklenmiş temsili şirket konumudur.</Text>
        </View>
        <ActionButton label="Yol tarifi al" onPress={() => void openDirections()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  backButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border },
  headerCopy: { flex: 1 },
  eyebrow: { color: theme.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  mapFrame: { flex: 1, minHeight: 330, marginHorizontal: 20, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  map: { flex: 1 },
  mapStatus: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.surface },
  mapStatusText: { color: theme.muted, fontWeight: '700' },
  retryText: { color: theme.green, fontWeight: '900', padding: 8 },
  mapControls: { position: 'absolute', top: 14, right: 14, gap: 9 },
  mapButton: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#11141bea', borderWidth: 1, borderColor: theme.border },
  mapButtonDisabled: { opacity: 0.55 },
  card: { margin: 20, padding: 17, gap: 15, borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715' },
  cardCopy: { flex: 1 },
  cardTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
  address: { color: theme.muted, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 14, backgroundColor: '#1b1729', borderWidth: 1, borderColor: '#40345d' },
  noticeText: { flex: 1, color: '#c4b5fd', fontSize: 12, lineHeight: 18 },
});
