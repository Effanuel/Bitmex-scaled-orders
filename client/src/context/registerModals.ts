import React from 'react';
import {
  CancelOrderModal,
  CancelAllOrdersModal,
  CancelProfitOrderModal,
  CancelAllProfitOrdersModal,
  AddProfitOrderModal,
  GeneralModal,
  AddApiKeysModal,
} from 'components/modals';

export type ShowModalArgs = {
  [key in keyof RegisteredModals]: {type: key; props: InferProps<RegisteredModals[key]>};
}[keyof RegisteredModals];

export type ModalType = keyof RegisteredModals;

export type RegisteredModals = typeof registeredModals;

export type Modals = {[key in keyof RegisteredModals]: (modalProps: InferProps<RegisteredModals[key]>) => void};

const registeredModals = {
  showCancelOrder: CancelOrderModal,
  showCancelProfitOrder: CancelProfitOrderModal,
  showCancelAllOrders: CancelAllOrdersModal,
  showCancelAllProfitOrders: CancelAllProfitOrdersModal,
  showAddProfitTarget: AddProfitOrderModal,
  showGeneralModal: GeneralModal,
  showAddApiKeys: AddApiKeysModal,
};

export function showRegisteredModal<P>(type: keyof RegisteredModals, modalProps: P) {
  return React.createElement(registeredModals[type] as any, modalProps);
}

export function createModals(showModal: ({type, props}: ShowModalArgs) => void): Modals {
  return Object.assign(
    {},
    ...Object.keys(registeredModals).map((modalName) => ({
      [modalName]: (props: any) => showModal({type: modalName as keyof typeof registeredModals, props}),
    })),
  );
}
