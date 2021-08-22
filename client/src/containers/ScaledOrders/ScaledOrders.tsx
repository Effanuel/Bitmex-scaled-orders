import React from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Box, Tooltip} from '@chakra-ui/react';
import {WarningTwoIcon, WarningIcon} from '@chakra-ui/icons';
import OrdersPreviewTable from './OrdersPreviewTable/OrdersPreviewTable';
import {previewOrders, previewToggle} from 'redux/modules/preview/previewModule';
import {InputField, SelectDropdown, MainContainer, Button, SideRadioButtons, Row} from 'components';
import DistributionsRadioGroup from './DistributionsRadioGroup';
import {createScaledOrders, DISTRIBUTION, INSTRUMENT_PARAMS} from 'utils';
import {SIDE, SYMBOL} from 'redux/api/bitmex/types';
import {SCALED_CONTAINER} from 'data-test-ids';
import {useAppContext} from 'general/hooks';
import {AppState} from 'redux/modules/state';

const icons = [{element: WarningTwoIcon, color: 'red', onHoverMessage: 'Minimum lotsize for XBT is 100'}];

interface ScaledContainerState {
  orderQty: null | number;
  n_tp: null | number;
  start: null | number;
  end: null | number;
  stop: null | number;
  distribution: DISTRIBUTION;
  side: SIDE;
  symbol: SYMBOL;
}

const initialState: Readonly<ScaledContainerState> = {
  orderQty: null,
  n_tp: null,
  start: null,
  end: null,
  stop: null,
  distribution: DISTRIBUTION.Uniform,
  side: SIDE.SELL,
  symbol: SYMBOL.XBTUSD,
};

