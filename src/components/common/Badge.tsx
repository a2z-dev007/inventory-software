import React from "react";
import clsx from "clsx";

type Variant =
  | "default"
  | "dark"
  | "red"
  | "green"
  | "yellow"
  | "indigo"
  | "purple"
  | "pink";

type Radius = "sm" | "md" | "lg" | "full";
type Size = "xs" | "sm";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  radius?: Radius;
  size?: Size;
  bordered?: boolean;
}

const variantStyles: Record<Variant, { light: string; dark: string; text: string; border?: string }> = {
  default: {
    light: "bg-blue-100",
    dark: "dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-300",
    border: "border border-blue-400",
  },
  dark: {
    light: "bg-gray-100",
    dark: "dark:bg-gray-700",
    text: "text-gray-800 dark:text-gray-300",
    border: "border border-gray-500",
  },
  red: {
    light: "bg-red-100",
    dark: "dark:bg-red-900",
    text: "text-red-800 dark:text-red-300",
    border: "border border-red-400",
  },
  green: {
    light: "bg-green-100",
    dark: "dark:bg-green-900",
    text: "text-green-800 dark:text-green-300",
    border: "border border-green-400",
  },
  yellow: {
    light: "bg-yellow-100",
    dark: "dark:bg-yellow-900",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border border-yellow-300",
  },
  indigo: {
    light: "bg-indigo-100",
    dark: "dark:bg-indigo-900",
    text: "text-indigo-800 dark:text-indigo-300",
    border: "border border-indigo-400",
  },
  purple: {
    light: "bg-purple-100",
    dark: "dark:bg-purple-900",
    text: "text-purple-800 dark:text-purple-300",
    border: "border border-purple-400",
  },
  pink: {
    light: "bg-pink-100",
    dark: "dark:bg-pink-900",
    text: "text-pink-800 dark:text-pink-300",
    border: "border border-pink-400",
  },
};

const radiusStyles: Record<Radius, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

const sizeStyles: Record<Size, string> = {
  xs: "text-xs",
  sm: "text-sm",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  radius = "full",
  size = "xs",
  bordered = false,
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={clsx(
        "font-medium me-2 px-2.5 py-0.5",
        sizeStyles[size],
        styles.light,
        styles.dark,
        styles.text,
        radiusStyles[radius],
        bordered && styles.border
      )}
    >
      {children}
    </span>
  );
};
