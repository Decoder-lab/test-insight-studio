# Decoder MVP — спецификация доработок, требования и разбивка работ

**Версия:** 1.2 · 31.10.2026 · владелец документа: Katya (ka@decoder.digital)
**Репозиторий фронтенда:** `Decoder-lab/test-insight-studio` → прод `pmf.decoder.digital` (GitHub Pages)
**Основа:** схема Excalidraw (Pizza app → PMF → Infra → Backend → AI Brain → Result), решения от 31.10.2026: iframe вместо скринкаста, сессия 2 минуты, Supabase, воркер на Render.

**Команда**

| Роль в документе | Кто | Зона |
|---|---|---|
| PO | Katya — ka@decoder.digital | Приоритеты, тексты согласия, приёмка |
| Dev F (frontend + Supabase) | ИИ-агент F; ревью — технический ревьюер (раздел 13) | React/Vite, Supabase (проект, Auth, БД, RLS, Storage, Edge Functions), запись, отчёт |
| Dev B (backend / анализ) | ИИ-агент B; ревью — технический ревьюер (раздел 13) | Python-воркер, Render, агрегация, скрипты удаления и хранения |
| Технический ревьюер | назначить — предложено Mark (mt@decoder.digital) | Принимает PR агентов, технические гейты, выпуск в прод (раздел 13) |
| Design | Anna — at@decoder.digital | Пицца-приложение, экраны теста, вид отчёта |
| Methodology | Ivan — ib@decoder.digital | Пороги качества, маппинг эмоций, формула оценки |
| Compliance | Javier Juárez (ментор INCIBE) | GDPR, AI Act, безопасность |

---

## 1. Цель и результат MVP

На схеме две цели:
- **Goal 1 — презентационный артефакт:** одна живая сессия, где видно повтор экрана, видео лица, шкалу эмоций, ключевые моменты и рекомендации.
- **Goal 2 — источники данных для реальной разработки:** каждая сессия сохраняет сырые потоки и события в едином формате, пригодном для дальнейшего анализа и валидации.

**MVP готов, когда:**
1. Респондент по ссылке-приглашению проходит флоу: согласие → проверка камеры → пре-опрос → 2-минутная сессия в пицца-приложении → пост-опрос.
2. Видео лица, аудио, события rrweb и шаги сохраняются в Supabase (EU).
3. Воркер на Render автоматически обрабатывает сессию и пишет `results.json` не позже чем через 15 минут после окончания сессии.
4. Команда открывает `/results/:id` и видит реальные данные: оценку по экранам, шкалу эмоций, повтор экрана вместе с видео лица, клики, флаги расхождения и рекомендации.
5. Пять тестовых сессий прошли без ручного вмешательства, и хотя бы в одной система поймала заложенную UX-проблему из `challenges.json`.

---

## 2. Границы

| Входит в MVP | Не входит |
|---|---|
| Запись камеры + микрофона в браузере (desktop Chrome / Edge / Firefox; Safari desktop — по возможности) | Нативные мобильные приложения |
| Пицца-приложение на 3 экрана внутри iframe на том же домене | Тестирование произвольных сайтов клиентов по URL |
| rrweb вместо скринкаста | `getDisplayMedia` и видео экрана |
| Supabase: Postgres, Storage, Auth (только команда), Edge Functions | Self-serve кабинет клиента, биллинг |
| Python-воркер на Render: 2 библиотеки эмоций по лицу, расшифровка речи, тональность, метрики rrweb | GPU, распознавание эмоций по голосу (SER), eye tracking |
| Агрегация + LLM-текст выводов по агрегированным данным | Отправка видео или кадров лица во внешние API |
| `ResultsPage` на реальных данных + повтор | PDF-экспорт отчёта |
| Мобильный браузер — проверка возможности (spike) | Гарантированная поддержка мобильных |
| Настраиваемая длительность сессии для каждого теста | — |
| NeuroScore по 6 этапам, посчитанный из реальных данных (методика v0.1) | Утверждённая научная методика NeuroScore — после валидации |
| Переносимость: код не завязан на Supabase напрямую (адаптеры) | Сам перенос на AWS — после теста MVP (раздел 12) |

---

## 3. Аудит текущего репозитория

Стек: React 18, Vite, TypeScript, shadcn/Tailwind, react-router, react-query, Recharts, framer-motion, zod. Собирается в Lovable, деплой через GitHub Actions на GitHub Pages (`public/CNAME = pmf.decoder.digital`, SPA-редирект через `404.html`). Бэкенда нет.

| Файл | Что сейчас | Что сделать |
|---|---|---|
| `src/pages/TestPage.tsx` | Шаги: pre-survey → recording → post-survey. `targetURL="https://example.com"`, `maxDuration={120}`. Ответы опросов не сохраняются. После опроса переход на `/results/demo-session` | Добавить шаги «приглашение», «согласие», «проверка устройства». Передавать `sessionId`. Сохранять ответы. После опроса — экран «Спасибо», а не результаты |
| `src/components/RecordingSession.tsx` | Пишет 3 потока: камера 640×480 (webm), вкладка через `getDisplayMedia`, аудио. Загрузка **имитируется** таймером. Таймер с обратным отсчётом на экране | Убрать скринкаст. Добавить rrweb-мост, шаги, условия окончания, реальную загрузку, fallback форматов для Safari, скрыть отсчёт |
| `src/components/PreSurvey.tsx` | 4 поля: problemToSolve, buyMotivation, budgetRange, urgency | Сохранять в `sessions.pre_survey`. Тексты вопросов адаптировать под пиццу (Anna + Katya) |
| `src/components/PostSurvey.tsx` | 5 полей, включая `disappointed` (вопрос Шона Эллиса) | Сохранять в `sessions.post_survey` |
| `src/pages/ResultsPage.tsx` | NeuroScore, 6 этапов, шкала Recharts, ключевые моменты — всё на выдуманных данных | Загружать данные из Supabase, добавить повтор rrweb + видео лица, клики, флаги. Доступ только для команды |
| `src/pages/PrivacyPolicy.tsx` | Есть страница политики | Дополнить разделом про запись лица и голоса и анализ эмоций (Javier) |
| `.github/workflows/deploy.yml` | Сборка и деплой на Pages при push в `main` | Передать переменные `VITE_SUPABASE_*` в шаг сборки |
| `index.html` + `public/404.html` | SPA-редирект через `sessionStorage` | Проверить, что не конфликтует с iframe (см. B-4) |

---

## 4. Целевая архитектура

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

---

## 5. Требования

### 5.1 Функциональные

