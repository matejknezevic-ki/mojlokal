import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card bg-white shadow-soft border border-espresso/5 ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-terracotta text-white hover:bg-terracotta-dark disabled:bg-espresso/20",
    secondary:
      "bg-espresso text-cream hover:bg-espresso/85 disabled:bg-espresso/20",
    ghost:
      "bg-transparent text-espresso border border-espresso/20 hover:bg-espresso/5",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
  };
  const sizes = {
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-4 text-base",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border border-espresso/15 bg-white px-4 py-3 text-espresso placeholder:text-espresso/35 outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 ${className}`}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-espresso-light"
    >
      {children}
    </label>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">
      {children}
    </h1>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-espresso/20 bg-cream-dark/40 px-6 py-10 text-center text-sm text-espresso-light">
      {children}
    </div>
  );
}
