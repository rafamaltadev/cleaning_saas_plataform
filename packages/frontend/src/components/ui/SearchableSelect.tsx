import { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps<T extends object> {
  items: T[];
  value: string;
  onChange: (id: string) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  emptyMessage?: string;
}

export default function SearchableSelect<T extends object>({
  items,
  value,
  onChange,
  getLabel,
  getId,
  placeholder,
  label,
  emptyMessage = 'Nenhum resultado.',
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => getId(i) === value);
  const selectedLabel = selected ? getLabel(selected) : '';
  const displayValue = open ? query : selectedLabel;

  const filtered = query
    ? items.filter((i) => getLabel(i).toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleFocus() {
    setOpen(true);
    setQuery('');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    if (e.target.value === '') onChange('');
  }

  function handleSelect(item: T) {
    onChange(getId(item));
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        autoComplete="off"
        className="w-full h-10 px-3 rounded bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
      />
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-muted">{emptyMessage}</div>
          ) : (
            filtered.map((item) => (
              <button
                key={getId(item)}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-alt transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              >
                {getLabel(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
