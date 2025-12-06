import React from 'react';
import { StyleSheet, Text, TextInput, TextStyle } from 'react-native';

type Weight = NonNullable<TextStyle['fontWeight']>;

type FontVariant = 'normal' | 'italic';

const FONT_FAMILY_MAP: Record<FontVariant, Record<string, string>> = {
  normal: {
    normal: 'DMSans-Regular',
    bold: 'DMSans-Bold',
    '100': 'DMSans-Regular',
    '200': 'DMSans-Regular',
    '300': 'DMSans-Regular',
    '400': 'DMSans-Regular',
    '500': 'DMSans-Medium',
    '600': 'DMSans-Bold',
    '700': 'DMSans-Bold',
    '800': 'DMSans-Bold',
    '900': 'DMSans-Bold',
  },
  italic: {
    normal: 'DMSans-RegularItalic',
    bold: 'DMSans-BoldItalic',
    '100': 'DMSans-RegularItalic',
    '200': 'DMSans-RegularItalic',
    '300': 'DMSans-RegularItalic',
    '400': 'DMSans-RegularItalic',
    '500': 'DMSans-MediumItalic',
    '600': 'DMSans-BoldItalic',
    '700': 'DMSans-BoldItalic',
    '800': 'DMSans-BoldItalic',
    '900': 'DMSans-BoldItalic',
  },
};

const normalizeWeight = (weight?: Weight) => {
  if (!weight) return 'normal';
  if (typeof weight === 'number') return weight.toString();
  if (weight === 'bold' || weight === 'normal') return weight;
  return weight;
};

const resolveFontFamily = (weight?: Weight, fontStyle?: TextStyle['fontStyle']) => {
  const variant: FontVariant = fontStyle === 'italic' ? 'italic' : 'normal';
  const normalizedWeight = normalizeWeight(weight);
  return FONT_FAMILY_MAP[variant][normalizedWeight] ?? FONT_FAMILY_MAP[variant].normal;
};

const patchComponent = (Component: typeof Text | typeof TextInput) => {
  const componentAny = Component as any;
  if (componentAny.__dmSansPatched) return;

  const defaultRender = Component.render;
  if (typeof defaultRender !== 'function') return;

  componentAny.__dmSansPatched = true;

  Component.render = function render(...args: any[]) {
    const origin = defaultRender.apply(this, args);
    if (!React.isValidElement(origin)) return origin;

    const props = origin.props ?? {};
    const flattened: TextStyle = StyleSheet.flatten(props.style) || {};

    if (flattened.fontFamily && flattened.fontFamily !== 'System') {
      return origin;
    }

    const fontFamily = resolveFontFamily(flattened.fontWeight as Weight | undefined, flattened.fontStyle);
    const nextStyle: TextStyle = { ...flattened, fontFamily };
    delete nextStyle.fontWeight;

    return React.cloneElement(origin, {
      ...props,
      style: nextStyle,
    });
  };
};

export const applyGlobalDMSans = () => {
  patchComponent(Text);
  patchComponent(TextInput);
};

