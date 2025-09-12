import {
  IApiError,
  IBaseCaptchaResponse,
  IBypasserOptions,
  ICaptchaResponse,
  ICaptchaSettings,
  IMousePoint,
  IMouseTraceParams,
  IPowHashParams,
  IRedirectUriQueryParams,
} from './types';
import { generateMouseTrace, generatePoW } from './utils';

export class VKCaptchaBypasserError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class APIError extends Error {
  constructor(private error: IApiError) {
    super(`${error.error_msg} (Code: ${error.error_code})`);
  }

  public get code() {
    return this.error.error_code;
  }

  public get params() {
    return this.error.request_params;
  }
}

export class VKCaptchaBypasser {
  private version: string;
  private baseApiUrl: string;
  private maxSensorsDataSizeKb: number;

  constructor(options?: IBypasserOptions) {
    this.version = options?.version || '5.199';
    this.baseApiUrl = options?.baseApiUrl || 'https://api.vk.ru/';
    this.maxSensorsDataSizeKb = options?.maxSensorsDataSizeKb || 900;
  }

  public async bypass(
    redirectUri: string,
    mouseTraceParams?: IMouseTraceParams,
  ): Promise<ICaptchaResponse> {
    const pow = await this.loadPoWChallengeParams(redirectUri);
    const hash = await generatePoW(pow.input, pow.difficulty);

    const queryParams = new URLSearchParams(redirectUri.replace(/(.*)\?/, ''));
    const { session_token, domain } = Object.fromEntries(
      queryParams.entries(),
    ) as unknown as IRedirectUriQueryParams;

    const initialParams = { session_token, domain };

    const { bridge_sensors_list: sensorsList } = await this.request<ICaptchaSettings>(
      'captchaNotRobot.settings',
      initialParams,
    );
    await this.request<IBaseCaptchaResponse>('captchaNotRobot.componentDone', initialParams);

    const sensorsData = this.buildSensorsData(sensorsList, mouseTraceParams);

    const captcha = await this.request<ICaptchaResponse>('captchaNotRobot.check', {
      ...initialParams,
      ...sensorsData,
      hash,
      answer: 'e30=',
    });

    await this.request<IBaseCaptchaResponse>('captchaNotRobot.endSession', initialParams);

    return captcha;
  }

  private async request<T>(method: string, params: Record<string, unknown>) {
    const entries = Object.entries({ ...params, v: this.version });

    const encoded = entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return [key, JSON.stringify(value)];
      return [key, String(value)];
    });

    const body = new URLSearchParams(Object.fromEntries(encoded));

    const contentLength = Buffer.from(body.toString()).byteLength;
    const url = new URL(`/method/${method}`, this.baseApiUrl);

    const fetchResponse = await fetch(url.toString(), {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': contentLength.toString(),
      },
      body,
      method: 'POST',
    });

    const response = (await fetchResponse.json()) as any;

    if ('error' in response) throw new APIError(response.error);
    if ('status' in response && response.status === 'ERROR')
      throw new APIError({
        error_code: 0,
        error_msg: `APIError: ${JSON.stringify(response)}`,
        request_params: [
          ...body
            .entries()
            .map(([key, value]) => ({ key, value }))
            .toArray(),
        ],
      });

    return response.response as T;
  }
  private async loadPoWChallengeParams(redirectUri: string): Promise<IPowHashParams> {
    const fetchResponse = await fetch(redirectUri);
    const html = await fetchResponse.text();

    const [, input] = html.match(/const powInput\s*=\s*"([^']+)";/i) || [];
    if (typeof input !== 'string') {
      throw new VKCaptchaBypasserError(`No "powInput" value`);
    }

    const [, rawDifficulty] = html.match(/const difficulty\s*=\s*(\d+);/) || [];
    if (typeof rawDifficulty !== 'string') {
      throw new VKCaptchaBypasserError(`No "difficulty" value`);
    }

    const difficulty = Number(rawDifficulty);

    return { difficulty, input };
  }

  private buildSensorsData(
    sensorsList: ICaptchaSettings['bridge_sensors_list'],
    mouseTraceParams?: IMouseTraceParams,
  ): Record<string, IMousePoint[]> {
    let cursor = generateMouseTrace(mouseTraceParams);

    const maxBytes = this.maxSensorsDataSizeKb * 1024;
    const avgBytesPerPoint = 20;

    let maxPoints = Math.floor(maxBytes / avgBytesPerPoint);

    if (cursor.length > maxPoints) {
      cursor = cursor.slice(0, maxPoints);
    }

    let sensors: Record<string, IMousePoint[]> = {};
    for (const sensor of sensorsList) {
      sensors[sensor] = sensor === 'cursor' ? cursor : [];
    }

    return sensors;
  }
}
