import type { Href, Link } from 'expo-router';
import type { ComponentProps } from 'react';

export type ExternalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Href & string;
};
