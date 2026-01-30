import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchStocks, clearSearchResults } from '../store/slices/stockSlice';
import { searchFormSchema, type SearchFormData } from '../validation/schemas';

/**
 * Search Form Component
 * Provides stock symbol search with autocomplete suggestions
 */
export const SearchForm = memo(function SearchForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchResults, status } = useAppSelector((state) => state.stock);
  
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      symbol: '',
    },
  });

  const searchValue = watch('symbol');

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchValue && searchValue.length >= 1) {
      debounceRef.current = setTimeout(() => {
        dispatch(searchStocks(searchValue));
        setIsOpen(true);
      }, 300);
    } else {
      dispatch(clearSearchResults());
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle form submission
  const onSubmit = useCallback(
    (data: SearchFormData) => {
      navigate(`/stock/${data.symbol}`);
      setValue('symbol', '');
      setIsOpen(false);
      dispatch(clearSearchResults());
    },
    [navigate, setValue, dispatch]
  );

  // Handle selecting a result
  const handleSelectResult = useCallback(
    (symbol: string) => {
      navigate(`/stock/${symbol}`);
      setValue('symbol', '');
      setIsOpen(false);
      dispatch(clearSearchResults());
    },
    [navigate, setValue, dispatch]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleSelectResult(searchResults[highlightedIndex].symbol);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, searchResults, highlightedIndex, handleSelectResult]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            {...register('symbol')}
            ref={(e) => {
              register('symbol').ref(e);
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
            }}
            type="text"
            placeholder="Search stocks (e.g., AAPL, MSFT)"
            autoComplete="off"
            onKeyDown={handleKeyDown}
            className={`
              w-full pl-10 pr-4 py-2.5 
              bg-slate-800/50 border rounded-lg
              text-white placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${errors.symbol ? 'border-red-500' : 'border-slate-600'}
            `}
          />

          {/* Loading Spinner */}
          {status === 'loading' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {errors.symbol && (
          <p className="mt-1 text-sm text-red-400">{errors.symbol.message}</p>
        )}
      </form>

      {/* Search Results Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <ul className="max-h-80 overflow-y-auto">
            {searchResults.map((result, index) => (
              <li key={result.symbol}>
                <button
                  type="button"
                  onClick={() => handleSelectResult(result.symbol)}
                  className={`
                    w-full px-4 py-3 text-left
                    flex items-center justify-between
                    transition-colors duration-150
                    ${
                      highlightedIndex === index
                        ? 'bg-blue-600'
                        : 'hover:bg-slate-700'
                    }
                  `}
                >
                  <div>
                    <span className="font-semibold text-white">
                      {result.symbol}
                    </span>
                    <span className="ml-2 text-sm text-slate-400">
                      {result.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 uppercase">
                    {result.type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results Message */}
      {isOpen && searchValue && searchResults.length === 0 && status !== 'loading' && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4">
          <p className="text-slate-400 text-center">No results found</p>
        </div>
      )}
    </div>
  );
});
