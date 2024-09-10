import isEmpty from 'lodash/isEmpty';
import React, { useState } from 'react';
import { StyleSheet, TextInput as RNTextInput, View } from 'react-native';

import Typo, { TextInputTextStyle } from './Typo';
import type AccessibilityLabel from '../types/AccessibilityLabel';
import { AdditionalColors, BrandColors, TextColors } from '../utils/Colors';

type OnChangeTextType = (text: string) => void;

type TextInputProps = {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  editable?: boolean;
  onChangeText?: OnChangeTextType;
  sublabel?: string;
  sublabelIconSize?: number;
} & AccessibilityLabel;

export default function TextInput({
  placeholder = '',
  sublabel,
  value,
  defaultValue,
  accessibilityLabel,
  editable = true,
  onChangeText = () => {
    /* empty function */
  },
}: TextInputProps) {
  const [focusStyle, setFocusStyle] = useState(TextInputStyles.offFocus);
  const placeholderTextColor = AdditionalColors.grey80;
  const fontStyle = TextInputTextStyle.body;

  const onFocus = () => {
    setFocusStyle(TextInputStyles.onFocus);
  };

  const offFocus = () => {
    setFocusStyle(TextInputStyles.offFocus);
  };

  const styleForTextInput = editable
    ? [TextInputStyles.main, TextInputStyles.active, focusStyle, fontStyle]
    : [TextInputStyles.main, TextInputStyles.notActive, fontStyle];

  return (
    <View>
      <RNTextInput
        style={styleForTextInput}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        defaultValue={defaultValue}
        accessibilityLabel={accessibilityLabel}
        onFocus={onFocus}
        onBlur={offFocus}
        editable={editable}
        onChangeText={onChangeText}
        autoCapitalize="none"
        selectionColor={TextColors.additionalLightText}
      />
      {!isEmpty(sublabel) ? (
        <View style={TextInputStyles.roomInputSubLabel}>
          <Typo
            variant="label"
            color={editable ? TextColors.darkText : AdditionalColors.grey80}>
            {sublabel}
          </Typo>
        </View>
      ) : null}
    </View>
  );
}

const TextInputStyles = StyleSheet.create({
  main: {
    width: '100%',
    height: 56,
    borderRadius: 40,
    borderStyle: 'solid',
    borderWidth: 2,
    backgroundColor: AdditionalColors.white,
    paddingLeft: 16,
  },
  active: {
    color: TextColors.darkText,
  },
  notActive: {
    color: AdditionalColors.grey80,
    borderColor: AdditionalColors.grey60,
  },
  offFocus: {
    borderColor: BrandColors.darkBlue100,
  },
  onFocus: {
    borderColor: BrandColors.seaBlue80,
  },
  roomInputSubLabel: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
  },
  roomInputSubLabelIcon: {
    paddingRight: 4,
  },
});
