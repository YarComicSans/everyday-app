import type { Href } from 'expo-router';
import type { SymbolViewProps } from 'expo-symbols';

export type MenuTileProps = {
  title: string;
  subtitle?: string;
  icon: SymbolViewProps['name'];
  href: Href;
  color: string;
};
