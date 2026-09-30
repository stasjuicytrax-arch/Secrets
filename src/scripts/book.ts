/**
 * Форма брони: маска телефона, клиентская валидация, состояния
 * ошибки/успеха. ТЗ §5.
 *
 * Реальной отправки нет — эндпоинт заказчика не согласован (ТЗ §10,
 * «куда отправлять заявки: почта / Telegram-бот / CRM» — открытый вопрос,
 * см. docs/client-questions.md). submitBooking() ниже — заглушка,
 * TODO: подключить endpoint заказчика вместо неё.
 */

interface BookingPayload {
  readonly name: string;
  readonly phone: string;
  readonly date: string;
  readonly time: string;
  readonly guests: string;
  readonly comment: string;
}

/**
 * TODO: подключить endpoint заказчика. Сейчас — заглушка: имитирует
 * сетевую задержку и всегда завершается успехом, данные никуда не уходят.
 */
const submitBooking = async (payload: BookingPayload): Promise<{ ok: true }> => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  // eslint-disable-next-line no-console
  console.info('[booking stub] форма не отправлена никуда, TODO endpoint:', payload);
  return { ok: true };
};

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').replace(/^7|^8/, '').slice(0, 10);
  let out = '+7';
  if (digits.length) out += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ')';
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
};

const initPhoneMask = (input: HTMLInputElement): void => {
  input.addEventListener('input', () => {
    const pos = input.selectionStart;
    const before = input.value.length;
    input.value = formatPhone(input.value);
    // Курсор скачет в конец при простом переприсваивании value — грубая,
    // но рабочая компенсация: сдвигаем на разницу в длине.
    const after = input.value.length;
    if (pos !== null) input.setSelectionRange(pos + (after - before), pos + (after - before));
  });
};

const PHONE_RE = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const validateField = (field: HTMLElement): boolean => {
  const check = field.querySelector<HTMLInputElement>('.field__check input');
  if (check) {
    const valid = check.checked;
    field.dataset.invalid = valid ? 'false' : 'true';
    return valid;
  }

  const input = field.querySelector<HTMLInputElement | HTMLTextAreaElement>('.field__input');
  if (!input || !input.required) return true;

  let valid = input.value.trim().length > 0;
  if (valid && input instanceof HTMLInputElement && input.type === 'tel') valid = PHONE_RE.test(input.value);
  if (valid && input instanceof HTMLInputElement && input.type === 'number') {
    const n = Number(input.value);
    valid = Number.isFinite(n) && n >= Number(input.min || 1) && n <= Number(input.max || 20);
  }

  field.dataset.invalid = valid ? 'false' : 'true';
  return valid;
};

export const initBook = (): void => {
  const form = document.querySelector<HTMLFormElement>('[data-book-form]');
  if (!form) return;

  const phoneInput = form.querySelector<HTMLInputElement>('[data-phone-mask]');
  if (phoneInput) initPhoneMask(phoneInput);

  const status = form.querySelector<HTMLElement>('[data-book-status]');
  const fields = [...form.querySelectorAll<HTMLElement>('.field')];

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // .every() без short-circuit-на-map: нужно провалидировать КАЖДОЕ поле
    // (проставить data-invalid), не только до первого невалидного.
    const results = fields.map(validateField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      if (status) {
        status.dataset.state = 'error';
        status.textContent = 'Проверьте поля, отмеченные красным.';
      }
      return;
    }

    const data = new FormData(form);
    const payload: BookingPayload = {
      name: String(data.get('name') ?? ''),
      phone: String(data.get('phone') ?? ''),
      date: String(data.get('date') ?? ''),
      time: String(data.get('time') ?? ''),
      guests: String(data.get('guests') ?? ''),
      comment: String(data.get('comment') ?? ''),
    };

    const submitBtn = form.querySelector<HTMLButtonElement>('.book__submit');
    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.dataset.state = '';
      status.textContent = 'Отправляем…';
    }

    submitBooking(payload)
      .then(() => {
        if (status) {
          status.dataset.state = 'success';
          status.textContent = 'Заявка принята. Мы свяжемся с вами для подтверждения брони.';
        }
        form.reset();
        for (const field of fields) field.dataset.invalid = 'false';
      })
      .catch(() => {
        if (status) {
          status.dataset.state = 'error';
          status.textContent = 'Не получилось отправить. Позвоните нам напрямую.';
        }
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
};
