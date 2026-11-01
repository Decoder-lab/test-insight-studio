# Decoder MVP — бриф для ИИ-агента: Dev B (backend / анализ)

**Версия:** 1.3 · 31.10.2026 · источник: `Decoder_MVP_Spec.md` (полная спецификация)
**Исполнитель:** ИИ-агент · **Технический ревьюер:** назначить (предложено Mark — mt@decoder.digital)
**PO:** Katya (ka@decoder.digital) · **Методология:** Ivan (ib@decoder.digital) · **Дизайн:** Anna (at@decoder.digital) · **Комплаенс:** Javier Juárez

Этот документ — только твоя часть. Где нужна общая картина, смотри полную спецификацию. Часы в задачах — ориентир объёма, не дедлайн.

**Прежде чем начать:** прочитай раздел «Правила работы» и «Где ты останавливаешься». Задачи с гейтом нельзя считать выполненными без подтверждения человека.

## 1. Твоя зона

- **Воркер анализа** в отдельном репозитории `Decoder-lab/decoder-worker` (Python 3.11, Docker): prep, quality gate, лицо, аудио, метрики rrweb, агрегация, LLM-выводы.
- **Render:** деплой воркера, переменные, выбор режима (Workflows или Background Worker).
- **NeuroScore v0.1:** расчёт 6 этапов из реальных данных (вместе с Ivan) и пересчёт по новым версиям методики.
- **Скрипты:** удаление сессии и хранение сырых данных 90 дней.
- **Переносимость:** воркер работает с Postgres и S3 через свои адаптеры, чтобы после MVP перейти на AWS без переписывания.

**Не твоя зона:** Supabase (проект, схема, RLS, Storage, Edge Functions), фронтенд, пицца-приложение, страница результатов — это Dev F. С Supabase ты работаешь как клиент — напрямую к Postgres (`DATABASE_URL`) и через S3 API к Storage: читаешь `jobs`, `tests` и файлы, пишешь `derived/`, `results` и статусы.

**Объём:** ≈ 73 ч по задачам ниже (часть задач E вместе с Ivan).

## Правила работы

1. Работа только в ветках, каждый результат — PR. **Слияние в `main` и любой деплой в прод — только человек.**
2. Агент не получает ключи прода (`service_role`, ключи S3 прода, ключ Render). Для работы — отдельный dev-проект Supabase (Q2 решается в пользу отдельного проекта) и локальный Docker.
3. **Агенты не видят реальные записи респондентов.** Только эталонные записи команды из `fixtures/` и открытые датасеты. Видео лица — биометрия; передача его в среду агента — отдельная обработка данных, которую нужно было бы описывать в согласии и DPIA.
4. Агент не меняет контракты раздела 7 и схему БД без гейта: предлагает изменение в PR с пометкой `needs-approval`.
5. Агент не запускает на проде ничего, что удаляет или перезаписывает данные: миграции, скрипты удаления и хранения, пересчёт NeuroScore по всем сессиям.
6. Тексты для респондентов (согласие, политика, уведомление по AI Act) агент готовит только как черновик; финальный текст — от Katya и Javier.
7. Задача с гейтом закрывается только после отметки человека в PR («Approved by …»). Агент не отмечает её выполненной сам.
8. Каждый PR: описание, что сделано, ссылки на задачи, результат тестов, скриншоты или запись для UI.

## Где ты останавливаешься и ждёшь человека

Дойдя до задачи из таблицы, открой PR с пометкой `needs-approval`, опиши, что проверить, и продолжай другие задачи, которые от этого гейта не зависят.

| Гейт | Задачи | Что проверить | Кто | ч на ревью | Веха |
|---|---|---|---|---|---|
| G7. Quality gate | D-3 | Пороги света, доли лица, тишины, минимальной длительности | Ivan | 1 | M2 |
| G8. Выход моделей на эталонах | D-4, D-5 | Эмоции и расшифровка на эталонных записях выглядят правдоподобно; маппинг меток (contempt → ?) | Ivan | 1.5 | M2 |
| G9. Агрегация, флаги, оценки по экранам | E-1…E-5 | Таблица valence, trust, правила моментов и флагов на эталонах | Ivan | 2 | M2 |
| G10. NeuroScore v0.1 | E-7 (Q5) | Формулы, окна, веса, порог уверенности; результат на эталонах осмыслен | Ivan (+ Katya 0.5) | 2.5 | M2 |
| G11. LLM-выводы | E-6 | Что уходит в LLM (только агрегаты), промпт, нет выдуманных фактов на 2 эталонах; выбор провайдера (Q7) | Katya | 1 | M2 |
| G12. Режим Render и расходы | D-8 | Workflows или Background Worker; бюджет | Katya + Mark | 0.5 | M2 |
| G14. Удаление и хранение данных | C-04/05 | Скрипт удаляет ровно одну сессию; хранение не трогает `results`; прогон на dev перед продом | Mark + Katya | 1 | M4 |
| G15. Выпуск в прод | конец каждой вехи | Миграции на проде, слияние в `main`, деплой Render; откат понятен | Mark | 0.5 × 5 = 2.5 | M0–M4 |
| G16. Инвентаризация для AWS | H-5 | Полнота списка зависимостей, целевая архитектура, оценка | Mark + Katya | 2 | M4 |

