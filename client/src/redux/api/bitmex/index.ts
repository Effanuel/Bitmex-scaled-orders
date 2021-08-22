import axios from 'axios';
import _ from 'lodash/fp';
import {OrderBulk} from './bitmex-block';
import {
  AccessToken,
  Affiliate,
  Announcement,
  APIKey,
  Chat,
  ChatChannel,
  CommunicationToken,
  ConnectedUsers,
  Execution,
  Funding,
  GlobalNotification,
  IndexComposite,
  Instrument,
  InstrumentInterval,
  Insurance,
  Leaderboard,
  Liquidation,
  Margin,
  Order,
  OrderBookL2,
  Position,
  Quote,
  QuoteFillRatio,
  QuoteValueRatio,
  Settlement,
  Stats,
  StatsHistory,
  StatsUSD,
  Trade,
  TradeBin,
  Transaction,
  User,
  UserCommissionsBySymbol,
  UserEvent,
  Wallet,
  XAny,
} from './types';

type Routes = 'bulkOrders' | 'order' | 'getBalance' | 'getOrders';

type RequestPayload<T> = {method?: string} & T;

export type RequestParams = Omit<RequestInit, 'body' | 'method'> & {
  secure?: boolean;
};

export type RequestQueryParamsType = Record<string | number, any>;

interface ApiConfig<SecurityDataType> {
  baseUrl?: string;
  baseApiParams?: RequestParams;
  securityWorker?: (securityData: SecurityDataType) => RequestParams;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

enum BodyType {
  Json,
  FormData,
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl = '//www.bitmex.com/api/v1';
  private securityData: SecurityDataType = null as any;
  private securityWorker: null | ApiConfig<SecurityDataType>['securityWorker'] = null;

  private baseApiParams: RequestParams = {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType) => {
    this.securityData = data;
  };

  private addQueryParam(query: RequestQueryParamsType, key: string) {
    return (
      encodeURIComponent(key) + '=' + encodeURIComponent(Array.isArray(query[key]) ? query[key].join(',') : query[key])
    );
  }

  protected addQueryParams(rawQuery?: RequestQueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
    return keys.length
      ? `?${keys
          .map((key) =>
            typeof query[key] === 'object' && !Array.isArray(query[key])
              ? this.addQueryParams(query[key] as object).substring(1)
              : this.addQueryParam(query, key),
          )
          .join('&')}`
      : '';
  }

  private bodyFormatters: Record<BodyType, (input: any) => any> = {
    [BodyType.Json]: JSON.stringify,
    [BodyType.FormData]: (input: any) =>
      Object.keys(input).reduce((data, key) => {
        data.append(key, input[key]);
        return data;
      }, new FormData()),
  };

  private mergeRequestOptions(params: RequestParams, securityParams?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params,
      ...(securityParams || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params.headers || {}),
        ...((securityParams && securityParams.headers) || {}),
      },
    };
  }

  private safeParseResponse = <T = any, E = any>(response: Response): Promise<HttpResponse<T, E>> => {
    const r = response as HttpResponse<T, E>;
    r.data = null as unknown as T;
    r.error = null as unknown as E;

    return response
      .json()
      .then((data) => {
        if (r.ok) {
          r.data = data;
        } else {
          r.error = data;
        }
        return r;
      })
      .catch((e) => {
        r.error = e;
        return r;
      });
  };

  public request = <T = any, E = any>(
    path: string,
    method: string,
    {secure, ...params}: RequestParams = {},
    body?: any,
    bodyType?: BodyType,
    secureByDefault?: boolean,
  ): Promise<HttpResponse<T>> => {
    const requestUrl = `${this.baseUrl}${path}`;
    const secureOptions =
      (secureByDefault || secure) && this.securityWorker ? this.securityWorker(this.securityData) : {};
    const requestOptions = {
      ...this.mergeRequestOptions(params, secureOptions),
      method,
      body: body ? this.bodyFormatters[bodyType || BodyType.Json](body) : null,
    };

    return fetch(requestUrl, requestOptions).then(async (response) => {
      const data = await this.safeParseResponse<T, E>(response);
      if (!response.ok) throw data;
      return data;
    });
  };
}

class MyHTTPClient {
  constructor(private exchange: string) {}
  private addQueryParam(query: RequestQueryParamsType, key: string) {
    return (
      encodeURIComponent(key) + '=' + encodeURIComponent(Array.isArray(query[key]) ? query[key].join(',') : query[key])
    );
  }

  protected addQueryParams(rawQuery?: RequestQueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => 'undefined' !== typeof query[key]);
    return keys.length
      ? `?${keys
          .map((key) =>
            typeof query[key] === 'object' && !Array.isArray(query[key])
              ? this.addQueryParams(query[key] as object).substring(1)
              : this.addQueryParam(query, key),
          )
          .join('&')}`
      : '';
  }

  async _makeRequest<P = any>(path: Routes, payload: RequestPayload<P> | undefined): Promise<HttpResponse<any>> {
    // const response = await axios.post(path, payload);
    // const {data, success} = response.data;
    // return {data, success};
    return axios.post(path, payload);
  }

  _parseData<D, Args extends string>(data: D, args: Args[] = []) {
    const parsedData: JsObj[] | JsObj = typeof data === 'string' ? JSON.parse(data) : data;
    const dataElement = !Array.isArray(parsedData) ? parsedData : parsedData[0];
    return _.pick([...args, 'text'], dataElement);
  }

  async request<P = any, _E = any>(
    path: string,
    method: string,
    {secure, ...params}: RequestParams = {},
    body?: any,
    bodyType?: BodyType,
    secureByDefault?: boolean,
  ): Promise<HttpResponse<P>> {
    const payload = {
      data: body,
      method,
      exchange: this.exchange,
    };
    return await this._makeRequest(`/${this.exchange}${path}` as Routes, payload);
  }
}

