import { useContext } from 'react';
import { InputFocusContext } from './InputFocus.Provider';

export function useInputFocus() {
  const context = useContext(InputFocusContext);

  return context;
}
