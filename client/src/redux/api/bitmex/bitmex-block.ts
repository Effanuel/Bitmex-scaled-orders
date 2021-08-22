import {createProfitTarget, MarketOrderProps, ProfitTarget, ProfitTargetProps, RegularOrder, StopLoss} from 'utils';
import {Api as BitmexAPI} from '.';
import {EXEC_INST, Order, ORD_TYPE} from './types';

export type LimitOrder = Pick<Order, 'symbol' | 'price' | 'orderQty' | 'side' | 'text'>;
export type OrderAmend = Pick<Order, 'orderID' | 'price'>;
export type OrderCancel = {orderID: string[] | string};
export type OrderBulk = RegularOrder | StopLoss | ProfitTarget;

export class BitmexBlock {
  private bitmex: BitmexAPI;

  constructor() {
    this.bitmex = new BitmexAPI();
  }

  marketOrder = (props: MarketOrderProps) => this.bitmex.order.orderNew({...props, ordType: ORD_TYPE.Market});
  limitOrder = (props: LimitOrder) =>
    this.bitmex.order.orderNew({...props, execInst: EXEC_INST.ParticipateDoNotInitiate, ordType: ORD_TYPE.Limit});
  profitTargetOrder = (props: ProfitTargetProps) => this.bitmex.order.orderNew(createProfitTarget(props));
  orderAmend = (props: OrderAmend) => this.bitmex.order.orderAmend(props);
  orderCancel = (props: OrderCancel) => this.bitmex.order.orderCancel(props);
  orderCancelAll = () => this.bitmex.order.orderCancelAll({});
  orderBulk = (props: {orders: OrderBulk[]}) => this.bitmex.order.orderNewBulk({orders: props.orders});
  getBalance = () => this.bitmex.user.userGetMargin();
  getOpenOrders = () => this.bitmex.order.orderGetOrders({filter: '{"open": true}', reverse: true});
}
