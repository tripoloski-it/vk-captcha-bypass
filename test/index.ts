import { setTimeout as sleep } from 'timers/promises';
import { APIError, VKCaptchaBypasser } from '../src';

const bypasser = new VKCaptchaBypasser();

const getCookies = async (): Promise<string[]> => {
  const fetchResponse = await fetch('https://vk.ru');
  const cookies = fetchResponse.headers.getSetCookie();

  return cookies.map(raw => {
    const [keyValue] = raw.split(';');

    return keyValue!;
  });
};

const sendMessage = async (
  params: Record<string, unknown>,
  cookies: string[],
  bypassAttempts = 3,
) => {
  const body = new URLSearchParams({
    ...params,
    v: '5.258',
    access_token: '',
  } as Record<string, string>).toString();

  const request = new Request('https://api.vk.ru/method/messages.send', {
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies.join('; '),
    },
    method: 'POST',
  });
  const fetchResponse = await fetch(request);

  const response = (await fetchResponse.json()) as any;

  if ('error' in response) {
    if (response.error.error_code === 14) {
      if (!bypassAttempts) throw new APIError(response.error);
      console.log('Bypass attempts remained:', bypassAttempts);
      const captcha = await bypasser.bypass(response.error.redirect_uri);
      let retry = await sendMessage(
        { ...params, success_token: captcha.success_token },
        cookies,
        --bypassAttempts,
      );
      console.log('Captcha token:', captcha.success_token);
      return retry;
    }

    throw new APIError(response.error);
  }

  return response;
};

const start = async () => {
  let messagesCount = 0;
  const cookies = await getCookies();
  try {
    while (true) {
      await sendMessage(
        {
          message: `Message: ${messagesCount + 1}`,
          random_id: Math.floor(Math.random() * Date.now()),
          peer_id: 1,
        },
        cookies,
      );

      console.log(`Messages sent: ${messagesCount}`);
      messagesCount++;
      await sleep(500);
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.log(error.message, error.code, error.params);
    }
  }
};

start();
