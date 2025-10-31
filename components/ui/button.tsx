import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-lg border transition";
    const variantCls =
      variant === "ghost"
        ? "border-transparent hover:bg-gray-100"
        : variant === "destructive"
        ? "border-red-300 text-red-600 hover:bg-red-50"
        : variant === "outline"
        ? "border-gray-300 hover:bg-gray-50"
        : "border hover:bg-gray-50";
    const sizeCls =
      size === "icon"
        ? "h-9 w-9 p-0"
        : size === "sm"
        ? "px-3 py-2 text-sm"
        : size === "lg"
        ? "px-5 py-3"
        : "px-4 py-2";

    return (
      <button
        ref={ref}
        className={[base, variantCls, sizeCls, className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
export default Button;
