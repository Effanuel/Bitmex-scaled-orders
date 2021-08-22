import React from 'react';
import {Modal} from 'components';

interface Props {
  title: string;
  subtitle: string;
  onConfirm: () => void;
}

export function GeneralModal({title, subtitle, onConfirm}: Props) {
  return (
    <Modal title={title} onConfirm={onConfirm}>
      {subtitle}
    </Modal>
  );
}