| ID | Требование | Приоритет |
|---|---|---|
| FR-01 | Сессия открывается только по ссылке с действующим токеном приглашения; повторно использованный или просроченный токен показывает понятную ошибку | Must |
| FR-02 | Перед любым доступом к камере — экран согласия: что записываем, зачем, сколько храним, кто видит, как отозвать согласие. Чекбокс не отмечен по умолчанию. Версия текста и время согласия сохраняются | Must |
| FR-03 | Проверка устройства до старта: превью камеры, индикатор уровня микрофона, проверка освещённости. При плохом свете — подсказка и повторная проверка | Must |
| FR-04 | Лицо в кадре проверяется до старта (MediaPipe Face Detector в браузере) | Should |
| FR-05 | Ответы пре- и пост-опроса сохраняются в сессию | Must |
| FR-06 | Во время записи пицца-приложение отображается в iframe, превью камеры — в углу | Must |
| FR-07 | Запись заканчивается при первом из событий: товар в корзине + 8 секунд; 120 секунд; кнопка «Стоп». Сохраняются `end_reason` и `end_step` | Must |
| FR-08 | Обратный отсчёт не показывается; в последние 15 секунд — ненавязчивое предупреждение (финальное решение — Ivan) | Must |
| FR-09 | Пицца-приложение сообщает родителю о каждом переходе экрана (`search`, `choose`, `cart`) и о ключевых действиях (`add_to_cart`) | Must |
| FR-10 | rrweb-события пересылаются родителю пачками и загружаются вместе с медиа | Must |
| FR-11 | Загрузка показывает реальный прогресс; при сбое — до 3 повторов, затем экран «Не удалось отправить, не закрывайте вкладку» с кнопкой «Повторить» | Must |
| FR-12 | После загрузки создаётся задание на обработку; статус сессии виден команде | Must |
| FR-13 | Воркер отклоняет запись при плохом качестве (quality gate) и пишет причину | Must |
| FR-14 | Результат содержит: оценку по 3 экранам и общую, шкалу по секундам, ключевые моменты, флаги расхождения, метрики поведения, совпадения с заложенными проблемами, рекомендации | Must |
| FR-15 | `/results/:id` доступна только участникам команды после входа | Must |
| FR-16 | На странице результатов повтор экрана (rrweb-player) идёт синхронно с видео лица; клик по моменту на шкале перематывает оба | Must |
| FR-17 | Клики по каждому экрану отображаются точками поверх снимка экрана | Should |
| FR-18 | Одну сессию можно пометить как публичную демо-сессию для презентаций (Goal 1), без видео лица | Should |
| FR-19 | Команда создаёт приглашения (минимум — SQL или скрипт; удобнее — простая форма в админке) | Must (скрипт) / Could (форма) |
| FR-20 | Длительность сессии настраивается для каждого теста без деплоя: минимум, максимум, «хвост» после завершения задачи, момент предупреждения | Must |
| FR-21 | Остановка раньше минимума — только после подтверждения; такая сессия помечается `too_short` и не анализируется. Отказаться от участия можно в любой момент | Must |
| FR-22 | NeuroScore по 6 этапам (Attention, Safety, Value, Simplicity, Peak, Memory) считается воркером из реальных данных сессии; выдуманные значения на странице результатов удаляются | Must |
| FR-23 | Для каждого этапа NeuroScore видно, из каких сигналов он посчитан, и уверенность; указана версия методики | Must |
| FR-24 | Методика NeuroScore версионируется; старые сессии можно пересчитать по новой версии без повторной записи | Should |

### 5.2 Нефункциональные

| ID | Требование |
|---|---|
| NFR-01 | Браузеры: Chrome, Edge, Firefox последних 2 версий на desktop — обязательно; Safari desktop — должен работать при fallback на `video/mp4`; мобильные — только spike |
| NFR-02 | Обработка 2-минутной сессии ≤ 15 минут от загрузки до результата |
| NFR-03 | Размер загрузки на сессию ≤ 50 МБ (ориентир: видео 640×480 ≈ 10–20 МБ, аудио ≈ 1–2 МБ, rrweb ≈ 1–3 МБ) |
| NFR-04 | Все данные хранятся в EU: Supabase и Render в регионе Frankfurt |
| NFR-05 | Секреты (`service_role`, ключ LLM, Render API) — только в Edge Functions и в переменных Render, никогда во фронтенде и репозитории |
| NFR-06 | Воспроизводимость: каждый результат хранит версии библиотек, моделей и параметров (`config_hash`) |
| NFR-07 | Воркер идемпотентен: повторный запуск по той же сессии перезаписывает результат, а не дублирует |
| NFR-08 | Логи воркера содержат `session_id` и этап; ошибки пишутся в `jobs.error` |
| NFR-09 | Переносимость: замена Supabase на AWS не требует переписывать UI и воркер — меняются только адаптеры (`api`, `auth`, `storage`, `db`) и конфигурация |

### 5.3 Комплаенс

| ID | Требование | Кто проверяет |
|---|---|---|
| C-01 | Явное согласие на запись лица и голоса и на анализ эмоций; запись не начинается без него | Javier |
| C-02 | Уведомление о системе распознавания эмоций (EU AI Act, ст. 50 — обязательство о прозрачности применяется с 02.08.2026) | Javier |
| C-03 | Псевдонимизация: в БД нет имени и email респондента, только `respondent_label` | Dev F |
| C-04 | Срок хранения сырого видео и аудио — 90 дней (предложение), затем удаление; результаты без медиа хранятся дальше | Katya + Javier |
| C-05 | Удаление всех данных сессии по запросу за один шаг (скрипт) | Dev B |
| C-06 | Bucket приватный; доступ к медиа — только через подписанные URL с коротким сроком | Dev F |
| C-07 | rrweb маскирует все поля ввода (`maskAllInputs: true`) | Dev F |
| C-08 | DPIA до первой сессии с внешними респондентами | Katya + Javier |

---

## 6. Доработки по блокам

### A. Настройка и подключения

**A-1. Supabase: проект** (Dev F)
- Создать проект в организации Decoder, регион **Frankfurt (eu-central-1)**.
- Включить Email-вход; **выключить публичную регистрацию** (Auth → Providers → Email → disable sign-ups).
- Пригласить 4 участников: ka@, mt@, ib@, at@decoder.digital (Auth → Users → Invite).
- Настроить свой SMTP (например, через почтовый сервис домена decoder.digital). У встроенной почты Supabase низкий лимит писем — для приглашений команды может не хватить. *Точный лимит я не проверял.*
- Site URL и Redirect URLs: `https://pmf.decoder.digital`, `http://localhost:8080`.

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

**A-3. Supabase: RLS** (Dev F)
- Включить RLS на всех таблицах.
- Политика для команды: `select/insert/update/delete` разрешены, если `auth.uid()` есть в `team_members`.
- Политика для демо: `select` на `results` для `anon`, если у сессии `is_public_demo = true`.
- У `anon` нет прав на остальные таблицы. Все действия респондента идут через Edge Functions с `service_role`.