## Что делает только человек

Если для задачи нужно что-то из этого списка, не пытайся обойти — попроси технического ревьюера в PR или в чате.

| Что | Кто | ч | Когда |
|---|---|---|---|
| Создать dev- и прод-проекты Supabase (EU), оплата Pro перед пилотом | Mark + Katya (оплата) | 1 | M0 / M4 |
| Аккаунт Render, подключение GitHub, регион, тариф | Mark | 0.5 | M0 |
| Секреты: GitHub Actions, переменные Render, ключ LLM | Mark | 0.5 | M0 / M2 |
| Пригласить команду в Supabase Auth, настроить SMTP домена | Mark | 0.5 | M0 |
| Выдать агентам доступ: репозитории, dev-проект Supabase (без ключей прода) | Mark | 0.5 | M0 |
| Записать 2 эталонные сессии для `fixtures/` | Katya + Anna | 0.5 | M0 |
| **Итого** | | **3.5** | |

## 2. Архитектура

```
Респондент (браузер)                                  Supabase (EU, Frankfurt)
pmf.decoder.digital/test#invite=TOKEN                 ┌───────────────────────────┐
 ├ согласие, проверка камеры/света/микрофона          │ Edge Functions            │
 ├ пре-опрос                                           │  start-session            │
 ├ запись: камера (webm) + аудио (webm/opus)          │  finish-session           │
 │   └ iframe /lab/pizza/ ── rrweb + step-события ──┐ │ Postgres                  │
 │        (postMessage родителю)                    │ │  sessions, files, jobs,   │
 ├ загрузка по подписанным URL ─────────────────────┼►│  results, invites, team   │
 └ пост-опрос                                        │ │ Storage (private bucket)  │
                                                     │ │  sessions/{id}/...        │
                                                     │ └─────────────┬─────────────┘
Команда (Supabase Auth)                              │               │ job queued
pmf.decoder.digital/results/:id  ◄── results ────────┘               ▼
 ├ оценка по экранам, шкала, флаги                    Render (Frankfurt, Docker)
 ├ rrweb-player + видео лица, синхронно              worker: ffmpeg → quality gate →
 └ рекомендации                                       DeepFace + HSEmotion → faster-whisper →
                                                      sentiment → метрики rrweb → агрегатор →
                                                      LLM (только агрегаты) → results
```

**Ключевые решения**

| # | Решение | Почему |
|---|---|---|
| D1 | rrweb записывается **внутри** пицца-приложения и пересылается родителю через `postMessage` | Работает независимо от настроек iframe. Не нужен `getDisplayMedia` — на одно разрешение меньше |
| D2 | Общее время: `t0 = Date.now()` в момент `onstart` записи камеры; у каждого потока своё `started_at_ms` | rrweb пишет события в эпохальных миллисекундах, поэтому всё сводится к одной шкале без доп. маркеров |
| D3 | Респондент не логинится. Загрузка — по **подписанным URL**, которые выдаёт Edge Function после проверки токена приглашения | Нет анонимной записи в Storage и БД |
| D4 | Воркер один, логика в функции `process_session(session_id)`; два режима запуска: `poll` и `workflow` | Можно начать с Background Worker и перейти на Render Workflows без переписывания |
| D5 | В LLM уходят только агрегаты: шкала, расшифровка, метрики. Никаких кадров и видео | GDPR и биометрия; закрывает вопрос зависимости от внешних API для лица |
| D6 | Видео для плеера перекодируется воркером в `face.mp4` (H.264) | webm из MediaRecorder часто без длительности и индекса, перемотка в плеере работает плохо |

## 3. Задачи

