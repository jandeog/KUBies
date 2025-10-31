import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const cls = ["px-3 py-2 rounded-lg border w-full", className].filter(Boolean).join(" ");
    return <input ref={ref} className={cls} {...props} />;
  }
);
Input.displayName = "Input";

export default Input;
