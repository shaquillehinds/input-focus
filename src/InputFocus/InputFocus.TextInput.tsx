import {
  TextInput,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { useCallback, useRef, type RefObject } from 'react';
import { useInputFocus } from './useInputFocus';

export type InputFocusTextInputProps = {
  ref?: RefObject<TextInput>;
} & TextInputProps;

export function InputFocusTextInput(props: InputFocusTextInputProps) {
  const textInputRef = useRef<TextInput>(null);
  const context = useInputFocus();

  const onFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      context.focusedTextInputRef.current =
        props.ref?.current || textInputRef.current;
      props.onFocus && props.onFocus(e);
      context.onTextInputFocus(e);
    },
    [props.ref, props.onFocus]
  );

  return (
    <TextInput {...props} onFocus={onFocus} ref={props.ref || textInputRef} />
  );
}