| Веха | ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|---|
| M0 | A-7a | Репозиторий воркера, Dockerfile, сервис на Render (Frankfurt), переменные | Dev B | 4 | A-1 | Пустой воркер деплоится и пишет в лог |
| M0 | A-8 | Локальная среда + 2 эталонные записи | Dev F, Dev B | 2 | — | Записи лежат в Storage `fixtures/` |
| M2 | D-1 | Каркас воркера, опрос `jobs`, статусы | Dev B | 4 | A-7a | Задача проходит `queued → running → done` |
| M2 | D-2 | Prep: ffmpeg, кадры, wav, face.mp4 | Dev B | 4 | D-1 | Файлы созданы, `face.mp4` перематывается в браузере |
| M2 | D-3 | Quality gate | Dev B + Ivan | 3 | D-2 | Тёмная запись отклоняется с причиной |
| M2 | D-4 | Лицо: DeepFace + HSEmotion | Dev B | 6 | D-2 | ≥ 70% кадров с эмоцией на эталонной записи |
| M2 | D-5 | Аудио: faster-whisper + тональность + просодия | Dev B | 5 | D-2 | Расшифровка совпадает с речью на слух |
| M2 | D-6 | Метрики rrweb + шаги | Dev B | 5 | D-1 | Rage/dead clicks находятся на заложенной проблеме CH3 |
| M2 | E-1..E-5 | Агрегация: шкала, trust, моменты, флаги, оценки, проблемы | Dev B + Ivan | 10 | D-3..D-6 | `results.json` соответствует схеме 7.3 |
| M2 | E-6 | LLM-выводы по агрегатам | Dev B | 4 | E-1..E-5 | Рекомендации ссылаются на реальные секунды |
| M2 | E-7 | NeuroScore v0.1: 6 этапов, уверенность, `inputs`, связь с проблемами | Dev B + Ivan | 8 | E-1..E-5 | Блок `neuroscore` по схеме 7.3; Ivan проверил на эталонных записях |
| M2 | H-2 | Воркер: Postgres по `DATABASE_URL`, файлы через S3 API, `queue.py` | Dev B | 4 | D-1 | Воркер не импортирует клиент Supabase |
| M2 | D-7 | Таймауты, повторы, логи | Dev B | 2 | D-1 | Падение этапа не вешает очередь |
| M2 | D-8 | Выбор и настройка режима Render (Workflows или Background Worker) | Dev B | 3 | D-1..E-6 | Сессия обрабатывается на Render ≤ 15 мин |
| M3 | E-8 | Скрипт пересчёта NeuroScore по новой версии (Should) | Dev B | 2 | E-7 | Пересчёт без повторной обработки видео |
| M4 | C-04/05 | Скрипт удаления сессии + процедура хранения 90 дней | Dev B | 3 | A-4 | Сессия удаляется одной командой |
| M4 | H-5 | Инвентаризация зависимостей от Supabase + целевая AWS-архитектура | Dev F + Dev B | 4 | M1–M3 | Документ по разделу 12 с оценкой часов |

## 4. Интерфейсы с Dev F

| Что получаешь от Dev F | Задача | Срок | Пока нет — чем заменить |
|---|---|---|---|
| `DATABASE_URL` и S3-ключи Storage | A-1, A-4 | конец недели 1 | локальный Postgres + MinIO в `docker-compose` или файлы с диска |
| Настройки теста (`min_duration_s`, `neuroscore_version`) | A-9 | M1 | значения по умолчанию из схемы |
| Схема БД (`001_init.sql`) | A-2 | конец недели 1 | схема из раздела 5 ниже |
| Пути и права в Storage | A-4 | конец недели 1 | папка `fixtures/` локально |
| Задания в `jobs` после каждой загрузки | A-5 | середина M1 | вставить строку в `jobs` вручную |

| Что отдаёшь Dev F | Задача | Срок | Формат |
|---|---|---|---|
| Пример `results.data` (фикстура) с блоком `neuroscore` | E-6b, E-7 | **начало M2** | JSON по разделу 7.3, `schema_version: "1.0"` |
| Настоящие `results` | E-6b | конец M2 | строка в `results` |
| Значения `jobs.stage` / `jobs.error` | D-1 | M2 | `prep / quality / face / audio / metrics / aggregate / llm` + текст причины |
| Если режим Render Workflows: как запускать задачу | D-8 | конец M2 | URL и ключ — в секреты Edge Function `finish-session` (настраивает Dev F) |
| `face.mp4` в `derived/` | D-2 | M2 | H.264, перематывается в браузере |

Схему БД меняет только Dev F через миграции. Если тебе нужно новое поле — PR с миграцией или запрос Dev F.

## 5. Подробное ТЗ

### Supabase — для справки (владелец Dev F)

**A-2. Supabase: база** (Dev F) — миграция `001_init.sql`:

