// src/screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';

const BRAND = '#0D9488';
const BRAND_SOFT = '#CCFBF1';

export default function SplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const shortDim = Math.min(width, height);

  // Bigger, but still responsive: scales with the shorter screen dimension
  // so it looks right on phones, tablets, and landscape.
  const logoSize = isLandscape
    ? Math.min(Math.max(height * 0.55, 220), 420)
    : Math.min(Math.max(width * 0.88, 260), 460);

  // --- Animated values ---
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(1)).current; // 1 -> 0 (deg offset)
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const sloganTranslateY = useRef(new Animated.Value(16)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Expanding ring "pulse" behind the logo, starts immediately
    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const entrance = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(sloganTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
      ]),
    ]);

    entrance.start(() => {
      ringScale.setValue(0.4);
      ringOpacity.setValue(0.5);
      ringLoop.start();

      // gentle continuous "breathing" scale on the logo once settled
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathe, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathe, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Sequential loading-dot pulse
    const makeDotLoop = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    makeDotLoop(dot1, 0).start();
    makeDotLoop(dot2, 150).start();
    makeDotLoop(dot3, 300).start();

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3200);

    return () => {
      clearTimeout(timer);
      ringLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateDeg = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  const breatheScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  const ringSize = logoSize * 1.15;

  return (
    <View style={styles.container}>
      {/* Soft decorative background blobs — subtle, keeps bg reading as white */}
      <View
        pointerEvents="none"
        style={[
          styles.blobTopRight,
          { width: shortDim * 0.9, height: shortDim * 0.9, borderRadius: shortDim * 0.45 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.blobBottomLeft,
          { width: shortDim * 0.75, height: shortDim * 0.75, borderRadius: shortDim * 0.375 },
        ]}
      />

      <View style={styles.centerBlock}>
        {/* Pulsing ring behind the logo */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              width: logoSize,
              height: logoSize,
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, breatheScale) },
                { rotate: rotateDeg },
              ],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Slogan */}
        <Animated.View
          style={[
            styles.sloganWrapper,
            {
              opacity: sloganOpacity,
              transform: [{ translateY: sloganTranslateY }],
            },
          ]}
        >
          <Text style={styles.sloganText}>
            Connecting Generations, Enriching Lives.
          </Text>
        </Animated.View>
      </View>

      {/* Animated loading dots */}
      <View style={styles.loaderContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    top: '-18%',
    right: '-22%',
    backgroundColor: BRAND_SOFT,
    opacity: 0.35,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: '-16%',
    left: '-20%',
    backgroundColor: BRAND_SOFT,
    opacity: 0.25,
  },
  centerBlock: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: BRAND,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    maxWidth: '92%',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  sloganWrapper: {
    marginTop: 14,
    alignItems: 'center',
    paddingHorizontal: 18,
    maxWidth: '90%',
  },
  sloganText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 24,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND,
    marginHorizontal: 4,
  },
});