**A-4. Supabase: Storage** (Dev F)
- Bucket `sessions`, **private**, лимит файла 50 МБ.
- Пути: `sessions/{session_id}/raw/face.webm`, `raw/audio.webm`, `raw/rrweb.json`, `raw/steps.json`, `manifest.json`, `derived/face.mp4`.
- Политика чтения для команды; запись только через подписанные URL.
- Включить S3-доступ к Storage и выпустить отдельные ключи для воркера (H-2). *Работу S3-эндпоинта Supabase с boto3 проверить здесь же.*

**A-5. Supabase: Edge Functions** (Dev F)

| Функция | Вход | Что делает | Выход |
|---|---|---|---|
| `start-session` | `invite_token`, `consent_version`, `client` | Проверяет токен (не использован, не истёк); создаёт `sessions`; помечает приглашение использованным; создаёт подписанные URL на загрузку 4 файлов | `session_id`, `upload_urls`, `app_path`, `durations` (`min_duration_s`, `max_duration_s`, `tail_after_complete_s`, `warn_before_end_s` из `tests`) |
| `save-survey` | `session_id`, `kind`, `answers` | Валидирует (zod-схема как на фронте) и пишет `pre_survey` / `post_survey` | `ok` |
| `finish-session` | `session_id`, `t0_ms`, `streams[]`, `end_reason`, `end_step` | Проверяет, что файлы загружены; пишет `session_files` и `manifest.json`; ставит статус `uploaded`; создаёт `jobs`; (режим `workflow`) запускает задачу на Render | `ok` |

- CORS: разрешить `https://pmf.decoder.digital` и `http://localhost:8080`.
- Простое ограничение: один `start-session` на токен.

**A-6. Фронтенд: подключение Supabase** (Dev F)
- `npm i @supabase/supabase-js rrweb rrweb-player`.
- `src/lib/supabase.ts` — клиент из `import.meta.env.VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
- `.env.local` (не коммитить) + `.env.example` в репозитории.
- В `.github/workflows/deploy.yml`, в шаг Build:
  ```yaml
  - name: Build
    run: npm run build
    env:
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  ```
- Добавить эти два секрета в GitHub → Settings → Secrets → Actions. Anon-ключ публичный по природе, защищают данные политики RLS.
- Если проект продолжает жить в Lovable: подключить тот же Supabase-проект в Lovable, чтобы правки из Lovable не ломали клиент.

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

---

### B. Фронтенд: тестовый флоу (Dev F)

**B-1. Маршрут и шаги.** `/test#invite=TOKEN`. Новые шаги в `TestPage.tsx`:
`invite-check → consent → device-check → pre-survey → recording → uploading → post-survey → thanks`.
Без токена — экран «Ссылка недействительна». Бейдж DEMO убрать для режима с приглашением.

**B-2. Экран согласия** (`ConsentStep.tsx`). Текст от Katya + Javier, версия `consent_v1`. Кнопка «Продолжить» активна только при отмеченном чекбоксе. Вызов `start-session`; ответ (`session_id`, `upload_urls`, `app_path`, `durations`) кладётся в состояние страницы.

**B-3. Проверка устройства** (`DeviceCheck.tsx`).
- `getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: true })` — запрашивается **здесь**, и тот же поток передаётся в запись, чтобы не спрашивать разрешение второй раз.
- Свет: раз в 500 мс снимать кадр в canvas 64×48, считать среднюю яркость; порог по умолчанию — 60 из 255 (Ivan утверждает).
- Микрофон: `AnalyserNode`, индикатор уровня; предупреждение, если 5 секунд тишины при просьбе сказать фразу.
- Лицо (Should): MediaPipe Face Detector; «Лицо в кадре: да / нет».
- Кнопка «Начать» активна, когда свет ок, микрофон ок и (если включено) лицо найдено.

