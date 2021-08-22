import React from 'react';
import {Spinner} from '@chakra-ui/react';
import cx from 'classnames';
import {SIDE} from '../../redux/api/bitmex/types';
import {COMPONENTS} from 'data-test-ids';
import styles from './Button.module.scss';

export type ButtonVariants = 'submit' | 'text' | 'custom' | 'textSell' | 'outline' | SIDE;

interface Props<T> {
  testID?: string;
  id?: T;
  isLoading?: boolean;
  label: string;
  variant?: ButtonVariants;
  disabled?: boolean;
  onClick: (id: T) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function Button<T extends string>({
  id,
  label,
  isLoading,
  testID,
  variant = 'submit',
  disabled,
  onClick,
  style,
  className = '',
}: Props<T>) {
  const buttonStyle = cx({
    [styles.button]: variant === 'submit',
    [styles.text_button]: variant === 'text',
    [styles.text_sell]: variant === 'textSell',
    [styles.button_buy]: variant === 'Buy',
    [styles.button_sell]: variant === 'Sell',
    [styles.outline]: variant === 'outline',
    [className]: variant === 'custom',
  });

  const invokeClick = React.useCallback(() => onClick(id as T), [onClick, id]);

  return (
    <button
      id={id}
      data-testid={testID}
      className={buttonStyle}
      style={style}
      disabled={disabled}
      onClick={invokeClick}
    >
      {isLoading ? (
        <Spinner
          data-testid={COMPONENTS.SPINNER}
          padding={0}
          speed="0.6s"
          color="green.500"
          size="sm"
          justifyContent="center"
          verticalAlign="center"
        />
      ) : (
        label
      )}
    </button>
  );
}
