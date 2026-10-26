import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ui';
import { theme } from '@/constants/app-theme';

type Props = { children: ReactNode };
type State = { failed: boolean };

/** Last-resort UI guard so an unexpected render error never leaves a blank screen. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('Unhandled mobile UI error', error, info.componentStack);
  }

  private retry = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.symbol}>!</Text>
        <Text style={styles.title}>Beklenmeyen bir hata oluştu</Text>
        <Text style={styles.message}>Ekranı güvenli biçimde yeniden yüklemek için tekrar deneyebilirsin.</Text>
        <View style={styles.action}><ActionButton label="Tekrar dene" onPress={this.retry} /></View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: theme.background },
  symbol: { width: 60, height: 60, borderRadius: 20, textAlign: 'center', textAlignVertical: 'center', color: '#fecdd3', backgroundColor: '#3f1019', fontSize: 30, fontWeight: '900' },
  title: { color: theme.text, marginTop: 18, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  message: { color: theme.muted, marginTop: 8, marginBottom: 20, lineHeight: 21, textAlign: 'center' },
  action: { width: '100%', maxWidth: 260 },
});