```sql
create type session_status as enum
  ('created','recording','uploaded','processing','done','rejected','failed');

create table team_members (
  user_id uuid primary key references auth.users,
  email text unique not null,
  role text not null check (role in ('po','dev','design','method'))
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  name text not null,
  app_path text not null default '/lab/pizza/',
  min_duration_s int not null default 30,       -- короче — сессия не анализируется
  max_duration_s int not null default 120,      -- жёсткая остановка
  tail_after_complete_s int not null default 8, -- запись после add_to_cart
  warn_before_end_s int not null default 15,    -- когда показать «скоро конец»; 0 — не показывать
  challenges_version text not null default 'v1',
  neuroscore_version text not null default '0.1',
  check (min_duration_s > 0 and min_duration_s < max_duration_s),
  created_at timestamptz default now()
);

create table invites (
  token text primary key,               -- 32+ случайных символа
  test_id uuid references tests on delete cascade,
  respondent_label text not null,       -- псевдоним, напр. "P07"
  expires_at timestamptz not null,
  used_at timestamptz
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests,
  invite_token text references invites,
  respondent_label text not null,
  status session_status not null default 'created',
  consent_version text,
  consent_at timestamptz,
  client jsonb,                         -- ua, platform, mime-типы, разрешение
  pre_survey jsonb,
  post_survey jsonb,
  t0_ms bigint,                         -- начало записи камеры, epoch ms
  ended_at timestamptz,
  end_reason text check (end_reason in ('completed','timeout','user_stopped','too_short')),
  end_step text,
  is_public_demo boolean default false,
  created_at timestamptz default now()
);

create table session_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  kind text not null check (kind in ('face','audio','rrweb','steps','manifest','face_mp4')),
  path text not null,
  mime text,
  bytes bigint,
  started_at_ms bigint,
  created_at timestamptz default now()
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions on delete cascade,
  status text not null default 'queued'
    check (status in ('queued','running','done','failed','rejected')),
  stage text,                           -- prep / quality / face / audio / metrics / aggregate / llm
  attempts int not null default 0,
  error text,
  worker text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create table results (
  session_id uuid primary key references sessions on delete cascade,
  schema_version text not null,
  config_hash text not null,
  neuroscore_version text not null,
  data jsonb not null,
  created_at timestamptz default now()
);
```

**A-4. Supabase: Storage** (Dev F)
- Bucket `sessions`, **private**, лимит файла 50 МБ.
- Пути: `sessions/{session_id}/raw/face.webm`, `raw/audio.webm`, `raw/rrweb.json`, `raw/steps.json`, `manifest.json`, `derived/face.mp4`.
- Политика чтения для команды; запись только через подписанные URL.
- Включить S3-доступ к Storage и выпустить отдельные ключи для воркера (H-2). *Работу S3-эндпоинта Supabase с boto3 проверить здесь же.*

### Render и окружение

**A-7. Render** (Dev B)
- Отдельный репозиторий `Decoder-lab/decoder-worker` (Python), подключить к Render через GitHub, auto-deploy с `main`.
- Тип сервиса на этапе разработки — **Background Worker, Docker, регион Frankfurt, 2 CPU / 4 GB** (≈ $85/мес) **или** Render Workflows (`2c-4g`, $0.40/ч по факту). Выбор — в задаче B-W8 после проверки, доступен ли Workflows в аккаунте.
- Переменные окружения: `DATABASE_URL` (Postgres Supabase, затем RDS), `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` (S3-доступ Supabase Storage, затем AWS S3 — см. H-2), `LLM_API_KEY`, `LLM_MODEL`, `RUN_MODE=poll|workflow`, `POLL_INTERVAL_S=15`, `FRAME_FPS=5`, `WHISPER_MODEL=small`, `LOG_LEVEL=INFO`.
- Dockerfile: ffmpeg + Python 3.11; веса DeepFace, HSEmotion, faster-whisper и модели тональности скачиваются **при сборке образа**.
- Для режима `workflow`: ключ Render API хранится как секрет Edge Function `finish-session`. *Точный формат вызова запуска Workflows через API нужно проверить в документации Render — я его не проверял.*

**A-8. Локальная среда** (Dev F, Dev B)
- Фронтенд: `npm run dev` на `localhost:8080` против того же Supabase-проекта (или отдельного dev-проекта — решить в A-1).
- Воркер: `docker compose up` с теми же переменными, `RUN_MODE=poll`.
- Тестовые данные: 2 эталонные записи по 2 минуты, снятые командой, с согласием.

### Воркер

**D-1. Каркас.** Репозиторий `decoder-worker`:
```
worker/
  main.py            # RUN_MODE=poll|workflow
  pipeline.py        # process_session(session_id)
  stages/prep.py quality.py face.py audio.py metrics.py aggregate.py llm.py
  io/supabase_io.py  # скачать/загрузить файлы, обновить jobs/results
  config.py          # параметры + config_hash
  tests/             # прогон на эталонной записи
Dockerfile
docker-compose.yml
```
Режим `poll`: раз в `POLL_INTERVAL_S` взять одну задачу `queued` (`update … set status='running' … where id = (select … for update skip locked limit 1) returning *`), выполнить, записать статус.

**D-2. Prep.**
- Скачать сырые файлы в `/tmp/{session_id}`.
- `ffmpeg`: `face.webm` → `face.mp4` (H.264, для плеера) → загрузить в `derived/`.
- Кадры 5 fps в jpg 320×240; аудио → `wav 16 kHz mono`.
- Удалить `/tmp/{session_id}` в `finally`.

**D-3. Quality gate.** Пороги (утверждает Ivan):
- длительность ≥ `tests.min_duration_s` (по умолчанию 30 с); `end_reason = 'too_short'` — сразу `rejected` без обработки;
- доля кадров с найденным лицом ≥ 70%;
- средняя яркость кадров ≥ порога;
- аудио: RMS выше порога тишины хотя бы 20% времени.
Не прошла — `sessions.status = 'rejected'`, причина в `jobs.error`, дальше не обрабатывать.

