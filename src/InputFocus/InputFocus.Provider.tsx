//$lf-ignore
import {
  isIOS,
  measureAsync,
  relativeY,
  useKeyboardListeners,
  wait,
} from '@shaquillehinds/react-native-essentials';
import {
  createContext,
  createRef,
  type MutableRefObject,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TextInput,
  ScrollView,
  type KeyboardEvent,
  type ScrollViewProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type NativeScrollEvent,
  type StyleProp,
  type ViewStyle,
  Animated,
} from 'react-native';

type InputFocusContextType = {
  focusedTextInputRef: MutableRefObject<TextInput | null>;
  onTextInputFocus: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
};

export const InputFocusContext = createContext<InputFocusContextType>({
  focusedTextInputRef: createRef(),
  onTextInputFocus: () => {},
});

export type InputFocusProviderProps = {
  ref?: MutableRefObject<ScrollView | null>;
  scrollViewProps?: ScrollViewProps;
  /**
   * Uses Animated.ScrollView as the wrapper if you want to avoid any state rerenders from adding padding.
   */
  useAnimatedScrollView?: boolean;
  CustomScrollView?: typeof ScrollView;
  additionalKeyboardHeight?: number;
};

export function InputFocusProvider(
  props: PropsWithChildren<InputFocusProviderProps>
) {
  const [paddingBottom, setPaddingBottom] = useState(0);
  const paddingBottomRef = useRef(new Animated.Value(0));

  const initializedRef = useRef(false);

  const focusedTextInputRef = useRef<null | TextInput>(null);

  const scrollOffsetRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (props.ref) props.ref = scrollViewRef;
  }, [props.ref]);

  const keyboardHeightRef = useRef(0);

  const ViewComponent = useMemo(
    () =>
      props.CustomScrollView ||
      (props.useAnimatedScrollView ? Animated.ScrollView : ScrollView),
    [props.useAnimatedScrollView]
  );

  const handleKeyboardShow = useCallback(
    async (_: KeyboardEvent) => {
      if (initializedRef.current || !scrollViewRef.current) return;
      if (props.useAnimatedScrollView) {
        paddingBottomRef.current.setValue(keyboardHeightRef.current);
      } else {
        setPaddingBottom(
          keyboardHeightRef.current + (props.additionalKeyboardHeight || 0)
        );
      }
      await wait(100);
      try {
        const measurements = await measureAsync(focusedTextInputRef);
        measurements && moveFocusTo({ yPos: measurements.pageY });
      } catch (error) {
        console.error(error);
      }
      initializedRef.current = true;
    },
    [props.useAnimatedScrollView, paddingBottom]
  );

  const handleKeyboardHide = useCallback(() => {
    if (props.useAnimatedScrollView)
      paddingBottomRef.current.setValue(keyboardHeightRef.current);
    else setPaddingBottom(0);
    initializedRef.current = false;
  }, [props.useAnimatedScrollView]);

  useKeyboardListeners({
    keyboardHeightRef,
    listeners: {
      keyboardWillShow: isIOS ? handleKeyboardShow : undefined,
      keyboardDidShow: !isIOS ? handleKeyboardShow : undefined,
      keyboardWillHide: isIOS ? handleKeyboardHide : undefined,
      keyboardDidHide: !isIOS ? handleKeyboardHide : undefined,
    },
  });

  const moveFocusTo = useCallback(({ yPos }: { yPos: number }) => {
    if (!scrollViewRef.current || !keyboardHeightRef.current) return;
    const remainingContent =
      relativeY(isIOS ? 95 : 90) - keyboardHeightRef.current;
    const distanceToMove = remainingContent - yPos;
    const moveTo = scrollOffsetRef.current - distanceToMove;
    scrollViewRef.current.scrollTo({
      y: moveTo,
      animated: true,
    });
  }, []);

  const onTextInputFocus = useCallback(
    async (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      try {
        const measurements = await measureAsync(e);
        measurements && moveFocusTo({ yPos: measurements.pageY });
      } catch (error) {
        console.error(error);
      }
    },
    []
  );

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    if (props?.scrollViewProps?.onScroll) props.scrollViewProps.onScroll(e);
  }, []);

  const contentContainerStyle: StyleProp<ViewStyle> = useMemo(
    () => [
      props?.scrollViewProps?.contentContainerStyle,
      {
        paddingBottom: props.useAnimatedScrollView
          ? paddingBottomRef.current
          : paddingBottom,
      },
    ],
    [
      props?.scrollViewProps?.contentContainerStyle,
      props.useAnimatedScrollView,
      paddingBottom,
    ]
  );

  return (
    <InputFocusContext.Provider
      value={{ focusedTextInputRef, onTextInputFocus }}
    >
      <ViewComponent
        showsVerticalScrollIndicator={false}
        {...props.scrollViewProps}
        contentContainerStyle={contentContainerStyle}
        ref={scrollViewRef}
        onScroll={onScroll}
      >
        {props.children}
      </ViewComponent>
    </InputFocusContext.Provider>
  );
}
