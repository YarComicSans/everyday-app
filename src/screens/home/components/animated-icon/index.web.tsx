import { Image } from 'expo-image';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import classes from './animated-icon.module.css';
import {
  backgroundKeyframe,
  DURATION,
  GLOW_DURATION,
  glowKeyframe,
  logoKeyframe,
  styles,
} from './styles.web';

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(GLOW_DURATION)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View style={styles.background} entering={backgroundKeyframe.duration(DURATION)}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}