**D-4. Лицо.** Две библиотеки по каждому кадру:
- **DeepFace** (`analyze`, действие `emotion`, быстрый детектор);
- **HSEmotion** (`hsemotion-onnx`).
Выход каждой: `{t_ms, emotion, confidence, scores{7 эмоций}, lib, lib_version}`; без лица — `emotion: null`. Метки привести к 7 базовым: happy, surprise, fear, disgust, angry, sad, neutral (в HSEmotion есть contempt — смапить в disgust или отбросить; решение Ivan).

**D-5. Аудио.**
- **faster-whisper** (`small`, CPU, `word_timestamps=True`, язык авто или из настроек теста) → сегменты и слова.
- Тональность сегментов: `cardiffnlp/twitter-xlm-roberta-base-sentiment` (EN/ES) → `positive / neutral / negative` + score.
- Просодия (librosa): F0, RMS, доля пауз по окнам 1 с.

**D-6. Метрики rrweb + шаги.**
- Время на каждом экране, число кликов.
- Rage clicks: ≥ 3 клика за 1 с в радиусе 30 px.
- Dead clicks: клик, после которого 1 с нет изменений DOM и смены шага.
- Колебание: курсор неподвижен ≥ 3 с на экране без завершения шага.
- Возвраты назад: шаг с меньшим номером после большего.
- Попапы (из `popup_open` / `popup_close`): сколько раз открыт каждый, сколько секунд был открыт, как закрыт; «закрыт без действия» — `outside_click` или `esc` без клика внутри попапа.
- Глубина скролла: максимальный `depth_pct` на каждом экране и в каждом прокручиваемом блоке; скролл до 100 % без клика — сигнал «искал и не нашёл».

**D-7. Логирование и устойчивость.** Таймаут этапа, до 2 повторов задачи, затем `failed`. Логи с `session_id` и `stage`.

**D-8. Выбор режима Render.** Проверить доступность Workflows в аккаунте; при наличии — завести задачи `face`, `audio`, `metrics` параллельно и `aggregate` после них; иначе Background Worker `2c-4g`.

### Агрегация и «AI Brain» (вместе с Ivan)

**E-1. Шкала по секундам.** Для каждой секунды от `t0`:
- эмоция каждой библиотеки = самая частая метка за секунду; `confidence` = среднее;
- итоговая эмоция = совпадение двух библиотек или метка с большим confidence;
- `trust` = `high` (совпали, обе ≥ 0.6) / `medium` (совпали) / `low` (не совпали или лицо есть только в одной);
- `valence` по стартовой таблице (утверждает Ivan): happy +1.0, surprise +0.3, neutral 0, sad −0.7, fear −0.8, angry −1.0, disgust −1.0;
- фраза, тональность и просодия этой секунды; текущий экран; клики.

**E-2. Пики и ключевые моменты.** Негативный отрезок: `valence ≤ −0.5` и `trust ≠ low` ≥ 3 секунд подряд; позитивный пик — аналогично `≥ +0.5`. Не больше 6 моментов на сессию, сортировка по силе.

**E-3. Флаги расхождения.** Сегмент речи с тональностью `positive` или словами-маркерами (`ок`, `понятно`, `fine`, `ok`, `bien`, `vale`), а на лице в те же секунды ±1 с — негатив с `trust ≠ low` ≥ 2 секунд.

**E-4. Оценка по экранам.** Стартовая формула (утверждает Ivan): `score = 50 + 50 × среднее(valence × вес_trust)`, `вес_trust`: high 1.0, medium 0.6, low 0.2; штраф −5 за каждый rage click, −3 за dead click, не ниже 0. `overall` — среднее по экранам, взвешенное по времени. Маппинг на 6 этапов NeuroScore — открытый вопрос (раздел 11).

**E-5. Совпадение с заложенными проблемами.** Для каждой проблемы из `challenges.json`: было ли в окне этого экрана взаимодействие с `data-challenge`-элементом и есть ли в ±3 с негативный момент или аномалия метрик → `detected: true/false` + доказательства.

**E-6. LLM-выводы.** На вход — только `timeline` (без кадров), расшифровка, метрики, ключевые моменты, флаги, проблемы. Промпт просит: 3–5 находок со ссылкой на секунды, рекомендацию к каждой, уровень уверенности; запрещает выдумывать то, чего нет в данных. Ответ валидируется по JSON-схеме; при ошибке — результат без рекомендаций, а не падение.

**E-6b. Запись результата.** `results.data` по схеме раздела 7.3; `sessions.status = 'done'`.

**E-7. NeuroScore v0.1** (Dev B + Ivan). Сейчас на странице результатов 6 этапов NeuroScore — выдуманные числа. Их считает воркер из реальных сигналов. Формулы ниже — **черновик v0.1**: коэффициенты лежат в `config/neuroscore_v0_1.yaml`, Ivan утверждает или меняет их, каждая смена — новая версия.

