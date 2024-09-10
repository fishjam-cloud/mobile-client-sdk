import React, { type ReactNode } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { TextColors } from '../utils/Colors';

const SMALL_WINDOW_BREAKPOINT = 640;

function getFontVariant(variant: VariantName) {
  const windowWidth = Dimensions.get('window').width;

  const HeadlineStylesDynamic =
    windowWidth > SMALL_WINDOW_BREAKPOINT ? Headlines : HeadlinesSmall;
  const TextStylesDynamic =
    windowWidth > SMALL_WINDOW_BREAKPOINT ? TextStyles : TextStylesSmall;

  const variantMap: { [key: string]: TextStyle } = {
    'h1': HeadlineStylesDynamic.h1,
    'h2': HeadlineStylesDynamic.h2,
    'h3': HeadlineStylesDynamic.h3,
    'h4': HeadlineStylesDynamic.h4,
    'h5': HeadlineStylesDynamic.h5,
    'body-big': TextStylesDynamic.bodyBig,
    'body-small': TextStylesDynamic.bodySmall,
    'label': TextStylesDynamic.label,
    'caption': TextStylesDynamic.caption,
    'button': TextStylesDynamic.button,
    'video-label': TextStylesCustom.videoLabel,
    'chat-regular': TextStylesCustom.chatRegular,
    'chat-semibold': TextStylesCustom.chatSemibold,
    'chat-title': TextStylesCustom.chatTitle,
  };
  return variantMap[variant];
}

type VariantName =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'body-big'
  | 'body-small'
  | 'label'
  | 'caption'
  | 'button'
  | 'video-label'
  | 'chat-regular'
  | 'chat-semibold'
  | 'chat-title';

type TypoProps = {
  variant: VariantName;
  color?: string;
  children: ReactNode;
} & TextProps;

export default function Typo({
  variant = 'body-big',
  color = TextColors.darkText,
  children,
  style,
  ...textProps
}: TypoProps) {
  const getStyleForVariant = [{ color }, getFontVariant(variant)];

  return (
    <Text style={[...getStyleForVariant, style]} {...textProps}>
      {children}
    </Text>
  );
}

const Headlines = StyleSheet.create({
  h1: {
    fontWeight: '500',
    fontSize: 68,
    lineHeight: 76,
  },
  h2: {
    fontWeight: '500',
    fontSize: 48,
    lineHeight: 54,
  },
  h3: {
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 48,
  },
  h4: {
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 36,
  },
  h5: {
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 28,
  },
});

const HeadlinesSmall = StyleSheet.create({
  h1: {
    fontWeight: '500',
    fontSize: 42,
    lineHeight: 48,
  },
  h2: {
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 42,
  },
  h3: {
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 32,
  },
  h5: {
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 28,
  },
});

const TextStyles = StyleSheet.create({
  bodyBig: {
    fontWeight: '400',
    fontSize: 20,
    lineHeight: 36,
  },
  bodySmall: {
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 28,
  },
  label: {
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  button: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
});

const TextStylesSmall = StyleSheet.create({
  bodyBig: {
    fontWeight: '400',
    fontSize: 18,
    lineHeight: 32,
  },
  bodySmall: {
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 28,
  },
  label: {
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  button: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
});

const TextStylesCustom = StyleSheet.create({
  videoLabel: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
  },
  chatRegular: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 21,
  },
  chatSemibold: {
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 21,
  },
  chatTitle: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
  },
});

export const TextInputTextStyle = StyleSheet.create({
  body: {
    fontSize: TextStylesSmall.bodySmall.fontSize,
  },
});