/**
 * @title BitMEX API
 * @version 1.0.0
 * @baseUrl //www.bitmex.com/api/v1
 * ## REST API for the BitMEX Trading Platform
 *
 * _If you are building automated tools, please subscribe to the_
 * _[BitMEX API RSS Feed](https://blog.bitmex.com/api_announcement/feed/) for changes. The feed will be updated_
 * _regularly and is the most reliable way to get downtime and update announcements._
 *
 * [View Changelog](/app/apiChangelog)
 *
 * ---
 *
 * #### Getting Started
 *
 * Base URI: [https://www.bitmex.com/api/v1](/api/v1)
 *
 * ##### Fetching Data
 *
 * All REST endpoints are documented below. You can try out any query right from this interface.
 *
 * Most table queries accept `count`, `start`, and `reverse` params. Set `reverse=true` to get rows newest-first.
 *
 * Additional documentation regarding filters, timestamps, and authentication
 * is available in [the main API documentation](/app/restAPI).
 *
 * _All_ table data is available via the [Websocket](/app/wsAPI). We highly recommend using the socket if you want
 * to have the quickest possible data without being subject to ratelimits.
 *
 * ##### Return Types
 *
 * By default, all data is returned as JSON. Send `?_format=csv` to get CSV data or `?_format=xml` to get XML data.
 *
 * ##### Trade Data Queries
 *
 * _This is only a small subset of what is available, to get you started._
 *
 * Fill in the parameters and click the `Try it out!` button to try any of these queries.
 *
 * - [Pricing Data](#!/Quote/Quote_get)
 *
 * - [Trade Data](#!/Trade/Trade_get)
 *
 * - [OrderBook Data](#!/OrderBook/OrderBook_getL2)
 *
 * - [Settlement Data](#!/Settlement/Settlement_get)
 *
 * - [Exchange Statistics](#!/Stats/Stats_history)
 *
 * Every function of the BitMEX.com platform is exposed here and documented. Many more functions are available.
 *
 * ##### Swagger Specification
 *
 * [⇩ Download Swagger JSON](swagger.json)
 *
 * ---
 *
 * ## All API Endpoints
 *
 * Click to expand a section.
 */
