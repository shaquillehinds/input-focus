import { useEffect, useRef, type MutableRefObject } from 'react';
import {
  Keyboard,
  type KeyboardEvent,
  type EmitterSubscription,
  type KeyboardEventListener,
  type KeyboardEventName,
} from 'react-native';

type UseKeyboardListenersProps = {
  listeners: Partial<Record<KeyboardEventName, KeyboardEventListener>>;
  keyboardHeightRef?: MutableRefObject<number>;
  subscribeCondition?: () => boolean;
};

export function useKeyboardListeners(props: UseKeyboardListenersProps) {
  const keyboardHeightRef = useRef(0);

  useEffect(() => {
    if (
      !props.subscribeCondition ||
      (props.subscribeCondition && props.subscribeCondition())
    ) {
      const subscriptions: EmitterSubscription[] = [];
      for (const keyboardListener in props.listeners) {
        const listenerName = keyboardListener as KeyboardEventName;
        const listener = props.listeners[listenerName];
        if (!listener) continue;
        const listenerWrapper = (e: KeyboardEvent) => {
          if (
            listenerName === 'keyboardDidShow' ||
            listenerName === 'keyboardWillShow'
          ) {
            keyboardHeightRef.current = e.endCoordinates.height;
            if (props.keyboardHeightRef)
              props.keyboardHeightRef.current = e.endCoordinates.height;
          } else if (
            listenerName === 'keyboardDidHide' ||
            listenerName === 'keyboardWillHide'
          ) {
            keyboardHeightRef.current = 0;
            if (props.keyboardHeightRef) props.keyboardHeightRef.current = 0;
          }
          listener(e);
        };
        subscriptions.push(Keyboard.addListener(listenerName, listenerWrapper));
      }
      return () => {
        for (const subscription of subscriptions) subscription.remove();
      };
    }
    return () => {};
  }, []);
  return { keyboardHeightRef: props.keyboardHeightRef || keyboardHeightRef };
}
