import React from "react";
import { TouchableWithoutFeedback, Keyboard } from "react-native";

export default function DismissKeyboard(props: React.PropsWithChildren) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {props.children}
    </TouchableWithoutFeedback>
  );
}