export class Api<_SecurityDataType = any> extends MyHTTPClient {
  constructor() {
    super('bitmex');
  }
  announcement = {
    /**
     * No description
     *
     * @tags Announcement
     * @name AnnouncementGet
     * @summary Get site announcements.
     * @request GET:/announcement
     * @secure
     */
    announcementGet: (query?: {columns?: string}, params?: RequestParams) =>
      this.request<Announcement[], Error>(
        `/announcement${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags Announcement
     * @name AnnouncementGetUrgent
     * @summary Get urgent (banner) announcements.
     * @request GET:/announcement/urgent
     * @secure
     */
    announcementGetUrgent: (params?: RequestParams) =>
      this.request<Announcement[], Error>(`/announcement/urgent`, 'GET', params, null, BodyType.Json, true),
  };
  apiKey = {
    /**
     * No description
     *
     * @tags APIKey
     * @name ApiKeyGet
     * @summary Get your API Keys.
     * @request GET:/apiKey
     * @secure
     */
    apiKeyGet: (query?: {reverse?: boolean}, params?: RequestParams) =>
      this.request<APIKey[], Error>(`/apiKey${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),
  };
  chat = {
    /**
     * No description
     *
     * @tags Chat
     * @name ChatGet
     * @summary Get chat messages.
     * @request GET:/chat
     * @secure
     */
    chatGet: (
      query?: {count?: number; start?: number; reverse?: boolean; channelID?: number},
      params?: RequestParams,
    ) => this.request<Chat[], Error>(`/chat${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatNew
     * @summary Send a chat message.
     * @request POST:/chat
     * @secure
     */
    chatNew: (data: {message: string; channelID?: number}, params?: RequestParams) =>
      this.request<Chat, Error>(`/chat`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatGetChannels
     * @summary Get available channels.
     * @request GET:/chat/channels
     * @secure
     */
    chatGetChannels: (params?: RequestParams) =>
      this.request<ChatChannel[], Error>(`/chat/channels`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description Returns an array with browser users in the first position and API users (bots) in the second position.
     *
     * @tags Chat
     * @name ChatGetConnected
     * @summary Get connected users.
     * @request GET:/chat/connected
     * @secure
     */
    chatGetConnected: (params?: RequestParams) =>
      this.request<ConnectedUsers, Error>(`/chat/connected`, 'GET', params, null, BodyType.Json, true),
  };
  execution = {
    /**
     * @description This returns all raw transactions, which includes order opening and cancelation, and order status changes. It can be quite noisy. More focused information is available at `/execution/tradeHistory`. You may also use the `filter` param to target your query. Specify an array as a filter value, such as `{"execType": ["Settlement", "Trade"]}` to filter on multiple values. See [the FIX Spec](http://www.onixs.biz/fix-dictionary/5.0.SP2/msgType_8_8.html) for explanations of these fields.
     *
     * @tags Execution
     * @name ExecutionGet
     * @summary Get all raw executions for your account.
     * @request GET:/execution
     * @secure
     */
    executionGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Execution[], Error>(
        `/execution${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags Execution
     * @name ExecutionGetTradeHistory
     * @summary Get all balance-affecting executions.
     * @request GET:/execution/tradeHistory
     * @secure
     */
    executionGetTradeHistory: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Execution[], Error>(
        `/execution/tradeHistory${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  funding = {
    /**
     * No description
     *
     * @tags Funding
     * @name FundingGet
     * @summary Get funding history.
     * @request GET:/funding
     * @secure
     */
    fundingGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Funding[], Error>(`/funding${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),
  };
  instrument = {
    /**
     * @description This returns all instruments and indices, including those that have settled or are unlisted. Use this endpoint if you want to query for individual instruments or use a complex filter. Use `/instrument/active` to return active instruments, or use a filter like `{"state": "Open"}`.
     *
     * @tags Instrument
     * @name InstrumentGet
     * @summary Get instruments.
     * @request GET:/instrument
     * @secure
     */
    instrumentGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Instrument[], Error>(
        `/instrument${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags Instrument
     * @name InstrumentGetActive
     * @summary Get all active instruments and instruments that have expired in <24hrs.
     * @request GET:/instrument/active
     * @secure
     */
    instrumentGetActive: (params?: RequestParams) =>
      this.request<Instrument[], Error>(`/instrument/active`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Instrument
     * @name InstrumentGetIndices
     * @summary Get all price indices.
     * @request GET:/instrument/indices
     * @secure
     */
    instrumentGetIndices: (params?: RequestParams) =>
      this.request<Instrument[], Error>(`/instrument/indices`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Instrument
     * @name InstrumentGetActiveAndIndices
     * @summary Helper method. Gets all active instruments and all indices. This is a join of the result of /indices and /active.
     * @request GET:/instrument/activeAndIndices
     * @secure
     */
    instrumentGetActiveAndIndices: (params?: RequestParams) =>
      this.request<Instrument[], Error>(`/instrument/activeAndIndices`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description This endpoint is useful for determining which pairs are live. It returns two arrays of   strings. The first is intervals, such as `["XBT:perpetual", "XBT:quarterly", "XBT:biquarterly", "ETH:quarterly", ...]`. These identifiers are usable in any query's `symbol` param. The second array is the current resolution of these intervals. Results are mapped at the same index.
     *
     * @tags Instrument
     * @name InstrumentGetActiveIntervals
     * @summary Return all active contract series and interval pairs.
     * @request GET:/instrument/activeIntervals
     * @secure
     */
    instrumentGetActiveIntervals: (params?: RequestParams) =>
      this.request<InstrumentInterval, Error>(`/instrument/activeIntervals`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description Composite indices are built from multiple external price sources. Use this endpoint to get the underlying prices of an index. For example, send a `symbol` of `.XBT` to get the ticks and weights of the constituent exchanges that build the ".XBT" index. A tick with reference `"BMI"` and weight `null` is the composite index tick.
     *
     * @tags Instrument
     * @name InstrumentGetCompositeIndex
     * @summary Show constituent parts of an index.
     * @request GET:/instrument/compositeIndex
     * @secure
     */
    instrumentGetCompositeIndex: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<IndexComposite[], Error>(
        `/instrument/compositeIndex${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  insurance = {
    /**
     * No description
     *
     * @tags Insurance
     * @name InsuranceGet
     * @summary Get insurance fund history.
     * @request GET:/insurance
     * @secure
     */
    insuranceGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Insurance[], Error>(
        `/insurance${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  leaderboard = {
    /**
     * No description
     *
     * @tags Leaderboard
     * @name LeaderboardGet
     * @summary Get current leaderboard.
     * @request GET:/leaderboard
     * @secure
     */
    leaderboardGet: (query?: {method?: string}, params?: RequestParams) =>
      this.request<Leaderboard[], Error>(
        `/leaderboard${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags Leaderboard
     * @name LeaderboardGetName
     * @summary Get your alias on the leaderboard.
     * @request GET:/leaderboard/name
     * @secure
     */
    leaderboardGetName: (params?: RequestParams) =>
      this.request<{name?: string}, Error>(`/leaderboard/name`, 'GET', params, null, BodyType.Json, true),
  };
  liquidation = {
    /**
     * No description
     *
     * @tags Liquidation
     * @name LiquidationGet
     * @summary Get liquidation orders.
     * @request GET:/liquidation
     * @secure
     */
    liquidationGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Liquidation[], Error>(
        `/liquidation${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  globalNotification = {
    /**
     * @description This is an upcoming feature and currently does not return data.
     *
     * @tags GlobalNotification
     * @name GlobalNotificationGet
     * @summary Get your current GlobalNotifications.
     * @request GET:/globalNotification
     * @secure
     */
    globalNotificationGet: (params?: RequestParams) =>
      this.request<GlobalNotification[], Error>(`/globalNotification`, 'GET', params, null, BodyType.Json, true),
  };
  order = {
    /**
     * @description To get open orders only, send {"open": true} in the filter param. See <a href="http://www.onixs.biz/fix-dictionary/5.0.SP2/msgType_D_68.html">the FIX Spec</a> for explanations of these fields.
     *
     * @tags Order
     * @name OrderGetOrders
     * @summary Get your orders.
     * @request GET:/order
     * @secure
     */
    orderGetOrders: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) => this.request<Order[], Error>(`/order${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description ## Placing Orders This endpoint is used for placing orders. See individual fields below for more details on their use. #### Order Types All orders require a `symbol`. All other fields are optional except when otherwise specified. These are the valid `ordType`s: - **Limit**: The default order type. Specify an `orderQty` and `price`. - **Market**: A traditional Market order. A Market order will execute until filled or your bankruptcy price is reached, at which point it will cancel. - **Stop**: A Stop Market order. Specify an `orderQty` and `stopPx`. When the `stopPx` is reached, the order will be entered into the book. - On sell orders, the order will trigger if the triggering price is lower than the `stopPx`. On buys, higher. - Note: Stop orders do not consume margin until triggered. Be sure that the required margin is available in your account so that it may trigger fully. - `Close` Stops don't require an `orderQty`. See Execution Instructions below. - **StopLimit**: Like a Stop Market, but enters a Limit order instead of a Market order. Specify an `orderQty`, `stopPx`, and `price`. - **MarketIfTouched**: Similar to a Stop, but triggers are done in the opposite direction. Useful for Take Profit orders. - **LimitIfTouched**: As above; use for Take Profit Limit orders. - **Pegged**: Pegged orders allow users to submit a limit price relative to the current market price. Specify a `pegPriceType`, and `pegOffsetValue`. - Pegged orders **must** have an `execInst` of `Fixed`. This means the limit price is set at the time the order is accepted and does not change as the reference price changes. - `PrimaryPeg`: Price is set relative to near touch price. - `MarketPeg`: Price is set relative to far touch price. - A `pegPriceType` submitted with no `ordType` is treated as a `Pegged` order. #### Execution Instructions The following `execInst`s are supported. If using multiple, separate with a comma (e.g. `LastPrice,Close`). - **ParticipateDoNotInitiate**: Also known as a Post-Only order. If this order would have executed on placement, it will cancel instead. This is intended to protect you from the far touch moving towards you while the order is in transit. It is not intended for speculating on the far touch moving away after submission - we consider such behaviour abusive and monitor for it. - **MarkPrice, LastPrice, IndexPrice**: Used by stop and if-touched orders to determine the triggering price. Use only one. By default, `MarkPrice` is used. Also used for Pegged orders to define the value of `LastPeg`. - **ReduceOnly**: A `ReduceOnly` order can only reduce your position, not increase it. If you have a `ReduceOnly` limit order that rests in the order book while the position is reduced by other orders, then its order quantity will be amended down or canceled. If there are multiple `ReduceOnly` orders the least aggressive will be amended first. - **Close**: `Close` implies `ReduceOnly`. A `Close` order will cancel other active limit orders with the same side and symbol if the open quantity exceeds the current position. This is useful for stops: by canceling these orders, a `Close` Stop is ensured to have the margin required to execute, and can only execute up to the full size of your position. If `orderQty` is not specified, a `Close` order has an `orderQty` equal to your current position's size. - Note that a `Close` order without an `orderQty` requires a `side`, so that BitMEX knows if it should trigger above or below the `stopPx`. - **LastWithinMark**: Used by stop orders with `LastPrice` to allow stop triggers only when: - For Sell Stop Market / Stop Limit Order - Last Price &lt= Stop Price - Last Price &gt= Mark Price × (1 - 5%) - For Buy Stop Market / Stop Limit Order: - Last Price &gt= Stop Price - Last Price &lt= Mark Price × (1 + 5%) - **Fixed**: Pegged orders **must** have an `execInst` of `Fixed`. This means the limit price is set at the time the order is accepted and does not change as the reference price changes. #### Pegged Orders Pegged orders allow users to submit a limit price relative to the current market price. The limit price is set once when the order is submitted and does not change with the reference price. This order type is not intended for speculating on the far touch moving away after submission - we consider such behaviour abusive and monitor for it. Pegged orders have an `ordType` of `Pegged`, and an `execInst` of `Fixed`. A `pegPriceType` and `pegOffsetValue` must also be submitted: - `PrimaryPeg` - price is set relative to the **near touch** price - `MarketPeg` - price is set relative to the **far touch** price #### Trailing Stop Pegged Orders Use `pegPriceType` of `TrailingStopPeg` to create Trailing Stops. The price is set at submission and updates once per second if the underlying price (last/mark/index) has moved by more than 0.1%. `stopPx` then moves as the market moves away from the peg, and freezes as the market moves toward it. Use `pegOffsetValue` to set the `stopPx` of your order. The peg is set to the triggering price specified in the `execInst` (default `MarkPrice`). Use a negative offset for stop-sell and buy-if-touched orders. Requires `ordType`: `Stop`, `StopLimit`, `MarketIfTouched`, `LimitIfTouched`. #### Linked Orders [Linked Orders are deprecated as of 2018/11/10](https://blog.bitmex.com/api_announcement/deprecation-of-contingent-orders/) #### Trailing Stops You may use `pegPriceType` of `'TrailingStopPeg'` to create Trailing Stops. The pegged `stopPx` will move as the market moves away from the peg, and freeze as the market moves toward it. To use, combine with `pegOffsetValue` to set the `stopPx` of your order. The peg is set to the triggering price specified in the `execInst` (default `'MarkPrice'`). Use a negative offset for stop-sell and buy-if-touched orders. Requires `ordType`: `'Stop', 'StopLimit', 'MarketIfTouched', 'LimitIfTouched'`. #### Simple Quantities [Simple Quantities are deprecated as of 2018/10/26](https://blog.bitmex.com/api_announcement/deprecation-of-simpleorderqty-functionality/) #### Rate Limits See the [Bulk Order Documentation](#!/Order/Order_newBulk) if you need to place multiple orders at the same time. Bulk orders require fewer risk checks in the trading engine and thus are ratelimited at **1/10** the normal rate. You can also improve your reactivity to market movements while staying under your ratelimit by using the [Amend](#!/Order/Order_amend) and [Amend Bulk](#!/Order/Order_amendBulk) endpoints. This allows you to stay in the market and avoids the cancel/replace cycle. #### Tracking Your Orders If you want to keep track of order IDs yourself, set a unique `clOrdID` per order. This `clOrdID` will come back as a property on the order and any related executions (including on the WebSocket), and can be used to get or cancel the order. Max length is 36 characters. You can also change the `clOrdID` by amending an order, supplying an `origClOrdID`, and your desired new ID as the `clOrdID` param, like so: ``` # Amends an order's leavesQty, and updates its clOrdID to "def-456" PUT /api/v1/order {"origClOrdID": "abc-123", "clOrdID": "def-456", "leavesQty": 1000} ```
     *
     * @tags Order
     * @name OrderNew
     * @summary Create a new order.
     * @request POST:/order
     * @secure
     */
    orderNew: (
      data: {
        symbol: string;
        side?: string;
        simpleOrderQty?: number;
        orderQty?: number;
        price?: number;
        displayQty?: number;
        stopPx?: number;
        clOrdID?: string;
        clOrdLinkID?: string;
        pegOffsetValue?: number;
        pegPriceType?: string;
        ordType?: string;
        timeInForce?: string;
        execInst?: string;
        contingencyType?: string;
        text?: string;
      },
      params?: RequestParams,
    ) => this.request<Order, Error>(`/order`, 'POST', params, data, BodyType.Json, true),

    /**
     * @description Send an `orderID` or `origClOrdID` to identify the order you wish to amend. Both order quantity and price can be amended. Only one `qty` field can be used to amend. Use the `leavesQty` field to specify how much of the order you wish to remain open. This can be useful if you want to adjust your position's delta by a certain amount, regardless of how much of the order has already filled. > A `leavesQty` can be used to make a "Filled" order live again, if it is received within 60 seconds of the fill. Like order placement, amending can be done in bulk. Simply send a request to `PUT /api/v1/order/bulk` with a JSON body of the shape: `{"orders": [{...}, {...}]}`, each object containing the fields used in this endpoint.
     *
     * @tags Order
     * @name OrderAmend
     * @summary Amend the quantity or price of an open order.
     * @request PUT:/order
     * @secure
     */
    orderAmend: (
      data: {
        orderID?: string;
        origClOrdID?: string;
        clOrdID?: string;
        simpleOrderQty?: number;
        orderQty?: number;
        simpleLeavesQty?: number;
        leavesQty?: number;
        price?: number;
        stopPx?: number;
        pegOffsetValue?: number;
        text?: string;
      },
      params?: RequestParams,
    ) => this.request<Order, Error>(`/order`, 'PUT', params, data, BodyType.Json, true),

    /**
     * @description Either an orderID or a clOrdID must be provided.
     *
     * @tags Order
     * @name OrderCancel
     * @summary Cancel order(s). Send multiple order IDs to cancel in bulk.
     * @request DELETE:/order
     * @secure
     */
    orderCancel: (data: {orderID?: string | string[]; clOrdID?: string; text?: string}, params?: RequestParams) =>
      this.request<Order[], Error>(`/order`, 'DELETE', params, data, BodyType.Json, true),

    /**
     * @description This endpoint is used for placing bulk orders. Valid order types are Limit, Stop, StopLimit, MarketIfTouched, LimitIfTouched, and Pegged. Each individual order object in the array should have the same properties as an individual POST /order call. This endpoint is much faster for getting many orders into the book at once. Because it reduces load on BitMEX systems, this endpoint is rate limited at `ceil(0.1 * orders)` on the per minute limiter. Submitting 10 orders via a bulk order call will only count as 1 request, 15 as 2, 32 as 4, and so on. Bulk requests are not scored against the per second limiter and always deduct 1 token for every request. For now, only `application/json` is supported on this endpoint.
     *
     * @tags Order
     * @name OrderNewBulk
     * @summary Create multiple new orders for the same symbol.
     * @request POST:/order/bulk
     * @secure
     */
    orderNewBulk: (data: {orders?: OrderBulk[]}, params?: RequestParams) =>
      this.request<Order[], Error>(`/order/bulk`, 'POST', params, data, BodyType.Json, true),

    /**
     * @description Similar to POST /amend, but with multiple orders. `application/json` only. Ratelimited at 10% of the per minute rate limiter.
     *
     * @tags Order
     * @name OrderAmendBulk
     * @summary Amend multiple orders for the same symbol.
     * @request PUT:/order/bulk
     * @secure
     */
    orderAmendBulk: (data: {orders?: string}, params?: RequestParams) =>
      this.request<Order[], Error>(`/order/bulk`, 'PUT', params, data, BodyType.Json, true),

    /**
     * @description If no `price` is specified, a market order will be submitted to close the whole of your position. This will also close all other open orders in this symbol.
     *
     * @tags Order
     * @name OrderClosePosition
     * @summary Close a position. [Deprecated, use POST /order with execInst: 'Close']
     * @request POST:/order/closePosition
     * @secure
     */
    orderClosePosition: (data: {symbol: string; price?: number}, params?: RequestParams) =>
      this.request<Order, Error>(`/order/closePosition`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Order
     * @name OrderCancelAll
     * @summary Cancels all of your orders.
     * @request DELETE:/order/all
     * @secure
     */
    orderCancelAll: (data: {symbol?: string; filter?: string; text?: string}, params?: RequestParams) =>
      this.request<Order[], Error>(`/order/all`, 'DELETE', params, data, BodyType.Json, true),

    /**
     * @description Useful as a dead-man's switch to ensure your orders are canceled in case of an outage. If called repeatedly, the existing offset will be canceled and a new one will be inserted in its place. Example usage: call this route at 15s intervals with an offset of 60000 (60s). If this route is not called within 60 seconds, all your orders will be automatically canceled. This is also available via [WebSocket](https://www.bitmex.com/app/wsAPI#Dead-Mans-Switch-Auto-Cancel).
     *
     * @tags Order
     * @name OrderCancelAllAfter
     * @summary Automatically cancel all your orders after a specified timeout.
     * @request POST:/order/cancelAllAfter
     * @secure
     */
    orderCancelAllAfter: (data: {timeout: number}, params?: RequestParams) =>
      this.request<XAny, Error>(`/order/cancelAllAfter`, 'POST', params, data, BodyType.Json, true),
  };
  orderBook = {
    /**
     * No description
     *
     * @tags OrderBook
     * @name OrderBookGetL2
     * @summary Get current orderbook in vertical format.
     * @request GET:/orderBook/L2
     * @secure
     */
    orderBookGetL2: (query: {symbol: string; depth?: number}, params?: RequestParams) =>
      this.request<OrderBookL2[], Error>(
        `/orderBook/L2${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  position = {
    /**
     * @description This endpoint is used for retrieving position information. The fields largely follow the [FIX spec](http://www.onixs.biz/fix-dictionary/5.0.SP2/msgType_AP_6580.html) definitions. Some selected fields are explained in more detail below. The fields _account_, _symbol_, _currency_ are unique to each position and form its key. - **account**: Your unique account ID. - **symbol**: The contract for this position. - **currency**: The margin currency for this position. - **underlying**: Meta data of the _symbol_. - **quoteCurrency**: Meta data of the _symbol_, All prices are in the _quoteCurrency_ - **commission**: The maximum of the maker, taker, and settlement fee. - **initMarginReq**: The initial margin requirement. This will be at least the symbol's default initial maintenance margin, but can be higher if you choose lower leverage. - **maintMarginReq**: The maintenance margin requirement. This will be at least the symbol's default maintenance maintenance margin, but can be higher if you choose a higher risk limit. - **riskLimit**: This is a function of your _maintMarginReq_. - **leverage**: 1 / initMarginReq. - **crossMargin**: True/false depending on whether you set cross margin on this position. - **deleveragePercentile**: Indicates where your position is in the ADL queue. - **rebalancedPnl**: The value of realised PNL that has transferred to your wallet for this position. - **prevRealisedPnl**: The value of realised PNL that has transferred to your wallet for this position since the position was closed. - **currentQty**: The current position amount in contracts. - **currentCost**: The current cost of the position in the settlement currency of the symbol (_currency_). - **currentComm**: The current commission of the position in the settlement currency of the symbol (_currency_). - **realisedCost**: The realised cost of this position calculated with regard to average cost accounting. - **unrealisedCost**: _currentCost_ - _realisedCost_. - **grossOpenCost**: The absolute value of your open orders for this symbol. - **grossOpenPremium**: The amount your bidding above the mark price in the settlement currency of the symbol (_currency_). - **markPrice**: The mark price of the symbol in _quoteCurrency_. - **markValue**: The _currentQty_ at the mark price in the settlement currency of the symbol (_currency_). - **homeNotional**: Value of position in units of _underlying_. - **foreignNotional**: Value of position in units of _quoteCurrency_. - **realisedPnl**: The negative of _realisedCost_. - **unrealisedGrossPnl**: _markValue_ - _unrealisedCost_. - **unrealisedPnl**: _unrealisedGrossPnl_. - **liquidationPrice**: Once markPrice reaches this price, this position will be liquidated. - **bankruptPrice**: Once markPrice reaches this price, this position will have no equity.
     *
     * @tags Position
     * @name PositionGet
     * @summary Get your positions.
     * @request GET:/position
     * @secure
     */
    positionGet: (query?: {filter?: string; columns?: string; count?: number}, params?: RequestParams) =>
      this.request<Position[], Error>(
        `/position${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags Position
     * @name PositionIsolateMargin
     * @summary Enable isolated margin or cross margin per-position.
     * @request POST:/position/isolate
     * @secure
     */
    positionIsolateMargin: (data: {symbol: string; enabled?: boolean}, params?: RequestParams) =>
      this.request<Position, Error>(`/position/isolate`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Position
     * @name PositionUpdateRiskLimit
     * @summary Update your risk limit.
     * @request POST:/position/riskLimit
     * @secure
     */
    positionUpdateRiskLimit: (data: {symbol: string; riskLimit: number}, params?: RequestParams) =>
      this.request<Position, Error>(`/position/riskLimit`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Position
     * @name PositionTransferIsolatedMargin
     * @summary Transfer equity in or out of a position.
     * @request POST:/position/transferMargin
     * @secure
     */
    positionTransferIsolatedMargin: (data: {symbol: string; amount: number}, params?: RequestParams) =>
      this.request<Position, Error>(`/position/transferMargin`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Position
     * @name PositionUpdateLeverage
     * @summary Choose leverage for a position.
     * @request POST:/position/leverage
     * @secure
     */
    positionUpdateLeverage: (data: {symbol: string; leverage: number}, params?: RequestParams) =>
      this.request<Position, Error>(`/position/leverage`, 'POST', params, data, BodyType.Json, true),
  };
  quote = {
    /**
     * No description
     *
     * @tags Quote
     * @name QuoteGet
     * @summary Get Quotes.
     * @request GET:/quote
     * @secure
     */
    quoteGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) => this.request<Quote[], Error>(`/quote${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description Timestamps returned by our bucketed endpoints are the **end** of the period, indicating when the bucket was written to disk. Some other common systems use the timestamp as the beginning of the period. Please be aware of this when using this endpoint.
     *
     * @tags Quote
     * @name QuoteGetBucketed
     * @summary Get previous quotes in time buckets.
     * @request GET:/quote/bucketed
     * @secure
     */
    quoteGetBucketed: (
      query?: {
        binSize?: string;
        partial?: boolean;
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Quote[], Error>(
        `/quote/bucketed${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  schema = {
    /**
     * No description
     *
     * @tags Schema
     * @name SchemaGet
     * @summary Get model schemata for data objects returned by this API.
     * @request GET:/schema
     * @secure
     */
    schemaGet: (query?: {model?: string}, params?: RequestParams) =>
      this.request<XAny, Error>(`/schema${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Schema
     * @name SchemaWebsocketHelp
     * @summary Returns help text & subject list for websocket usage.
     * @request GET:/schema/websocketHelp
     * @secure
     */
    schemaWebsocketHelp: (params?: RequestParams) =>
      this.request<XAny, Error>(`/schema/websocketHelp`, 'GET', params, null, BodyType.Json, true),
  };
  settlement = {
    /**
     * No description
     *
     * @tags Settlement
     * @name SettlementGet
     * @summary Get settlement history.
     * @request GET:/settlement
     * @secure
     */
    settlementGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<Settlement[], Error>(
        `/settlement${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  stats = {
    /**
     * No description
     *
     * @tags Stats
     * @name StatsGet
     * @summary Get exchange-wide and per-series turnover and volume statistics.
     * @request GET:/stats
     * @secure
     */
    statsGet: (params?: RequestParams) =>
      this.request<Stats[], Error>(`/stats`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Stats
     * @name StatsHistory
     * @summary Get historical exchange-wide and per-series turnover and volume statistics.
     * @request GET:/stats/history
     * @secure
     */
    statsHistory: (params?: RequestParams) =>
      this.request<StatsHistory[], Error>(`/stats/history`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags Stats
     * @name StatsHistoryUsd
     * @summary Get a summary of exchange statistics in USD.
     * @request GET:/stats/historyUSD
     * @secure
     */
    statsHistoryUsd: (params?: RequestParams) =>
      this.request<StatsUSD[], Error>(`/stats/historyUSD`, 'GET', params, null, BodyType.Json, true),
  };
  trade = {
    /**
     * @description Please note that indices (symbols starting with `.`) post trades at intervals to the trade feed. These have a `size` of 0 and are used only to indicate a changing price. See [the FIX Spec](http://www.onixs.biz/fix-dictionary/5.0.SP2/msgType_AE_6569.html) for explanations of these fields.
     *
     * @tags Trade
     * @name TradeGet
     * @summary Get Trades.
     * @request GET:/trade
     * @secure
     */
    tradeGet: (
      query?: {
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) => this.request<Trade[], Error>(`/trade${this.addQueryParams(query)}`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description Timestamps returned by our bucketed endpoints are the **end** of the period, indicating when the bucket was written to disk. Some other common systems use the timestamp as the beginning of the period. Please be aware of this when using this endpoint. Also note the `open` price is equal to the `close` price of the previous timeframe bucket.
     *
     * @tags Trade
     * @name TradeGetBucketed
     * @summary Get previous trades in time buckets.
     * @request GET:/trade/bucketed
     * @secure
     */
    tradeGetBucketed: (
      query?: {
        binSize?: string;
        partial?: boolean;
        symbol?: string;
        filter?: string;
        columns?: string;
        count?: number;
        start?: number;
        reverse?: boolean;
        startTime?: string;
        endTime?: string;
      },
      params?: RequestParams,
    ) =>
      this.request<TradeBin[], Error>(
        `/trade/bucketed${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name UserGetDepositAddress
     * @summary Get a deposit address.
     * @request GET:/user/depositAddress
     * @secure
     */
    userGetDepositAddress: (query?: {currency?: string}, params?: RequestParams) =>
      this.request<string, Error>(
        `/user/depositAddress${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserGetWallet
     * @summary Get your current wallet information.
     * @request GET:/user/wallet
     * @secure
     */
    userGetWallet: (query?: {currency?: string}, params?: RequestParams) =>
      this.request<Wallet, Error>(
        `/user/wallet${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserGetWalletHistory
     * @summary Get a history of all of your wallet transactions (deposits, withdrawals, PNL).
     * @request GET:/user/walletHistory
     * @secure
     */
    userGetWalletHistory: (query?: {currency?: string; count?: number; start?: number}, params?: RequestParams) =>
      this.request<Transaction[], Error>(
        `/user/walletHistory${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserGetWalletSummary
     * @summary Get a summary of all of your wallet transactions (deposits, withdrawals, PNL).
     * @request GET:/user/walletSummary
     * @secure
     */
    userGetWalletSummary: (query?: {currency?: string}, params?: RequestParams) =>
      this.request<Transaction[], Error>(
        `/user/walletSummary${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserGetExecutionHistory
     * @summary Get the execution history by day.
     * @request GET:/user/executionHistory
     * @secure
     */
    userGetExecutionHistory: (query: {symbol: string; timestamp: string}, params?: RequestParams) =>
      this.request<XAny, Error>(
        `/user/executionHistory${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * @description This is changed based on network conditions to ensure timely withdrawals. During network congestion, this may be high. The fee is returned in the same currency.
     *
     * @tags User
     * @name UserMinWithdrawalFee
     * @summary Get the minimum withdrawal fee for a currency.
     * @request GET:/user/minWithdrawalFee
     * @secure
     */
    userMinWithdrawalFee: (query?: {currency?: string}, params?: RequestParams) =>
      this.request<XAny, Error>(
        `/user/minWithdrawalFee${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * @description This will send a confirmation email to the email address on record.
     *
     * @tags User
     * @name UserRequestWithdrawal
     * @summary Request a withdrawal to an external wallet.
     * @request POST:/user/requestWithdrawal
     * @secure
     */
    userRequestWithdrawal: (
      data: {
        otpToken?: string;
        currency: string;
        amount: number;
        address?: string;
        addressId?: number;
        targetUserId?: number;
        fee?: number;
        text?: string;
      },
      params?: RequestParams,
    ) => this.request<Transaction, Error>(`/user/requestWithdrawal`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserCancelWithdrawal
     * @summary Cancel a withdrawal.
     * @request POST:/user/cancelWithdrawal
     * @secure
     */
    userCancelWithdrawal: (data: {token: string}, params?: RequestParams) =>
      this.request<Transaction, Error>(`/user/cancelWithdrawal`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserConfirmWithdrawal
     * @summary Confirm a withdrawal.
     * @request POST:/user/confirmWithdrawal
     * @secure
     */
    userConfirmWithdrawal: (data: {token: string}, params?: RequestParams) =>
      this.request<Transaction, Error>(`/user/confirmWithdrawal`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserConfirm
     * @summary Confirm your email address with a token.
     * @request POST:/user/confirmEmail
     * @secure
     */
    userConfirm: (data: {token: string}, params?: RequestParams) =>
      this.request<AccessToken, Error>(`/user/confirmEmail`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserGetAffiliateStatus
     * @summary Get your current affiliate/referral status.
     * @request GET:/user/affiliateStatus
     * @secure
     */
    userGetAffiliateStatus: (params?: RequestParams) =>
      this.request<Affiliate, Error>(`/user/affiliateStatus`, 'GET', params, null, BodyType.Json, true),

    /**
     * @description If the code is valid, responds with the referral code's discount (e.g. `0.1` for 10%). Otherwise, will return a 404 or 451 if invalid.
     *
     * @tags User
     * @name UserCheckReferralCode
     * @summary Check if a referral code is valid.
     * @request GET:/user/checkReferralCode
     * @secure
     */
    userCheckReferralCode: (query?: {referralCode?: string}, params?: RequestParams) =>
      this.request<number, Error>(
        `/user/checkReferralCode${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserGetQuoteFillRatio
     * @summary Get 7 days worth of Quote Fill Ratio statistics.
     * @request GET:/user/quoteFillRatio
     * @secure
     */
    userGetQuoteFillRatio: (params?: RequestParams) =>
      this.request<QuoteFillRatio, Error>(`/user/quoteFillRatio`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserGetQuoteValueRatio
     * @summary Get Quote Value Ratio statistics over the last 3 days
     * @request GET:/user/quoteValueRatio
     * @secure
     */
    userGetQuoteValueRatio: (params?: RequestParams) =>
      this.request<QuoteValueRatio, Error>(`/user/quoteValueRatio`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserLogout
     * @summary Log out of BitMEX.
     * @request POST:/user/logout
     * @secure
     */
    userLogout: (params?: RequestParams) =>
      this.request<any, Error>(`/user/logout`, 'POST', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserSavePreferences
     * @summary Save user preferences.
     * @request POST:/user/preferences
     * @secure
     */
    userSavePreferences: (data: {prefs: string; overwrite?: boolean}, params?: RequestParams) =>
      this.request<User, Error>(`/user/preferences`, 'POST', params, data, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserGet
     * @summary Get your user model.
     * @request GET:/user
     * @secure
     */
    userGet: (params?: RequestParams) => this.request<User, Error>(`/user`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserGetCommission
     * @summary Get your account's commission status.
     * @request GET:/user/commission
     * @secure
     */
    userGetCommission: (params?: RequestParams) =>
      this.request<UserCommissionsBySymbol, Error>(`/user/commission`, 'GET', params, null, BodyType.Json, true),

    /**
     * No description
     *
     * @tags User
     * @name UserGetMargin
     * @summary Get your account's margin status. Send a currency of "all" to receive an array of all supported currencies.
     * @request GET:/user/margin
     * @secure
     */
    userGetMargin: (query?: {currency?: string}, params?: RequestParams) =>
      this.request<Margin, Error>(
        `/user/margin${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),

    /**
     * No description
     *
     * @tags User
     * @name UserCommunicationToken
     * @summary Register your communication token for mobile clients
     * @request POST:/user/communicationToken
     * @secure
     */
    userCommunicationToken: (data: {token: string; platformAgent: string}, params?: RequestParams) =>
      this.request<CommunicationToken[], Error>(`/user/communicationToken`, 'POST', params, data, BodyType.Json, true),
  };
  userEvent = {
    /**
     * No description
     *
     * @tags UserEvent
     * @name UserEventGet
     * @summary Get your user events
     * @request GET:/userEvent
     * @secure
     */
    userEventGet: (query?: {count?: number; startId?: number}, params?: RequestParams) =>
      this.request<UserEvent[], Error>(
        `/userEvent${this.addQueryParams(query)}`,
        'GET',
        params,
        null,
        BodyType.Json,
        true,
      ),
  };
}
