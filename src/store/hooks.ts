import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Custom typed hooks for Redux
 * Use these throughout the app instead of plain `useDispatch` and `useSelector`
 */

// Typed dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Typed selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
