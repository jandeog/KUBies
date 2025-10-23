'use client';
import * as React from 'react';

type OnValueChange = (value: string) => void;

type Ctx = {
  value?: string;
  onValueChange?: OnValueChange;
  items: { value: string; label: React.ReactNode }[];
};
const SelectCtx = React.createContext<Ctx | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: OnValueChange;
  children: React.ReactNode;
}) {
  const [items, setItems] = React.useState<Ctx['items']>([]);
  // Clear items when children change
  React.useEffect(() => setItems([]), [children]);
  const register = (item: { value: string; label: React.ReactNode }) =>
    setItems((prev) => (prev.find((i) => i.value === item.value) ? prev : [...prev, item]));

  return (
    <SelectCtx.Provider value={{ value, onValueChange, items }}>
      {/* Clone children to inject register into SelectItem */}
      <div data-select-root="">
        {React.Children.map(children, (child: any) => {
          if (child?.type?.displayName === 'SelectItem') {
            return React.cloneElement(child, { __register: register });
          }
          return child;
        })}
      </div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({
  className = '',
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ctx = React.useContext(SelectCtx)!;
  return (
    <select
      className={`px-3 py-2 rounded-lg border ${className}`}
      value={ctx.value}
      onChange={(e) => ctx.onValueChange?.(e.target.value)}
    >
      {ctx.items.map((it) => (
        <option key={it.value} value={it.value}>
          {/* Strip React nodes to string for option label */}
          {typeof it.label === 'string' ? it.label : String(it.value)}
        </option>
      ))}
    </select>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  // Not needed with native <select>, but kept for API parity
  return <div style={{ display: 'none' }}>{children}</div>;
}

export function SelectItem({
  value,
  children,
  __register,
}: {
  value: string;
  children: React.ReactNode;
  __register?: (item: { value: string; label: React.ReactNode }) => void;
}) {
  React.useEffect(() => {
    __register?.({ value, label: children });
  }, [__register, value, children]);
  return null;
}
SelectItem.displayName = 'SelectItem';

export function SelectValue({ placeholder }: { placeholder?: string }) {
  // Placeholder is not used in native select; keeping for API parity
  return <span className="sr-only">{placeholder}</span>;
}