Обозначения: `v` — valence секунды, `w` — вес trust (high 1.0 / medium 0.6 / low 0.2), `vw` — `v × w`; все этапы ограничены 0–100.

| Этап | Окно данных | Формула v0.1 | Сигналы |
|---|---|---|---|
| **Attention** — захватил ли экран внимание | Первые 5 с каждого экрана | `100 × (0.5 × доля секунд с лицом в кадре + 0.5 × доля секунд с вовлечённостью)`; вовлечённость = surprise / happy с trust ≠ low или речь; −10 за каждое колебание ≥ 3 с в этом окне | лицо, эмоции, речь, курсор |
| **Safety** — нет ли тревоги и недоверия | Экраны `choose` и `cart` | `100 × (1 − доля секунд с fear / angry / disgust и trust ≠ low)` − 10 × попапы, закрытые без действия | эмоции, попапы |
| **Value** — видит ли ценность | Экран `choose` | `50 + 50 × среднее(vw)`; +10, если был `add_to_cart`; +10 / −10 при средней тональности речи positive / negative | эмоции, речь, действие |
| **Simplicity** — легко ли пройти | Вся сессия | `100` − 15 × rage clicks − 8 × dead clicks − 10 × возвраты − 10 × попапы без действия − 10 × скролл до 100 % без клика − 30, если `timeout` | метрики rrweb, шаги |
| **Peak** — был ли сильный позитивный момент | Вся сессия | `50 + 50 × max(среднее vw в окне 3 с)` | эмоции |
| **Memory** — с чем ушёл | Последние 10 с | `50 + 50 × среднее(vw)`; +10 / 0 / −10 по ответу пост-опроса `disappointed` (very / somewhat / not) | эмоции, пост-опрос |

- **NeuroScore** = среднее 6 этапов (веса в конфиге, в v0.1 равные).
- **Уверенность этапа** = доля секунд окна с trust high или medium. Меньше 0.5 — этап помечается «низкая уверенность» и не входит в общий балл.
- Для каждого этапа в результат пишутся входные значения (`inputs`) — чтобы на странице было видно, из чего число получилось.
- Связь с заложенными проблемами: в отчёте у этапа указываются проблемы из `challenges.json`, попавшие в его окно (например, CH2 — Value и Safety).

**E-8. Пересчёт по новой версии** (Dev B, Should). `scripts/recompute_neuroscore.py --version 0.2 [--session ID | --all]` — берёт сохранённую шкалу и метрики из `results.data`, пересчитывает блок `neuroscore`, без повторной обработки видео.

### Переносимость (подготовка к AWS)

