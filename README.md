# VKCaptchaBypasser

> ⚠️ Только для исследований. Обход CAPTCHA нарушает ToS VK. Используйте на свой риск.

---

## Пример использования

```ts
import { VKCaptchaBypasser } from 'vk-captcha-bypass';

const bypasser = new VKCaptchaBypasser();

try {
  const result = await bypasser.bypass('https://id.vk.com/not_robot_captcha?...');
  console.log('Токен:', result.success_token);
} catch (err) {
  console.error('Ошибка:', err.message);
}
```

---

## 🔑 ВАЖНО

❗ Полученный `success_token` **не работает сам по себе**.  
Вы **обязаны** отправить его **вместе с cookie `remixstlid`**, который можно получить с помощью запроса на главную страницу VK.

Без `remixstlid` — сервер VK отклонит токен, даже если он валидный.

---

## 🚧 Текущие ограничения

Пока что обходит только капчу с подтверждением через клик на чекбокс.  
В будущем будет добавлена поддержка слайдера с картинкой.

---

## 💬 Issues & Pull Requests

Нашёл баг? Хочешь улучшить модуль?  
→ [**Создать Issue**](https://github.com/tripoloski-it/vk-captcha-bypass/issues) — для ошибок и предложений.  
→ [**Отправить Pull Request**](https://github.com/tripoloski-it/vk-captcha-bypass/pulls) — для доработок и фич.

Ваш вклад ускорит поддержку новых типов капчи и улучшит стабильность.