export default React.memo(function ScaledContainer() {
  const {api} = useAppContext();
  const dispatch = useDispatch();
  const showPreview = useSelector((state: AppState) => state.preview.showPreview);
  const previewLoading = useSelector((state: AppState) => state.preview.previewLoading);

  const [state, setState] = React.useState(initialState);
  const [isDirty, setDirty] = React.useState(false);

  const onChangeDropdown = React.useCallback((symbol: SYMBOL): void => {
    setState((prevState) => ({...prevState, symbol, start: null, end: null, stop: null}));
    setDirty(true);
  }, []);

  const onChangeNumber = React.useCallback((value: string | number, id: string): void => {
    setState((prevState) => ({...prevState, [id]: value}));
    setDirty(true);
  }, []);

  const toggleSide = React.useCallback((value: SIDE): void => {
    setState((prevState) => ({...prevState, side: value}));
    setDirty(true);
  }, []);

  const onChangeDistribution = React.useCallback((value: string): void => {
    setState((prevState) => ({...prevState, distribution: value as DISTRIBUTION}));
    setDirty(true);
  }, []);

  const onOrderSubmit = React.useCallback((): void => {
    const {distribution, ...rest} = state as RequiredProperty<ScaledContainerState>;
    const ordersProps = {...rest, start: +rest.start, end: +rest.end, stop: rest.stop != undefined ? +rest.stop : 0};
    api.postOrderBulk({orders: createScaledOrders({ordersProps, distribution})});
    setState(initialState);
    setDirty(true);
  }, [api, state]);

  const onPreviewOrders = React.useCallback((): void => {
    if (!isDirty) {
      dispatch(previewToggle());
    } else {
      setDirty(false);
      const {distribution, ...rest} = state as RequiredProperty<ScaledContainerState>;
      const ordersProps = {...rest, start: +rest.start, end: +rest.end, stop: rest.stop != undefined ? +rest.stop : 0};
      dispatch(previewOrders(ordersProps, distribution));
    }
  }, [dispatch, state, isDirty]);

  const step = 1 / INSTRUMENT_PARAMS[state.symbol].ticksize;

  const renderFirstRow = React.useMemo(() => {
    return (
      <Row>
        <SelectDropdown id="symbol" onChange={onChangeDropdown} label="Instrument" />
        <SideRadioButtons testID={SCALED_CONTAINER.SIDE} onChangeRadio={toggleSide} side={state.side} />
        <Box width="35%" />
        <InputField
          testID={SCALED_CONTAINER.STOP_LOSS_INPUT}
          id="stop"
          onChange={onChangeNumber}
          value={state.stop}
          label="Stop-Loss"
          stop={true}
          t_placement="bottom"
          tooltip="(Optional) Price at which to market exit placed contracts."
          step={step}
        />
      </Row>
    );
  }, [onChangeNumber, onChangeDropdown, toggleSide, state.side, state.stop, step]);

  const renderSecondRow = React.useMemo(() => {
    return (
      <Row>
        <InputField
          testID={SCALED_CONTAINER.QUANTITY_INPUT}
          id="orderQty"
          onChange={onChangeNumber}
          value={state.orderQty}
          label="Quantity"
          tooltip="Number of contracts"
        />
        <InputField
          testID={SCALED_CONTAINER.ORDER_COUNT_INPUT}
          id="n_tp"
          onChange={onChangeNumber}
          value={state.n_tp}
          label="Order count"
          tooltip="Number of individual orders"
        />
        <InputField
          testID={SCALED_CONTAINER.RANGE_START_INPUT}
          id="start"
          onChange={onChangeNumber}
          value={state.start}
          label="Range start"
          tooltip="First placed order's price"
          step={step}
        />
        <InputField
          testID={SCALED_CONTAINER.RANGE_END_INPUT}
          id="end"
          onChange={onChangeNumber}
          value={state.end}
          label="Range end"
          tooltip="Last placed order's price"
          step={step}
        />
      </Row>
    );
  }, [onChangeNumber, state, step]);

  const renderThirdRow = React.useMemo(() => {
    const isLotsizeWrong =
      state.symbol === SYMBOL.XBTUSD &&
      state.orderQty &&
      state.n_tp &&
      (+(state.orderQty ?? 0) / +(state.n_tp ?? 0)) % 100 !== 0;
    return (
      <Row alignItems="center">
        <DistributionsRadioGroup onChange={onChangeDistribution} distribution={state.distribution} />
        <Box display="flex" flexDirection="row" alignItems="center">
          {isLotsizeWrong ? (
            <Tooltip hasArrow label="Order quantity will be rounded by 100 min lotsize" bg="gray.300" color="black">
              <WarningIcon marginRight={5} color="red" />
            </Tooltip>
          ) : null}
          <Box marginRight={5}>
            <Button
              testID={SCALED_CONTAINER.PREVIEW_BUTTON}
              variant="text"
              label="Preview"
              onClick={onPreviewOrders}
              disabled={isDisabled(state)}
            />
          </Box>
          <Button
            testID={SCALED_CONTAINER.SUBMIT_BUTTON}
            label="Submit"
            isLoading={previewLoading}
            variant={SIDE.BUY}
            onClick={onOrderSubmit}
            disabled={isDisabled(state)}
          />
        </Box>
      </Row>
    );
  }, [onOrderSubmit, onPreviewOrders, state, previewLoading, onChangeDistribution]);

  const renderOutside = React.useMemo(() => showPreview && <OrdersPreviewTable />, [showPreview]);

  return (
    <MainContainer
      label="Scaled Orders"
      description="Place limit orders in a range"
      renderOutside={renderOutside}
      icons={state.symbol === SYMBOL.XBTUSD ? icons : undefined}
    >
      {renderFirstRow}
      {renderSecondRow}
      {renderThirdRow}
    </MainContainer>
  );
});

function isDisabled(state: ScaledContainerState): boolean {
  const {orderQty, n_tp, start, end, stop, side} = state;
  if (!orderQty || !n_tp || !start || !end || !side) return true;

  const validInputs = !(n_tp > 1);
  const validLimits = orderQty > 20e6 || n_tp > 50;
  const validOrdersWithBuyStop = !!stop && (side === 'Buy' ? stop > start && stop > end : false);
  const validOrdersWithSellStop = !!stop && (side === 'Sell' ? stop < start && stop < end : false);
  return (
    validInputs ||
    validLimits ||
    orderQty < n_tp ||
    validOrdersWithBuyStop ||
    validOrdersWithSellStop ||
    (state.symbol === SYMBOL.XBTUSD && orderQty % 100 !== 0)
  );
}
