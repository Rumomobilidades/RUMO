import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { LatLng } from '@/lib/types';

/** Visão do Brasil inteiro, usada enquanto não há ponto nenhum para mostrar. */
const BRAZIL = { latitude: -14.2, longitude: -51.9, latitudeDelta: 38, longitudeDelta: 38 };

type Props = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  /** Traçado da rota; sem ele o mapa mostra só os dois pontos. */
  line?: LatLng[];
  /** Posição do aparelho, para centralizar quando não há corrida na tela. */
  me?: LatLng | null;
  showsUser?: boolean;
  /** Altura coberta pelo painel inferior. */
  bottomInset?: number;
  topInset?: number;
  /** Quando muda, o mapa volta para a posição do aparelho. */
  focusToken?: number;
};

export function RideMap({
  origin,
  destination,
  line,
  me,
  showsUser = false,
  bottomInset = 0,
  topInset = 0,
  focusToken = 0,
}: Props) {
  const map = useRef<MapView>(null);
  const scheme = useColorScheme();

  const originKey = origin ? `${origin.latitude},${origin.longitude}` : '';
  const destinationKey = destination ? `${destination.latitude},${destination.longitude}` : '';
  const meKey = me ? `${me.latitude.toFixed(3)},${me.longitude.toFixed(3)}` : '';
  const lineLength = line?.length ?? 0;

  useEffect(() => {
    const points = [origin, destination].filter(Boolean) as LatLng[];

    if (points.length === 2) {
      map.current?.fitToCoordinates(lineLength > 1 ? line! : points, {
        edgePadding: { top: topInset + 72, right: 56, bottom: bottomInset + 48, left: 56 },
        animated: true,
      });
      return;
    }

    const center = points[0] ?? me;
    if (center) {
      map.current?.animateToRegion({ ...center, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 500);
    }
    // As chaves em texto evitam reenquadrar a cada render com objetos novos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originKey, destinationKey, meKey, lineLength, bottomInset, topInset]);

  useEffect(() => {
    if (focusToken > 0 && me) {
      map.current?.animateToRegion({ ...me, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 400);
    }
    // Só o toque no botão dispara; a posição em si não deve reenquadrar o mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      initialRegion={me ? { ...me, latitudeDelta: 0.012, longitudeDelta: 0.012 } : BRAZIL}
      mapPadding={{ top: topInset, right: 0, bottom: bottomInset, left: 0 }}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
      showsUserLocation={showsUser}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}>
      {lineLength > 1 ? (
        <Polyline coordinates={line!} strokeColor={Brand.ink} strokeWidth={4} />
      ) : null}
      {origin ? (
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.originOuter}>
            <View style={styles.originInner} />
          </View>
        </Marker>
      ) : null}
      {destination ? (
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.destinationOuter}>
            <View style={styles.destinationInner} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  originOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16,22,19,0.15)',
  },
  originInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Brand.green },
  destinationOuter: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  destinationInner: { width: 7, height: 7, borderRadius: 1, backgroundColor: '#ffffff' },
});
