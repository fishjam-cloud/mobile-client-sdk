import React from 'react';
import { TouchableWithoutFeedback, Keyboard } from 'react-native';

import type { AppParentNode } from '../types/types';

export default function DismissKeyboard(props: AppParentNode) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {props.children}
    </TouchableWithoutFeedback>
  );
}
