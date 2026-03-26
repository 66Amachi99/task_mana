import type { LucideIcon } from 'lucide-react';
import styles from './ActionButton.module.css';

// ─── Типы ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'base' | 'green' | 'gray' | 'lightGray' | 'red' | 'publish';

interface ActionButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant: ButtonVariant;
  icon?: LucideIcon;
  children: React.ReactNode;
  isPublished?: boolean;
  className?: string;
}

// ─── Компонент ───────────────────────────────────────────────────────────────────

export const ActionButton = ({
  onClick,
  disabled = false,
  variant,
  icon: Icon,
  children,
  isPublished,
  className = '',
}: ActionButtonProps) => {
  const variantClass =
    variant === 'publish'
      ? isPublished
        ? styles.publishButtonPublished
        : styles.publishButtonUnpublished
      : {
          base: styles.buttonBase,
          green: styles.buttonGreen,
          gray: styles.buttonGray,
          lightGray: styles.buttonLightGray,
          red: styles.buttonRed,
        }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${variantClass} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
