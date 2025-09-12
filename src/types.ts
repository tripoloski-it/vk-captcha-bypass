export interface IBypasserOptions {
  /** Версия API */
  readonly version?: string;
  /** Адрес API */
  readonly baseApiUrl?: string;
  /**
   * Максимальный размер данных для "датчиков"
   * @default 900
   */
  readonly maxSensorsDataSizeKb?: number;
}

export interface IRedirectUriQueryParams {
  readonly domain: string;
  readonly session_token: string;
  readonly variant: string;
  readonly blank: string;
}

export interface IAPIRequestParams {
  readonly key: string;
  readonly value: string;
}

export interface IApiError {
  readonly error_code: number;
  readonly error_msg: string;
  readonly request_params: Array<IAPIRequestParams>;
}

export interface IMousePoint {
  readonly x: number;
  readonly y: number;
}

export interface IMouseTraceParams {
  /**
   * Начальная точка движения курсора.
   * Если не задана — генерируется случайная точка в правой нижней четверти экрана (по умолчанию 1080x720).
   * @example { x: 800, y: 600 }
   */
  readonly from?: IMousePoint;

  /**
   * Конечная точка движения курсора.
   * Если не задана — генерируется случайная точка в пределах ±300 пикселей от `from`.
   * @example { x: 950, y: 450 }
   */
  readonly to?: IMousePoint;

  /**
   * Интервал в миллисекундах между соседними точками трассировки.
   * Определяет "частоту кадров" движения: чем меньше интервал — тем плавнее и детальнее трасса.
   * По умолчанию: 500 мс (т.е. 2 точки в секунду).
   * @default 500
   * @minimum 1
   * @example 100 // для плавного движения — 10 точек в секунду
   */
  readonly intervalMs?: number;

  /**
   * Общая длительность всей анимации движения мыши в миллисекундах.
   * Определяет, сколько времени займёт перемещение от `from` до `to`.
   * Используется для расчёта общего количества точек: `Math.floor(durationMs / intervalMs)`.
   * Если не задана — выбирается случайное значение от 2000 до 15000 мс.
   * @default random between 2000 and 15000
   * @minimum 1
   * @example 5000 // 5 секунд движения
   */
  readonly durationMs?: number;
}

export interface IPowHashParams {
  readonly input: string;
  readonly difficulty: number;
}

export type IBaseCaptchaResponse = { status: 'OK' | 'ERROR' };

export interface ICaptchaSettings extends IBaseCaptchaResponse {
  readonly sensors_delay: number;
  readonly bridge_sensors_list: ['accelerometer', 'gyroscope', 'motion', 'cursor', 'taps'];
}

export interface ICaptchaResponse extends IBaseCaptchaResponse {
  readonly success_token: string;
  readonly redirect: number;
  readonly show_captcha_type: string;
}