**B-4. Запись** (`RecordingSession.tsx`, рефакторинг).
- Удалить `getDisplayMedia`, `screenRecorderRef`, `screenChunks`, обработчик `onended` и карточку «Screen» в инструкции.
- Форматы с fallback, выбранный записать в `client`:
  - видео: `video/webm;codecs=vp9` → `video/webm;codecs=vp8` → `video/webm` → `video/mp4`;
  - аудио: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4`.
- `t0_ms = Date.now()` в `onstart` записи камеры; у аудио — своё `started_at_ms`.
- iframe: `src={app_path}`, `sandbox="allow-scripts allow-same-origin allow-forms"`, `allow` без камеры.
- Мост событий: `window.addEventListener("message", …)` с проверкой `event.origin === window.location.origin` и `event.source === iframe.contentWindow`. Типы сообщений — раздел 7.2.
- Все длительности — из `durations` (FR-20), **никаких констант в коде**. По умолчанию: минимум 30 с, максимум 120 с, хвост 8 с, предупреждение за 15 с.
- Условия окончания (FR-07): `step === "cart"` после `add_to_cart` + `tail_after_complete_s` → `completed`; `max_duration_s` → `timeout`; кнопка → `user_stopped`.
- Кнопка «Стоп» до `min_duration_s` (FR-21): диалог «Запись слишком короткая для анализа. Завершить всё равно?» → «Продолжить» / «Завершить». При завершении — `end_reason = 'too_short'`, файлы всё равно загружаются (для отладки), анализ не запускается.
- Таймер работает, но **не показывается**; за `warn_before_end_s` до конца — мягкая подсказка (0 — не показывать).
- Остановка: `requestData()` + `stop()` всех записей, ожидание `onstop`, затем загрузка.
- **Риск SPA-редиректа:** iframe грузит `/lab/pizza/`. Если это путь внутри React-роутера, GitHub Pages отдаст `404.html`, который пишет `spa_redirect` в `sessionStorage`. Его разделяют родитель и iframe того же источника. Поэтому пицца-приложение собирается **отдельной HTML-точкой входа** (см. C-1), и Pages отдаёт настоящий файл без редиректа. *Поведение Pages с вложенным `index.html` нужно проверить на проде.*

**B-5. Загрузка** (`useSessionUpload.ts`).
- Файлы: `face.webm`, `audio.webm`, `rrweb.json`, `steps.json` → `uploadToSignedUrl` по URL из `start-session`.
- Прогресс по суммарным байтам; до 3 повторов на файл с паузой 2/5/10 секунд.
- Затем `finish-session` с `t0_ms`, `streams[]`, `end_reason`, `end_step`.
- Пока загрузка не завершена — `beforeunload`-предупреждение (уже есть, расширить на фазу загрузки).

**B-6. Опросы.** `PreSurvey` и `PostSurvey`: `onComplete(data)` → `save-survey`. Вопросы пре-опроса адаптировать под сценарий заказа пиццы (Anna + Katya).

**B-7. Экран «Спасибо».** Без ссылки на результаты — респондент их не видит.

**B-8. Вход команды.** Страница `/login` (email + magic link или OTP), защищённые маршруты `/results/:id` и `/admin`. Проверка членства в `team_members`.

**B-9. Мобильный spike (Could).** Проверить на iPhone (Safari) и Android (Chrome): разрешения камеры, запись при активном iframe, вёрстка «iframe + маленькое превью». Результат — короткая заметка «работает / не работает / что сломалось».

---

### C. Пицца-приложение (Design + Dev F)

**C-1. Сборка.** Отдельная точка входа Vite: `lab/pizza/index.html` + `src/lab/pizza/main.tsx`; в `vite.config.ts`:
```ts
build: { rollupOptions: { input: {
  main: path.resolve(__dirname, "index.html"),
  pizza: path.resolve(__dirname, "lab/pizza/index.html"),
} } }
```
*Проверить, что Lovable не ломает multi-page сборку при своих правках.*

**C-2. Экраны** (Anna — макеты, Dev F — вёрстка):
1. **Search** — поиск по меню, категории, результаты.
2. **Choose** — карточка пиццы: размер, тесто, добавки, цена.
3. **Cart** — корзина, итог, кнопка «Оформить».
Данные меню — статический JSON. Без реальной оплаты.

**Ограничения вёрстки — чтобы всё попадало в запись rrweb:**
- никаких `alert()`, `confirm()`, `prompt()` — только свои модалки (shadcn `Dialog`, `Sheet`, `Popover`);
- никакого нативного `<select>` — только shadcn `Select` или своё выпадающее меню (раскрытый нативный список рисует ОС, rrweb его не видит);
- никаких новых окон и вкладок (`window.open`, `target="_blank"`) — всё внутри приложения;
- важные подсказки показывать по клику, а не только по наведению (`:hover` в повторе воспроизводится не всегда точно);
- у каждой модалки и попапа — стабильный `data-popup-id` (например, `size-info`, `promo`, `cart-confirm`).

**C-3. Заложенные UX-проблемы** — `src/lab/pizza/challenges.json`, версия `v1`. Пример структуры:

```json
[
  { "id": "CH1", "step": "search", "type": "findability",
    "element": "#search-input", "description": "Поиск не находит 'пеперони' без второй 'п'",
    "expected": "замешательство, повторный ввод" },
  { "id": "CH2", "step": "choose", "type": "hidden_cost",
    "element": "#size-xl", "description": "Цена размера XL видна только после выбора",
    "expected": "удивление → негатив" },
  { "id": "CH3", "step": "cart", "type": "dead_click",
    "element": "#promo-banner", "description": "Баннер выглядит кликабельным, но не реагирует",
    "expected": "rage/dead clicks, раздражение" }
]
```
Конкретный набор проблем — Anna + Ivan, 3–4 штуки, по одной-две на экран. Каждой проблеме — `data-challenge="CH1"` на элементе.

**C-4. Мост событий.** В пицца-приложении:
- `rrweb.record({ emit, maskAllInputs: true, sampling: { mousemove: 50, scroll: 150 } })`; события копятся и отправляются родителю раз в 1 секунду через `postMessage`.
- При смене экрана — `{ type: "decoder:step", step, t }`; при добавлении в корзину — `{ type: "decoder:action", action: "add_to_cart", t }`.
- При открытии и закрытии любого попапа или модалки — `popup_open` / `popup_close` с `id` из `data-popup-id`; при закрытии — способ: `button`, `outside_click`, `esc`. Удобно повесить на общий обработчик `onOpenChange` в обёртке над shadcn-компонентами.
- Глубина скролла: на каждом экране при первом достижении 25 / 50 / 75 / 100 % высоты — `scroll_depth` с `step` и `depth_pct`. Внутренние прокручиваемые блоки (список меню, корзина) — отдельно, с `container`.
- Если приложение открыто не в iframe — работает как обычная страница, события не шлёт.

---

### D. Воркер анализа (Dev B)

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

---

### E. Агрегация и «AI Brain» (Dev B + Ivan)

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

---

### F. Страница результатов (Dev F + Anna)

**F-1. Данные.** `useQuery(["result", id])` → `results.data` + `sessions` + подписанные URL на `face.mp4` и `rrweb.json` (срок 1 час). Выдуманные данные удалить.
**F-2. Оценка.** Карточка NeuroScore из `results.data.neuroscore` (выдуманные `neuroScore` и `stageScores` в `ResultsPage.tsx` удалить): общий балл, 6 этапов с иконками (как сейчас), у каждого — подсказка «из чего посчитано» (`inputs`), уверенность и связанные проблемы из `challenges.json`. Этап с низкой уверенностью — серым. Подпись «Методика v0.1 — черновая» до утверждения Ivan. Ниже — 3 оценки по экранам (search / choose / cart).
**F-3. Шкала.** Существующий `AreaChart`: `valence` по секундам, цветные полосы экранов, точки кликов, маркеры ключевых моментов и флагов, вертикальная линия текущего времени плеера.
**F-4. Повтор.** `rrweb-player` + `<video src=face.mp4>` рядом; общий контроллер времени: play/pause/seek на одном двигает другой; клик по моменту на шкале или в списке перематывает оба на `t − 2 с`.
**F-5. Ключевые моменты.** Существующие карточки: эмоция, trust, цитата, рекомендация LLM, кнопка «Показать».
**F-6. Клики на экранах.** Для каждого экрана — снимок из rrweb-player на момент выхода с экрана + точки кликов (rage — красным).
**F-7. Заложенные проблемы.** Таблица: проблема → обнаружена / нет → доказательство (секунды, метрика).
**F-8. Статусы.** Если результата нет — статус из `jobs` («В обработке: этап face», «Отклонено: мало света»).
**F-9. Демо-режим.** `/results/:id` для `is_public_demo` без входа; видео лица не показывается, только шкала и повтор.

**F-10. Настройки теста** (`/admin`, FR-20). Форма для участника команды: `min_duration_s`, `max_duration_s`, `tail_after_complete_s`, `warn_before_end_s`, `neuroscore_version`; проверка `min < max`. Меняет строку `tests` напрямую (RLS разрешает команде), без деплоя.

---

### G. Дизайн (Anna)

| ID | Что | Результат |
|---|---|---|
| G-1 | Пицца-приложение, 3 экрана + 3–4 заложенные проблемы (с Ivan) | Figma-макеты + `challenges.json` с описанием |
| G-2 | Экраны согласия и проверки устройства | Figma, тексты от Katya + Javier |
| G-3 | Вид отчёта: шкала + повтор + лицо + моменты + проблемы | Figma, на основе текущей `ResultsPage` |
| G-4 | Подсказка «осталось 15 секунд» и экран «Спасибо» | Figma |
| G-5 | Тексты пре-опроса под сценарий пиццы | Список вопросов (с Katya) |

---

### H. Переносимость: подготовка к переходу на AWS (Dev F + Dev B)

После теста MVP платформу планируется перенести с Supabase на AWS (раздел 12). Чтобы перенос был заменой адаптеров, а не переписыванием, уже в MVP:

**H-1. Адаптеры во фронтенде** (Dev F). Компоненты не вызывают `supabase-js` напрямую. Вместо этого:
- `src/lib/api.ts` — `startSession`, `saveSurvey`, `finishSession`, `getResult`, `listJobs`, `updateTest`;
- `src/lib/auth.ts` — `signIn`, `signOut`, `getUser`, `onAuthChange`;
- `src/lib/storage.ts` — `uploadToSignedUrl`, `getSignedReadUrl`.
Сейчас под ними Supabase; на AWS их заменит реализация на Cognito / API Gateway / S3.

**H-2. Адаптеры в воркере** (Dev B).
- База: прямое подключение к Postgres по `DATABASE_URL` (psycopg), а не REST-клиент Supabase. На AWS меняется только строка подключения к RDS.
- Файлы: S3 API (boto3) к S3-совместимому эндпоинту Supabase Storage (`S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`). На AWS — тот же код с эндпоинтом S3. *S3-доступ Supabase для сервера нужно включить и проверить в A-4.*
- Очередь: доступ к `jobs` спрятан за `queue.py` (`take_next`, `mark_done`, `mark_failed`) — чтобы позже заменить на SQS без изменений в пайплайне.

**H-3. Edge Functions как чистые функции** (Dev F). Логика `start-session`, `save-survey`, `finish-session` — в `functions/core/*.ts` без зависимостей от Deno и Supabase; файлы Edge Functions — тонкие обёртки. На AWS эта же логика оборачивается в Lambda.

**H-4. Без специфики Supabase в схеме.** Миграции — обычный SQL. Права доступа в RLS опираются на `auth.uid()` — это единственное место, завязанное на Supabase; на AWS проверка прав переезжает в API (см. раздел 12). Не использовать Supabase-only расширения без записи в инвентаризацию (H-5).

**H-5. Инвентаризация и целевая архитектура** (Dev F + Dev B, в M4). Документ: что в проекте зависит от Supabase, на что меняется в AWS, оценка часов и стоимости. Основа — таблица раздела 12.

## 7. Контракты данных

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

---

## 8. Разбивка работ

Оценки — порядок величины для планирования; уточнить на старте. `Dep` — от чего зависит задача.

### M0 — подключения (неделя 1)

| ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|
| A-1 | Supabase-проект EU, Auth, команда приглашена, SMTP | Dev F | 3 | — | 4 человека вошли по magic link |
| A-2 | Миграция `001_init.sql` | Dev F | 3 | A-1 | Таблицы созданы, миграция в репозитории |
| A-3 | RLS-политики + проверка от имени anon и участника | Dev F | 3 | A-2 | anon ничего не читает; участник читает всё |
| A-4 | Bucket `sessions` + политики | Dev F | 1 | A-1 | Загрузка по подписанному URL работает из curl |
| A-6 | Supabase в фронтенде, `.env.example`, секреты в GitHub Actions | Dev F | 2 | A-1 | Прод-сборка видит Supabase |
| A-7a | Репозиторий воркера, Dockerfile, сервис на Render (Frankfurt), переменные | Dev B | 4 | A-1 | Пустой воркер деплоится и пишет в лог |
| A-8 | Локальная среда + 2 эталонные записи | Dev F, Dev B | 2 | — | Записи лежат в Storage `fixtures/` |
| G-1 | Макеты пицца-приложения + заложенные проблемы | Anna (+Ivan) | 8 | — | Утверждено Katya и Ivan |
| G-2, G-4, G-5 | Экраны согласия и проверки устройства, подсказка «15 секунд», «Спасибо», вопросы пре-опроса | Anna | 5 | — | Тексты согласованы с Javier и Katya |
| | **Итого M0** | | **31** | | |

### M1 — запись end-to-end (недели 2–3)

| ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|
| A-5 | Edge Functions `start-session`, `save-survey`, `finish-session` | Dev F | 8 | A-2..A-4 | Вызовы из curl проходят, ошибки токена обрабатываются |
| C-1 | Отдельная точка входа `/lab/pizza/` | Dev F | 2 | — | На проде открывается без SPA-редиректа |
| C-2 | Вёрстка 3 экранов пиццы | Dev F | 8 | G-1, C-1 | Флоу поиск → выбор → корзина работает |
| C-3 | `challenges.json` + `data-challenge` на элементах | Dev F + Anna | 2 | C-2 | Все проблемы размечены |
| C-4 | rrweb + step/action-события в пицце | Dev F | 4 | C-2 | Родитель получает события в консоли |
| B-1 | Маршрут `/test#invite=`, новые шаги | Dev F | 3 | A-5 | Флоу проходит от токена до «Спасибо» |
| B-2 | Экран согласия | Dev F | 2 | G-2, A-5 | Без чекбокса не идёт дальше; версия сохраняется |
| B-3 | Проверка устройства (свет + микрофон; лицо — Should) | Dev F | 6 | G-2 | Плохой свет блокирует старт с подсказкой |
| B-4 | Рефакторинг записи: без скринкаста, fallback форматов, t0, мост, условия окончания, скрытый таймер | Dev F | 8 | C-4 | Три условия окончания работают, `end_reason` верный |
| B-5 | Реальная загрузка + повторы + `finish-session` | Dev F | 5 | A-5, B-4 | Файлы в Storage, `manifest.json` верный, создан `job` |
| B-6 | Сохранение опросов | Dev F | 2 | A-5 | Ответы в `sessions` |
| B-7 | Экран «Спасибо» | Dev F | 1 | — | — |
| A-9 | Параметры длительности в `tests` + выдача в `start-session` + «Стоп» до минимума (FR-20, FR-21) | Dev F | 3 | A-2, A-5, B-4 | Изменение `tests` меняет поведение записи без деплоя |
| H-1 | Адаптеры `api.ts`, `auth.ts`, `storage.ts` | Dev F | 4 | A-6 | Ни один компонент не импортирует `supabase-js` напрямую |
| H-3 | Логика Edge Functions в чистых функциях + тонкие обёртки | Dev F | 2 | A-5 | `functions/core` не импортирует Deno и Supabase |
| | **Итого M1** | | **60** | | **Проверка:** 3 сессии в Chrome, Firefox, Safari сохранены целиком |

### M2 — анализ (недели 3–5)

| ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|
| D-1 | Каркас воркера, опрос `jobs`, статусы | Dev B | 4 | A-7a | Задача проходит `queued → running → done` |
| D-2 | Prep: ffmpeg, кадры, wav, face.mp4 | Dev B | 4 | D-1 | Файлы созданы, `face.mp4` перематывается в браузере |
| D-3 | Quality gate | Dev B + Ivan | 3 | D-2 | Тёмная запись отклоняется с причиной |
| D-4 | Лицо: DeepFace + HSEmotion | Dev B | 6 | D-2 | ≥ 70% кадров с эмоцией на эталонной записи |
| D-5 | Аудио: faster-whisper + тональность + просодия | Dev B | 5 | D-2 | Расшифровка совпадает с речью на слух |
| D-6 | Метрики rrweb + шаги | Dev B | 5 | D-1 | Rage/dead clicks находятся на заложенной проблеме CH3 |
| E-1..E-5 | Агрегация: шкала, trust, моменты, флаги, оценки, проблемы | Dev B + Ivan | 10 | D-3..D-6 | `results.json` соответствует схеме 7.3 |
| E-6 | LLM-выводы по агрегатам | Dev B | 4 | E-1..E-5 | Рекомендации ссылаются на реальные секунды |
| E-7 | NeuroScore v0.1: 6 этапов, уверенность, `inputs`, связь с проблемами | Dev B + Ivan | 8 | E-1..E-5 | Блок `neuroscore` по схеме 7.3; Ivan проверил на эталонных записях |
| H-2 | Воркер: Postgres по `DATABASE_URL`, файлы через S3 API, `queue.py` | Dev B | 4 | D-1 | Воркер не импортирует клиент Supabase |
| D-7 | Таймауты, повторы, логи | Dev B | 2 | D-1 | Падение этапа не вешает очередь |
| D-8 | Выбор и настройка режима Render (Workflows или Background Worker) | Dev B | 3 | D-1..E-6 | Сессия обрабатывается на Render ≤ 15 мин |
| | **Итого M2** | | **58** | | **Проверка:** эталонные записи обработаны на Render |

### M3 — отчёт (недели 5–6)

| ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|
| G-3 | Вид отчёта в Figma | Anna | 6 | — (можно раньше) | Утверждено Katya |
| B-8 | Вход команды, защищённые маршруты | Dev F | 4 | A-1 | Без входа `/results/:id` недоступна |
| F-1 | Данные из Supabase вместо выдуманных | Dev F | 3 | E-6 | — |
| F-2..F-3 | Оценки и шкала с экранами, кликами, моментами | Dev F | 5 | F-1 | — |
| F-4 | Синхронный повтор rrweb + видео лица | Dev F | 6 | F-1 | Перемотка с момента двигает оба плеера |
| F-5..F-7 | Моменты, клики на экранах, таблица проблем | Dev F | 6 | F-4 | — |
| F-8 | Статусы обработки | Dev F | 1 | F-1 | — |
| F-9 | Публичная демо-сессия | Dev F | 2 | F-1 | Открывается без входа, без видео лица |
| F-2b | NeuroScore на странице: 6 этапов из данных, «из чего посчитано», уверенность, версия | Dev F | 4 | E-7, F-1 | Выдуманные `neuroScore` и `stageScores` удалены |
| F-10 | Форма настроек теста в `/admin` | Dev F | 2 | A-9, B-8 | Длительности и версия NeuroScore меняются из интерфейса |
| E-8 | Скрипт пересчёта NeuroScore по новой версии (Should) | Dev B | 2 | E-7 | Пересчёт без повторной обработки видео |
| | **Итого M3** | | **41** | | |

### M4 — готовность к пилоту (неделя 7)

| ID | Задача | Кто | ч | Dep | Готово, когда |
|---|---|---|---|---|---|
| T-1 | 5 сессий с людьми вне команды, разные браузеры | Katya + Anna | 5 | M1–M3 | Все 5 обработаны без ручного вмешательства |
| T-2 | Проверка: хватает ли 2 минут (доля `timeout`) | Katya | 1 | T-1 | Решение: оставить 120 с или менять |
| T-3 | Сверка результатов с наблюдением команды | Ivan | 3 | T-1 | Таблица «система / человек» по ключевым моментам |
| C-04/05 | Скрипт удаления сессии + процедура хранения 90 дней | Dev B | 3 | A-4 | Сессия удаляется одной командой |
| C-08 | DPIA, финальные тексты согласия и политики | Katya + Javier | 4 | — | Подписано до внешних сессий |
| B-9 | Мобильный spike | Dev F | 3 | M1 | Заметка с результатом |
| H-5 | Инвентаризация зависимостей от Supabase + целевая AWS-архитектура | Dev F + Dev B | 4 | M1–M3 | Документ по разделу 12 с оценкой часов |
| | **Итого M4** | | **23** | | |

Часы ниже — **ориентир объёма работы ИИ-агентов**; время людей на ревью и решения — в разделе 13.4.

**Всего ≈ 213 ч**: Dev F ≈ 111 ч, Dev B ≈ 70 ч, Anna ≈ 25 ч, плюс время Ivan, Katya и Javier на решения и проверку.

### Срез на 5 часов

Если на первый подход есть одна 5-часовая сессия, берите только то, что снимает главный технический риск, — без Supabase, Render и фронтенда:
- Dev B: D-2 + D-4 + D-5 локально на эталонной записи → `emotions.json` и `transcript.json`.
- Dev F: C-4 на черновом экране пиццы → проверка, что rrweb-события доходят до родителя.
- Anna: G-1 (первые макеты пиццы и список заложенных проблем).

---

## 9. Тестирование и приёмка

| Что | Как | Критерий |
|---|---|---|
| Запись | Ручной прогон в Chrome, Edge, Firefox, Safari (desktop) | Все 4 файла в Storage, `manifest` корректный |
| Условия окончания | 3 прогона: дойти до корзины / ждать 2 мин / нажать «Стоп» | Верный `end_reason` и `end_step` |
| Синхронизация | Хлопок в ладоши в кадре + клик в ту же секунду | Расхождение событий на шкале ≤ 0.5 с |
| Quality gate | Запись в темноте | Статус `rejected`, причина «мало света» |
| Воркер | Эталонные записи в `fixtures/`, `pytest` | Схема `results` валидна, время ≤ 15 мин на Render |
| Безопасность | Запросы anon-ключом к таблицам и bucket | Отказ везде, кроме демо-результата |
| Отчёт | Открыть результат эталонной записи | Повтор и видео синхронны; моменты кликабельны |
| Пилотная готовность | T-1..T-3 | 5/5 сессий обработаны; ≥ 1 заложенная проблема найдена |

---

## 10. Риски

| Риск | Вероятность | Что делаем |
|---|---|---|
| Точность библиотек на веб-камере 640×480 при плохом свете | Высокая | Проверка света до старта, quality gate, две библиотеки + trust, честный показ уверенности |
| Safari не пишет выбранный формат | Средняя | Fallback на `video/mp4`, тест в M1 |
| Конфликт SPA-редиректа GitHub Pages с iframe | Средняя | Отдельная точка входа `/lab/pizza/` (C-1), проверка на проде |
| Lovable перезаписывает ручные правки (multi-page, Supabase-клиент) | Средняя | Договориться: правки этих файлов — только в git; проверять после каждой генерации в Lovable |
| 4 GB RAM на Render мало для DeepFace + Whisper | Средняя | Модели грузить по очереди, Whisper `small`; при нехватке — `2c-8g` |
| Тикающий таймер или сама запись влияют на эмоции | Средняя | Скрытый таймер; Ivan оценивает в T-3 |
| 2 минут не хватает на 3 экрана | Средняя | T-2; при доле `timeout` > 30% — упростить задание или 180 с |

---

## 11. Открытые вопросы

| # | Вопрос | Кто решает | К какому сроку |
|---|---|---|---|
| Q1 | Кто технический ревьюер PR агентов (предложено: Mark) | Katya | Старт M0 |
| Q2 | Отдельный dev-проект Supabase — да (агенты работают только в нём, раздел 13.1) | Mark | A-1 |
| Q3 | Render: Workflows доступен в аккаунте? | Dev B | D-8 |
| Q4 | Таблица valence, пороги trust и quality gate, формула оценки | Ivan | E-1 / D-3 |
| Q5 | Формулы, окна и веса NeuroScore v0.1 (E-7) — утвердить или поправить | Ivan | E-7 |
| Q6 | Показывать ли предупреждение «осталось 15 секунд» | Ivan | B-4 |
| Q7 | Какой LLM-провайдер и модель для выводов | Katya + Dev B | E-6 |
| Q8 | Срок хранения сырого видео (90 дней?) и формулировки согласия | Katya + Javier | C-08 |
| Q9 | Язык сессий: только испанский, только английский или оба | Katya | D-5 |
| Q10 | Длительности по умолчанию: минимум 30 с, максимум 120 с — подтвердить после T-2 | Katya + Ivan | T-2 |
| Q11 | AWS: регион (eu-south-2 Испания или eu-central-1 Франкфурт), сроки, есть ли кредиты AWS | Katya | H-5 |
| Q12 | AWS: Cognito для входа команды или свой вход через API | Dev F | H-5 |

**Где я не уверен на 100%:** лимит писем встроенной почты Supabase; точный способ запуска Render Workflows через API; что Lovable корректно переживает multi-page сборку; что GitHub Pages отдаёт `/lab/pizza/index.html` без редиректа. Всё это проверяется в задачах A-1, D-8 и C-1.

---

## 12. Перенос на AWS после теста MVP

**Когда:** после вехи M4 и теста на 5 сессиях. В MVP делаются только подготовительные задачи H-1…H-5.

### 12.1 Что на что меняется

| Сейчас | На AWS | Что меняется в коде |
|---|---|---|
| Supabase Postgres | Amazon RDS for PostgreSQL (или Aurora Serverless v2) | Строка подключения. Миграции — те же SQL-файлы |
| RLS на `auth.uid()` | Проверка прав в API (Lambda) + роли БД | Политики RLS заменяются проверками в `functions/core` |
| Supabase Auth | Amazon Cognito (или свой вход — Q12) | Реализация `auth.ts`; 4 участника команды приглашаются заново |
| Supabase Storage | Amazon S3 (приватный bucket, presigned URL) | Эндпоинт и ключи в адаптерах `storage.ts` и воркера |
| Edge Functions | AWS Lambda + API Gateway (или Lambda Function URLs) | Новые обёртки над `functions/core` |
| Таблица `jobs` + опрос | SQS (по желанию) или та же таблица в RDS | `queue.py` |
| Воркер на Render | ECS Fargate / AWS Batch / EC2 — тот же Docker-образ | Переменные окружения |
| GitHub Pages | Может остаться или S3 + CloudFront | `VITE_*` переменные |

### 12.2 Шаги

1. **Инвентаризация** (H-5): список всех зависимостей от Supabase, проверка, что адаптеры покрывают всё.
2. **Инфраструктура как код** (Terraform или AWS CDK): VPC, RDS, S3, Cognito, Lambda, API Gateway, ECS/Batch, IAM-роли, регион по Q11.
3. **Пробный перенос данных:** `pg_dump` → RDS; файлы — копирование из S3-эндпоинта Supabase в S3 (`aws s3 sync` или rclone).
4. **Реализация адаптеров для AWS** и прогон эталонных записей из `fixtures/`: результат совпадает с Supabase-версией.
5. **Переключение:** заморозка новых сессий на 1–2 часа, финальная синхронизация данных, смена конфигурации фронтенда и воркера.
6. **Две недели параллельно:** Supabase только для чтения как резерв, затем удаление данных из Supabase по чек-листу GDPR.

### 12.3 Оценка

Около **40–60 часов** разработки при выполненных H-1…H-5 — это моя оценка, её уточняет H-5. Без подготовки адаптеров перенос потребовал бы переписывания фронтенда, функций и воркера. Стоимость AWS считается в H-5 после выбора сервисов и региона.

### 12.4 Риски переноса

| Риск | Что делаем |
|---|---|
| Права доступа: при уходе от RLS легко оставить дыру | Тесты «anon / участник / чужая сессия» на каждый API-метод до переключения |
| Ссылки на файлы в старых результатах | Хранить в БД пути (`sessions/{id}/…`), а не URL — так уже сделано |
| Простой во время переключения | Окно без новых сессий; ссылки-приглашения выдавать после переключения |
| Данные в EU | Регион AWS в EU (Q11), проверка Javier |


---

## 13. Разработка ИИ-агентами: что подтверждает человек

Код пишут ИИ-агенты: агент **F** (фронтенд + Supabase, бриф `Decoder_MVP_DevF.md`) и агент **B** (воркер + Render, бриф `Decoder_MVP_DevB.md`). Часы в разделе 8 — ориентир объёма работы агента, а не время людей. Люди делают три вещи: то, что агент сделать не может (аккаунты, оплата, ключи), решения в гейтах ниже и пилотное тестирование.

**Технический ревьюер:** назначить — предлагаю Mark (mt@decoder.digital). Он принимает PR агентов и проходит технические гейты.

### 13.1 Правила для агентов

1. Работа только в ветках, каждый результат — PR. **Слияние в `main` и любой деплой в прод — только человек.**
2. Агент не получает ключи прода (`service_role`, ключи S3 прода, ключ Render). Для работы — отдельный dev-проект Supabase (Q2 решается в пользу отдельного проекта) и локальный Docker.
3. **Агенты не видят реальные записи респондентов.** Только эталонные записи команды из `fixtures/` и открытые датасеты. Видео лица — биометрия; передача его в среду агента — отдельная обработка данных, которую нужно было бы описывать в согласии и DPIA.
4. Агент не меняет контракты раздела 7 и схему БД без гейта: предлагает изменение в PR с пометкой `needs-approval`.
5. Агент не запускает на проде ничего, что удаляет или перезаписывает данные: миграции, скрипты удаления и хранения, пересчёт NeuroScore по всем сессиям.
6. Тексты для респондентов (согласие, политика, уведомление по AI Act) агент готовит только как черновик; финальный текст — от Katya и Javier.
7. Задача с гейтом закрывается только после отметки человека в PR («Approved by …»). Агент не отмечает её выполненной сам.
8. Каждый PR: описание, что сделано, ссылки на задачи, результат тестов, скриншоты или запись для UI.

### 13.2 Что делает только человек руками

| Что | Кто | ч | Когда |
|---|---|---|---|
| Создать dev- и прод-проекты Supabase (EU), оплата Pro перед пилотом | Mark + Katya (оплата) | 1 | M0 / M4 |
| Аккаунт Render, подключение GitHub, регион, тариф | Mark | 0.5 | M0 |
| Секреты: GitHub Actions, переменные Render, ключ LLM | Mark | 0.5 | M0 / M2 |
| Пригласить команду в Supabase Auth, настроить SMTP домена | Mark | 0.5 | M0 |
| Выдать агентам доступ: репозитории, dev-проект Supabase (без ключей прода) | Mark | 0.5 | M0 |
| Записать 2 эталонные сессии для `fixtures/` | Katya + Anna | 0.5 | M0 |
| **Итого** | | **3.5** | |

### 13.3 Гейты: где агент останавливается и ждёт решения

| Гейт | Задачи | Что проверить | Кто | ч на ревью | Веха |
|---|---|---|---|---|---|
| G1. Схема БД, RLS, Storage | A-2, A-3, A-4, A-9 | anon ничего не читает и не пишет; нет лишних прав у `anon`/`authenticated`; bucket приватный; срок подписанных URL; ограничения `tests` | Mark | 1.5 | M0 |
| G2. Edge Functions | A-5, H-3 | Проверка токена приглашения, нельзя загрузить в чужую сессию, CORS только для своих доменов, нет секретов в ответах | Mark | 1 | M1 |
| G3. Тексты для респондента | B-2, G-2, PrivacyPolicy | Согласие (GDPR), уведомление о распознавании эмоций (AI Act, ст. 50), срок хранения, контакт для отзыва согласия | Katya + Javier | 1.5 + 1.5 | M1 |
| G4. Дизайн пиццы и заложенные проблемы | C-2, C-3 | Совпадает с макетами Anna; проблемы CH1–CH4 работают так, как задумано | Anna (+ Ivan по проблемам) | 1.5 + 0.5 | M1 |
| G5. Флоу респондента вживую | B-1…B-7, A-9 | Пройти самому в Chrome, Firefox, Safari: разрешения, свет, три условия окончания, «Стоп» до минимума, загрузка | Katya + Anna | 2 | M1 |
| G6. Скрытый таймер и предупреждение | B-4 (Q6) | Методологически допустимо ли предупреждение «скоро конец» | Ivan | 0.5 | M1 |
| G7. Quality gate | D-3 | Пороги света, доли лица, тишины, минимальной длительности | Ivan | 1 | M2 |
| G8. Выход моделей на эталонах | D-4, D-5 | Эмоции и расшифровка на эталонных записях выглядят правдоподобно; маппинг меток (contempt → ?) | Ivan | 1.5 | M2 |
| G9. Агрегация, флаги, оценки по экранам | E-1…E-5 | Таблица valence, trust, правила моментов и флагов на эталонах | Ivan | 2 | M2 |
| G10. NeuroScore v0.1 | E-7 (Q5) | Формулы, окна, веса, порог уверенности; результат на эталонах осмыслен | Ivan (+ Katya 0.5) | 2.5 | M2 |
| G11. LLM-выводы | E-6 | Что уходит в LLM (только агрегаты), промпт, нет выдуманных фактов на 2 эталонах; выбор провайдера (Q7) | Katya | 1 | M2 |
| G12. Режим Render и расходы | D-8 | Workflows или Background Worker; бюджет | Katya + Mark | 0.5 | M2 |
| G13. Страница результатов | F-1…F-10, F-2b | Понятно ли без объяснений; NeuroScore с пометкой «черновая методика»; демо-режим не показывает лицо | Katya + Anna | 1.5 | M3 |
| G14. Удаление и хранение данных | C-04/05 | Скрипт удаляет ровно одну сессию; хранение не трогает `results`; прогон на dev перед продом | Mark + Katya | 1 | M4 |
| G15. Выпуск в прод | конец каждой вехи | Миграции на проде, слияние в `main`, деплой Render; откат понятен | Mark | 0.5 × 5 = 2.5 | M0–M4 |
| G16. Инвентаризация для AWS | H-5 | Полнота списка зависимостей, целевая архитектура, оценка | Mark + Katya | 2 | M4 |
| Регулярно. Выборочный просмотр PR | все | Чтение диффов и тестов, ответы на вопросы агентов | Mark | 1 ч/нед × 7 = 7 | M0–M4 |

### 13.4 Сводка времени людей

| Человек | Ревью и решения | Руками (13.2) | Уже было в плане | Итого |
|---|---|---|---|---|
| Mark — технический ревьюер | G1, G2, G12, G14, G15, G16, регулярный просмотр ≈ 15.5 ч | 3 ч | — | **≈ 18.5 ч** |
| Katya — PO | G3, G5, G10, G11, G12, G13, G14, G16 ≈ 7.5 ч | 0.5 ч | C-08 DPIA 4 ч, T-1…T-2 ≈ 4 ч | **≈ 16 ч** |
| Ivan — методология | G4, G6, G7, G8, G9, G10 ≈ 9 ч | — | T-3 3 ч | **≈ 12 ч** |
| Anna — дизайн | G4, G5, G13 ≈ 3 ч | 0.25 ч | G-1…G-5 ≈ 18 ч, T-1 ≈ 2.5 ч | **≈ 24 ч** |
| Javier — комплаенс | G3 ≈ 1.5 ч | — | C-08 (вместе с Katya) | **≈ 1.5 ч + DPIA** |

Итого людей на ревью и решения — **≈ 36 ч** за 7 недель, плюс дизайн и пилотные тесты. Гейты G7–G10 у Ivan идут подряд в M2 — **это главное узкое место по календарю**: если Ivan доступен только 2–3 часа в неделю, M2 растянется. Агенты в это время продолжают задачи M3 на фикстурах.

**Чего здесь нет:** стоимости работы самих агентов (зависит от выбранного инструмента и тарифа) и времени на исправления после ревью — заложите ещё 20–30 % к времени Mark.