**H-2. Адаптеры в воркере** (Dev B).
- База: прямое подключение к Postgres по `DATABASE_URL` (psycopg), а не REST-клиент Supabase. На AWS меняется только строка подключения к RDS.
- Файлы: S3 API (boto3) к S3-совместимому эндпоинту Supabase Storage (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`). На AWS — тот же код с эндпоинтом S3. *S3-доступ Supabase для сервера нужно включить и проверить в A-4.*
- Очередь: доступ к `jobs` спрятан за `queue.py` (`take_next`, `mark_done`, `mark_failed`) — чтобы позже заменить на SQS без изменений в пайплайне.

**H-4. Без специфики Supabase в схеме.** Миграции — обычный SQL. Права доступа в RLS опираются на `auth.uid()` — это единственное место, завязанное на Supabase; на AWS проверка прав переезжает в API (см. раздел 12). Не использовать Supabase-only расширения без записи в инвентаризацию (H-5).

**H-5. Инвентаризация и целевая архитектура** (Dev F + Dev B, в M4). Документ: что в проекте зависит от Supabase, на что меняется в AWS, оценка часов и стоимости. Основа — таблица раздела 12.

Целевая схема переноса — раздел 12 полной спецификации.

### Комплаенс-скрипты

- **Удаление сессии (C-05):** `scripts/delete_session.py <session_id>` — удалить объекты Storage `sessions/{id}/**` через Storage API, затем строку `sessions` (каскад удалит `session_files`, `jobs`, `results`). Вывести, что удалено.
- **Хранение 90 дней (C-04):** ежедневная задача воркера: найти сессии старше `RAW_RETENTION_DAYS=90`, удалить `raw/` и `derived/face.mp4`, оставить `results`. Срок утверждают Katya и Javier.

## 6. Контракты данных

### 7.1 `manifest.json`
```json
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "test_id": "uuid",
  "respondent_label": "P07",
  "t0_ms": 1761900000000,
  "end_reason": "completed",
  "end_step": "cart",
  "duration_ms": 104230,
  "consent_version": "consent_v1",
  "client": { "ua": "...", "platform": "MacIntel", "viewport": [1440, 900] },
  "streams": [
    { "kind": "face",  "path": "raw/face.webm",  "mime": "video/webm;codecs=vp9", "started_at_ms": 1761900000000, "width": 640, "height": 480 },
    { "kind": "audio", "path": "raw/audio.webm", "mime": "audio/webm;codecs=opus", "started_at_ms": 1761900000012 },
    { "kind": "rrweb", "path": "raw/rrweb.json" },
    { "kind": "steps", "path": "raw/steps.json" }
  ],
  "app": { "path": "/lab/pizza/", "challenges_version": "v1" }
}
```

### 7.2 Сообщения iframe → родитель
```json
{ "type": "decoder:rrweb",  "events": [ /* rrweb events, timestamp в epoch ms */ ] }
{ "type": "decoder:step",   "step": "search" | "choose" | "cart", "t": 1761900012345 }
{ "type": "decoder:action", "action": "add_to_cart", "item": "margherita", "t": 1761900090000 }
{ "type": "decoder:action", "action": "popup_open",  "id": "size-info", "step": "choose", "t": 1761900051200 }
{ "type": "decoder:action", "action": "popup_close", "id": "size-info", "step": "choose", "via": "button" | "outside_click" | "esc", "t": 1761900056900 }
{ "type": "decoder:action", "action": "scroll_depth", "step": "search", "container": "page" | "menu-list" | "cart-list", "depth_pct": 25 | 50 | 75 | 100, "t": 1761900020100 }
```
`steps.json` = массив сообщений `decoder:step` и `decoder:action` в порядке поступления.

### 7.3 `results.data`
```json
{
  "schema_version": "1.0",
  "config": { "frame_fps": 5, "libs": ["deepface@x.y", "hsemotion-onnx@x.y"], "whisper": "small", "sentiment": "xlm-roberta-base-sentiment", "config_hash": "..." },
  "quality": { "face_detected_ratio": 0.91, "mean_brightness": 112, "accepted": true },
  "scores": { "search": 72, "choose": 48, "cart": 81, "overall": 64 },
  "timeline": [
    { "t": 12, "step": "search", "emotion": "neutral", "confidence": 0.82, "trust": "high", "valence": 0.0,
      "speech": "так, ищу пеперони", "sentiment": "neutral", "clicks": 1 }
  ],
  "moments": [
    { "id": "M1", "t_start": 41, "t_end": 47, "kind": "negative", "emotion": "angry", "trust": "high",
      "step": "choose", "quote": "а, вот сколько стоит XL", "challenge_id": "CH2" }
  ],
  "flags": [
    { "t": 63, "type": "verbal_nonverbal_gap", "speech": "ну ок", "face": "disgust", "trust": "medium" }
  ],
  "metrics": {
    "steps": { "search": { "duration_s": 28, "clicks": 6 }, "choose": { "duration_s": 51, "clicks": 9 }, "cart": { "duration_s": 25, "clicks": 3 } },
    "rage_clicks": [ { "t": 88, "step": "cart", "x": 512, "y": 140, "count": 4 } ],
    "dead_clicks": [ { "t": 86, "step": "cart", "selector": "#promo-banner" } ],
    "backtracks": 1,
    "popups": [ { "id": "size-info", "step": "choose", "opens": 2, "open_s": 9.4, "closed_without_action": 1 } ],
    "scroll_depth": { "search": { "page": 100, "menu-list": 75 }, "choose": { "page": 50 }, "cart": { "page": 25, "cart-list": 100 } }
  },
  "challenges": [ { "id": "CH2", "detected": true, "evidence": ["M1", "choose: 51s, +23s к медиане"] } ],
  "insights": [
    { "title": "Цена XL вызывает негатив", "evidence_t": [41, 47], "recommendation": "Показывать цену всех размеров сразу", "confidence": "high" }
  ],
  "neuroscore": {
    "version": "0.1",
    "overall": 63,
    "stages": {
      "attention":  { "score": 78, "confidence": 0.86, "window": "first 5s of each step", "inputs": { "face_ratio": 0.93, "engaged_ratio": 0.71, "hesitations": 1 }, "challenges": ["CH1"] },
      "safety":     { "score": 61, "confidence": 0.74, "window": "choose+cart", "inputs": { "negative_ratio": 0.29, "popups_without_action": 1 }, "challenges": ["CH2", "CH3"] },
      "value":      { "score": 55, "confidence": 0.80, "window": "choose", "inputs": { "mean_vw": -0.1, "add_to_cart": true, "speech_sentiment": "neutral" }, "challenges": ["CH2"] },
      "simplicity": { "score": 47, "confidence": 1.0, "window": "session", "inputs": { "rage_clicks": 1, "dead_clicks": 2, "backtracks": 1, "popups_without_action": 1, "scroll100_no_click": 0, "timeout": false }, "challenges": ["CH3"] },
      "peak":       { "score": 82, "confidence": 0.77, "window": "session", "inputs": { "max_vw_3s": 0.64, "t": 97 }, "challenges": [] },
      "memory":     { "score": 58, "confidence": 0.70, "window": "last 10s", "inputs": { "mean_vw": 0.16, "disappointed": "somewhat" }, "challenges": [] }
    },
    "excluded_low_confidence": []
  }
}
```

## 7. Требования, за которые отвечаешь

**Функциональные**

| ID | Требование | Приоритет |
|---|---|---|
| FR-13 | Воркер отклоняет запись при плохом качестве (quality gate) и пишет причину | Must |
| FR-14 | Результат содержит: оценку по 3 экранам и общую, шкалу по секундам, ключевые моменты, флаги расхождения, метрики поведения, совпадения с заложенными проблемами, рекомендации | Must |
| FR-22 | NeuroScore по 6 этапам (Attention, Safety, Value, Simplicity, Peak, Memory) считается воркером из реальных данных сессии; выдуманные значения на странице результатов удаляются | Must |
| FR-24 | Методика NeuroScore версионируется; старые сессии можно пересчитать по новой версии без повторной записи | Should |

**Нефункциональные**

| ID | Требование |
|---|---|
| NFR-02 | Обработка 2-минутной сессии ≤ 15 минут от загрузки до результата |
| NFR-04 | Все данные хранятся в EU: Supabase и Render в регионе Frankfurt |
| NFR-05 | Секреты (`service_role`, ключ LLM, Render API) — только в Edge Functions и в переменных Render, никогда во фронтенде и репозитории |
| NFR-06 | Воспроизводимость: каждый результат хранит версии библиотек, моделей и параметров (`config_hash`) |
| NFR-07 | Воркер идемпотентен: повторный запуск по той же сессии перезаписывает результат, а не дублирует |
| NFR-08 | Логи воркера содержат `session_id` и этап; ошибки пишутся в `jobs.error` |
| NFR-09 | Переносимость: замена Supabase на AWS не требует переписывать UI и воркер — меняются только адаптеры (`api`, `auth`, `storage`, `db`) и конфигурация |

**Комплаенс**

| ID | Требование | Кто проверяет |
|---|---|---|
| C-04 | Срок хранения сырого видео и аудио — 90 дней (предложение), затем удаление; результаты без медиа хранятся дальше | Katya + Javier |
| C-05 | Удаление всех данных сессии по запросу за один шаг (скрипт) | Dev B |

## 8. Как проверить

| Что | Как | Критерий |
|---|---|---|
| Синхронизация | Хлопок в ладоши в кадре + клик в ту же секунду | Расхождение событий на шкале ≤ 0.5 с |
| Quality gate | Запись в темноте | Статус `rejected`, причина «мало света» |
| Воркер | Эталонные записи в `fixtures/`, `pytest` | Схема `results` валидна, время ≤ 15 мин на Render |

Дополнительно:
- `pytest` на эталонных записях из `fixtures/`: схема `results` валидна, `face_detected_ratio ≥ 0.7`, расшифровка не пустая.
- Время обработки 2-минутной сессии на Render записывать в лог; цель — ≤ 15 минут.

## 9. Стоимость на твоей стороне

| Ресурс | Разработка | Пилот |
|---|---|---|
| Render | Воркер локально в Docker, $0 | Workflows `2c-4g` $0.40/ч по факту (≈ $1–10/мес) или Background Worker 2 CPU / 4 GB $85/мес |
| LLM | — | Центы за сессию (оценка) |

## 10. Риски на твоей стороне

| Риск | Вероятность | Что делаем |
|---|---|---|
| Точность библиотек на веб-камере 640×480 при плохом свете | Высокая | Проверка света до старта, quality gate, две библиотеки + trust, честный показ уверенности |
| 4 GB RAM на Render мало для DeepFace + Whisper | Средняя | Модели грузить по очереди, Whisper `small`; при нехватке — `2c-8g` |

## 11. Открытые вопросы, которые тебя блокируют

| # | Вопрос | Кто решает | К какому сроку |
|---|---|---|---|
| Q1 | Кто технический ревьюер PR агентов (предложено: Mark) | Katya | Старт M0 |
| Q3 | Render: Workflows доступен в аккаунте? | Dev B | D-8 |
| Q4 | Таблица valence, пороги trust и quality gate, формула оценки | Ivan | E-1 / D-3 |
| Q5 | Формулы, окна и веса NeuroScore v0.1 (E-7) — утвердить или поправить | Ivan | E-7 |
| Q7 | Какой LLM-провайдер и модель для выводов | Katya + Dev B | E-6 |
| Q8 | Срок хранения сырого видео (90 дней?) и формулировки согласия | Katya + Javier | C-08 |
| Q9 | Язык сессий: только испанский, только английский или оба | Katya | D-5 |
| Q10 | Длительности по умолчанию: минимум 30 с, максимум 120 с — подтвердить после T-2 | Katya + Ivan | T-2 |
| Q11 | AWS: регион (eu-south-2 Испания или eu-central-1 Франкфурт), сроки, есть ли кредиты AWS | Katya | H-5 |

**Не проверено:** формат запуска Render Workflows через API (D-8) — проверить в документации Render до реализации.
