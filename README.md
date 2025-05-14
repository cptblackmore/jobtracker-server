# JobTracker Server — сервер для агрегатора вакансий

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-brightgreen)](https://www.mongodb.com/try)
[![JWT](https://img.shields.io/badge/Auth-JWT-blue)](https://jwt.io/)
[![REST](https://img.shields.io/badge/API-RESTful-orange)](https://restfulapi.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/cptblackmore/jobtracker-server/blob/main/LICENSE)

**JobTracker Server** — RESTful API-сервер, созданный как бэкенд для моего клиентского приложения [JobTracker](https://github.com/cptblackmore/jobtracker) — агрегатора вакансий с разных источников.

Он предоставляет безопасную авторизацию с JWT, хранение избранных вакансий в БД, проксирование запросов к внешним API (HH, SuperJob, Trudvsem) и обработку местоположений для автокомплита/подстановки в проксируемый запрос.

Создан на **Express** + **MongoDB** с акцентом на масштабируемость, безопасность и гибкость.

## Основной функционал
    
- **Регистрация и активация:** регистрация по e-mail и подтверждение через письмо, повторная отправка с кулдауном.
- **JWT-аутентификация:** генерация access/refresh-токенов, их обновление и безопасная отправка на клиент.
- **Избранное:** синхронизация избранных вакансий подтверждённого пользователя между клиентом и БД, их добавление и удаление. 
- **Прокси:** безопасное перенаправление запросов на разрешённые API источников вакансий, с защитой от SSRF.
- **Поиск мест:** fuzzy-поиск городов/регионов в нормализованной JSON коллекции.
- **Безопасность:** ограничение доверенных доменов (Referer, CORS), httpOnly + Secure refresh-куки, валидация входных данных, защита проксируемых запросов по вайт-листу и rate-limiter.

## Стек

### Основные библиотеки и платформы

- **Node.js** + **Express 4** — быстрый и минималистичный веб-сервер
- **MongoDB 6** + **Mongoose** — документно-ориентированная база с ODM
- **JWT (jsonwebtoken)** — безопасная авторизация с access/refresh-токенами
- **bcrypt** — соление паролей и безопасное хранение хэшей
- **Nodemailer** — отправка писем активации
- **Fuse.js** — fuzzy-поиск местоположений в JSON-коллекции

### Безопасность и валидация

- **express-validator** — валидация тела запросов при регистрации и авторизации
- **express-rate-limit** — ограничение количества запросов к внешним API
- **http-proxy-middleware** — проксирование запросов
- **cookie-parser** + **CORS** — работа с куками и безопасный обмен между клиентом и сервером

### Дополнительные библиотеки

- **dotenv** — переменные окружения и изоляция секретов
- **nodemon** — hot-reloading сервера в dev-режиме
- **eslint** + **eslint-plugin-import** — контроль импорта
- **uuid** — генерация уникальных ключей для ссылок активации

## Устройство и архитектура

Проект построен по многоуровневой архитектуре:

- **index.js** — точка входа, инициализация сервера, подключение к БД и роутинг
- **Router** — организует маршруты, подключает middleware на их уровне
- **Controllers** — обрабатывают входящие запросы, вызывают соответствующие сервисы
- **Services** — реализуют бизнес-логику (регистрация, логин, refresh, работа с избранным и т.д.)
- **Models (Mongoose)** — схемы MongoDB (`user`, `token`, `favorites`)
- **DTOs** — формируют безопасный и стабильный ответ для клиента (`userDto`, `favoritesDto`)
- **Middlewares** — промежуточные обработчики (`auth-middleware`, `error-middleware` и др.)

### Авторизация

- Основана на JWT-токенах: `accessToken` и `refreshToken`.
- `accessToken` используется в запросах (`Authorization: Bearer`) и возвращается в теле ответа.
- `refreshToken` передаётся в httpOnly + Secure cookie и недоступен через JS.
- Обновление токенов требует подтверждения с клиента (`/api/refresh/ack`) — для защиты от их потери.
- Ключи токенов (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) хранятся в `.env`.
- refresh-токены хранятся в MongoDB (`tokenModel`).

#### Регистрация (`/api/registration` → `/api/activate/:link`)

1. Пользователь отправляет `email` и `password`.
2. Данные проходят валидацию и проверку на наличие пользователя с таким `email`.
3. Сервер создаёт нового пользователя, генерирует `accessToken` и `refreshToken`.
4. `refreshToken` отправляется в `HttpOnly + Secure` cookie.
5. `accessToken` и `userDto` возвращаются в теле ответа.
6. На почту отправляется письмо со ссылкой активации `/api/activate/:link`.
7. Пользователь переходит по ссылке, сервер находит его по `link` и меняет `isActivated`.
8. Пользователь перенаправляется на `CLIENT_URL`, на страницу с сообщением об активации.

#### Логин (`/api/login`)

1. Пользователь отправляет `email` и `password`.
2. Сервер находит пользователя по `email` и проверяет хэш пароля.
3. Сервер генерирует `accessToken` и `refreshToken`.
4. `refreshToken` отправляется в `HttpOnly + Secure` cookie.
5. `accessToken` и `userDto` возвращаются в теле ответа.

#### Обновление токенов (`/api/refresh` → `/api/refresh/ack`)

1. Клиент вызывает `/api/refresh` с `refreshToken` из cookie.
2. Сервер проверяет токен, находит по нему пользователя.
3. Сервер генерирует `accessToken` и `refreshToken`, но `refreshToken` записывается в поле `pendingRefreshToken`.
4. `refreshToken` отправляется в `HttpOnly + Secure` cookie.
5. `accessToken` и `userDto` возвращаются в теле ответа.
6. Клиент подтверждает получение через `/api/refresh/ack`.
7. Сервер сохраняет `pendingRefreshToken` как основной `refreshToken`.
    > Это защищает от потери токенов при нестабильном соединении или из-за несвоевременного закрытия вкладки, обеспечивая атомарность.

#### Выход из аккаунта (`/api/logout`)

1. Клиент вызывает `/api/logout`.
2. Сервер удаляет `refreshToken` из БД.
3. Возвращается пустая cookie:
    ```
    Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=none; Max-Age=0
    ```

### Избранное

- Имеет два режима: `POST` — синхронизация, `PUT` — полная замена.
- Работает только для авторизованных пользователей.
- Хранится в MongoDB (`favoritesModel`), сериализуется через `favoritesDto`.
- У неавторизованных пользователей избранное сохраняется в localStorage клиента и синхронизируется только после логина.

#### Синхронизация (`POST /api/favorites`)

1. Клиент отправляет массив `favorites` с `Authorization: Bearer <accessToken>`.
2. Сервер валидирует токен и извлекает `userId`.
3. Полученное избранное объединяется с текущим в БД без дублирующихся значений.
4. Результат сохраняется и возвращается с `favoritesDto` в теле ответа.

#### Полная замена (`PUT /api/favorites`)

1. Клиент отправляет обновлённый массив `favorites` с `Authorization: Bearer <accessToken>`.
2. Сервер валидирует токен и извлекает `userId`.
3. Текущее избранное в БД полностью заменяется полученным массивом.
4. Результат возвращается с `favoritesDto` в теле ответа.

### Поиск местоположений

Функциональность реализована через `GET /api/places?place=<string>` и предназначена для **автокомплита** фильтра местоположений в клиенте.

#### Источник данных

- В памяти сервера находится JSON-файл `places.json`, размером ~1.2MB, содержащий нормализованные данные из **HeadHunter**, **SuperJob** и **Trudvsem**.
- Данные собраны вручную, унифицированы и включают:
  - Общие идентификаторы
  - Названия
  - Специфичные id для каждого источника

Пример из `places.json`:
```json
{
  "regions": [
    {
      "id": "1620",
      "name": "Республика Марий Эл",
      "hh": "1620",
      "tv": "12",
      "cities": [
        {
          "id": "4228",
          "name": "Виловатово",
          "hh": "4228",
          "sj": "3105"
        },
        {
          "id": "1621",
          "name": "Волжск",
          "hh": "1621",
          "sj": "787"
        },
  ...
```

#### Алгоритм поиска

- При запуске сервера JSON-файл загружается в память.
- На его основе формируются массивы `cities`, `regions`, `places`.
- Для каждого массива создаётся отдельный индекс через **Fuse.js** — лёгкий и быстрый fuzzy-поисковик по строкам.
- При запросе на `/places?place=...` выполняется:
    1. Fuzzy-поиск по массиву `places`
    2. Обрезка до 5 релевантных результатов
    3. Возврат клиенту массива объектов такого вида:
        ```json
        { 
          "id": "1", 
          "name": "Москва", 
          "type": "city" 
        }
        ```
        (*см. [примеры](#примеры-api-запросов), раздел **Поиск местоположений***)

> Помимо автокомплита, та же коллекция `places.json` используется для подстановки специфичных id мест в проксируемые запросы — см. следующую главу.

### Проксирование запросов

- Используется для безопасного и надёжного обращения к сторонним API вакансий (hh.ru, superjob.ru и др.).
- Работает через маршрут `/api/vacanciesProxy`, принимающий параметры как обычный API-запрос.
- Обязательный заголовок: `X-Target-Url` — содержит полный адрес внешнего API.
- Для проксирования разрешены только домены, указанные в `ALLOWED_TARGETS` (`.env`).
- При поиске вакансий по местоположению необходим заголовок `X-Target-Source`, содержащий сокращённое название источника внешнего API (hh, sj и др.).

#### Поток обработки `/api/vacanciesProxy`

```
[Client] → [vacanciesRateLimiter] → [targetUrlMiddleware] → [placesMiddleware] → [proxyMiddleware] → [External API]
```

1. **vacanciesRateLimiter** — ограничивает частоту обращений к внешним API на основе `.env → VACANCIES_LIMIT_WINDOW / _MAX`.
2. **targetUrlMiddleware** — валидирует и парсит `X-Target-Url`, сравнивая проксируемый адрес с доменами в `ALLOWED_TARGETS`.
3. **placesMiddleware** — ищет маркеры `place~...` и заменяет их на специфичные id источников.
4. **http-proxy-middleware** — перенаправляет изменённый запрос во внешний API от имени сервера.

#### Маркеры местоположений (`place~...`)

Маркеры позволяют клиенту указывать обобщённое местоположение, а сервер подставляет специфичный id, соответствующий источнику.

Маркер состоит из нескольких сегментов, разделённых тильдой `~`, в формате `place~<method>~<scope>~<value>`:
  1. `place` — маркер местоположений. `placesMiddleware` ищет его в каждом запросе.
  2. `<method>` — `name` - fuzzy-поиск по названию, `id` - точный поиск по общему id.
  3. `<scope>` — тип искомого местоположения. Используется только для fuzzy-поиска.
      - `city` — поиск только по городам
      - `region` — поиск только по регионам
      - `""` (пустая строка) — поиск по всем местоположениям
  4. `<value>` — название места или его id.

> `placesMiddleware` гибко интерпретирует подход к поиску в зависимости от значений второго и третьего сегментов.

##### Примеры интерпретации

**Пример 1**:
1. Запрос:
    ```
    GET /api/vacanciesProxy?area=place~name~~Москв
    X-Target-Url: https://api.hh.ru/vacancies 
    X-Target-Source: hh
    ```
2. Fuzzy-поиск со строкой "Москв" по всем местоположениям (третий сегмент пропущен):
    ```json
    {
      "id": "1",
      "name": "Москва",
      "hh": "1",
      "tv": "77",
      "sj": "4"
    },
    ```
3. Извлекается значение `1` из поля `hh`.
4. Запрос трансформируется:
    ```
    GET /api/vacanciesProxy?area=1
    ```
5. Пользователь получает вакансии только из Москвы.

**Пример 2**:
1. Запрос:
    ```
    GET /api/vacanciesProxy?area=place~name~region~Москв
    X-Target-Url: https://api.hh.ru/vacancies 
    X-Target-Source: hh
    ```
2. Fuzzy-поиск со строкой "Москв" по регионам находит `Московская область`.
3. Извлекается значение `2019` из поля `hh`.
4. Запрос трансформируется:
    ```
    GET /api/vacanciesProxy?area=2019
    ```
5. Пользователь получает вакансии в пределах Московской области.

**Пример 3**:
1. Запрос:
    ```
    GET /api/vacanciesProxy?area=place~id~~1
    X-Target-Url: https://api.hh.ru/vacancies 
    X-Target-Source: hh
    ```
2. Точный поиск по общим id находит объект с `id` = `1` (Москва) и извлекает id `hh` = `1`.
3. Запрос трансформируется:
    ```
    GET /api/vacanciesProxy?area=1
    ```
4. Пользователь получает вакансии только из Москвы.

### Переменные окружения (`.env`)

Настройки сервера, безопасности, прокси и интеграций. Некоторые поля можно оставить по умолчанию, но для продакшена их желательно переопределить.

#### Общие

- `PORT` — порт, на котором запустится сервер (`7000` по умолчанию).
- `API_URL` — базовый адрес сервера, используется в ссылках активации (`http://localhost:7000` по умолчанию).
- `CLIENT_URL` — адрес клиентского приложения, используется при редиректе (`http://localhost:5173` по умолчанию).

#### База данных

- `DB_URL` — строка подключения к MongoDB. Можно получить в [MongoDB Atlas](https://www.mongodb.com/atlas/database).

#### Авторизация

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — секреты для подписи JWT-токенов. Обязательно переопределить в продакшене.

#### Почта (SMTP)

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` — SMTP-параметры для отправки писем активации.

#### Ограничения и защита

- `ALLOWED_CLIENTS` — список адресов, с которых разрешены запросы (`Referer` / `Origin`) к серверу. Указывается через запятую. (`http://localhost:5173,http://192.168.0.195:5173` по умолчанию).
- `ALLOWED_TARGETS` — разрешённые домены для проксирования через `/api/vacanciesProxy` (`api.superjob.ru,api.hh.ru,opendata.trudvsem.ru` по умолчанию).
- `RESEND_COOLDOWN` — минимальный интервал между отправками писем активации одному пользователю (в мс, `60000` по умолчанию).
- `VACANCIES_LIMIT_WINDOW` — окно времени для лимита запросов к внешним API (в мс, `300000` по умолчанию).
- `VACANCIES_LIMIT_MAX` — максимальное количество запросов к внешним API в указанном окне (`200` по умолчанию).

### Безопасность

- **Валидация данных** — `express-validator` проверяет email и пароль на этапе регистрации.
- **Ограничение доверенных источников** — кастомный `refererMiddleware` запрещает любые запросы с `Referer` или `Origin`, отсутствующих в `ALLOWED_CLIENTS`.
- **CORS** — настроен с параметрами `credentials: true`, `origin` — только whitelisted.
- **CSRF-защита** — `refreshToken` хранится в `httpOnly + Secure` куки, исключая доступ из JS.
- **Ограничение проксирования** — `targetUrlMiddleware` пропускает запросы только на домены из `ALLOWED_TARGETS`.
- **Ограничение частоты запросов** — `express-rate-limit` ограничивает обращения к внешним API.
- **Пароли** — хэшируются с помощью `bcrypt`, соль по умолчанию (12 раундов).
- **Защита от злоупотреблений при регистрации** — кулдаун на отправку писем активации (`nextResendAt`), хранится в БД и сверяется на сервере.
- **Обновление токенов с ack** — механизм от потери `refreshToken`: токен сначала сохраняется как `pendingRefreshToken`, а потом подтверждается клиентом через `/refresh/ack`.
- **JWT** — токены подписаны ключами из `.env`, валидация и генерация реализованы вручную (`jsonwebtoken`).
- **Централизованная обработка ошибок** — все исключения обрабатываются `errorMiddleware`, в том числе кастомные ошибки из `ApiError`.

## Установка и запуск

0. Перед началом убедитесь, что у вас есть:
    - Node.js версии **18 и выше** — [скачать с nodejs.org](https://nodejs.org/)
    - Git — [скачать с git-scm.com](https://git-scm.com/)
    - MongoDB Atlas аккаунт — [создать на mongodb.com](https://www.mongodb.com/atlas/database)
      > ⚠️ Локальная установка MongoDB **не требуется**! Вы можете использовать облачный хостинг MongoDB Atlas (есть бесплатный тариф).
1. Клонируйте репозиторий: `git clone https://github.com/cptblackmore/jobtracker-server`
2. Перейдите в него: `cd jobtracker-server`
3. Установите зависимости: `npm install`
4. Создайте файл с переменными окружения: `cp .env.example .env`
5. Откройте `.env` и заполните поля:
    - `DB_URL` (**обязательно**) — скопируйте ссылку для подключения к кластеру на MongoDB Atlas и укажите свой пароль вместо `<db_password>`
    - `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` (опционально) — любые строки. В рамках тестирования можно оставить по умолчанию.
    - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` (опционально) — данные SMTP вашего почтового сервиса. Нужны только для отправки писем активации новым пользователям.
    - `CLIENT_URL` и `ALLOWED_CLIENTS` (опционально) — если клиентская часть хостится на другом адресе (не `http://localhost:5173`), то нужно указать его в `CLIENT_URL`, а в `ALLOWED_CLIENTS` добавить после запятой.
    - Остальные поля можно оставить по умолчанию (см. [подробности](#переменные-окружения-env), если хотите их изменить).
6. Запустите сервер: `npm run start` (или `npm run dev`, если нужен nodemon).

### Пример готового `.env`

```env
PORT=7000
API_URL=http://localhost:7000
CLIENT_URL=http://localhost:5173

# DB
DB_URL=mongodb+srv://root:123456@cluster0.example.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_ACCESS_SECRET=youraccesssecretkey
JWT_REFRESH_SECRET=yourrefreshsecretkey

# SMTP
MAIL_HOST=smtp.yandex.ru
MAIL_PORT=465
MAIL_USER=example@ya.ru
MAIL_PASS=fjqclswfuhcreybl

# Whitelist
ALLOWED_CLIENTS=http://localhost:5173,http://192.168.0.195:5173
ALLOWED_TARGETS=api.superjob.ru,api.hh.ru,opendata.trudvsem.ru

# Other
RESEND_COOLDOWN=60000
VACANCIES_LIMIT_WINDOW=300000
VACANCIES_LIMIT_MAX=200
```

## Примеры API-запросов

<details>
  <summary><strong>Развернуть/свернуть примеры</strong></summary>

- [Регистрация](#регистрация)
- [Повторная отправка письма](#повторная-отправка-письма)
- [Активация](#активация)
- [Логин](#логин)
- [Обновление токенов (refresh)](#обновление-токенов-refresh)
- [Выход из аккаунта](#выход-из-аккаунта-1)
- [Подтверждение о получении refresh токена (acknowledge)](#подтверждение-о-получении-refresh-токена-acknowledge)
- [Получение избранного](#получение-избранного)
- [Синхронизация избранного](#синхронизация-избранного)
- [Обновление избранного](#обновление-избранного)
- [Поиск местоположений](#поиск-местоположений-1)
- [Запрос к внешним API](#запрос-к-внешним-api)
- [Поиск вакансий по местоположению](#поиск-вакансий-по-местоположению)

### Регистрация

**Запрос**:
```
POST /api/registration
Content-Type: application/json
```
**Тело запроса**:
```json
{
  "email": "user@mail.com",
  "password": "123456"
}
```
**Ответ**: 
```
Set-Cookie: refreshToken=<new_refresh_token>; HttpOnly; Secure; SameSite=none
```
```json
{
  "accessToken": "<new_access_token>",
  "userDto": {
      "email": "user@mail.com",
      "id": "6818ab3a90a937ec7651de13",
      "isActivated": false,
      "nextResendAt": "2025-05-05T12:13:42.287Z"
  }
}
```
> После регистрации по указанной почте отправится письмо со ссылкой для активации аккаунта.

### Повторная отправка письма

**Запрос**:
```
GET /api/resend
Cookie: refreshToken=<refresh_token>
```

**Ответ**:
```json
{
  "userDto": {
    "email": "user@mail.com",
    "id": "6818ab3a90a937ec7651de13",
    "isActivated": false,
    "nextResendAt": "2025-05-05T12:37:32.107Z"
  }
}
```
> Повторная отправка письма вновь будет доступна по временной метке в `nextResendAt`, которая высчитывается по кулдауну, указанному в переменной окружения `RESEND_COOLDOWN`.

### Активация

**Запрос**:
```
GET /api/activate/:link
```
> При активации происходит редирект по адресу, указанному в переменной окружения `CLIENT_URL`.

### Логин

**Запрос**:
```
POST /api/login
Content-Type: application/json
```

**Тело запроса**:
```json
{
  "email": "user@mail.com",
  "password": "123456"
}
```

**Ответ**:
```
Set-Cookie: refreshToken=<new_refresh_token>; HttpOnly; Secure; SameSite=none
```
```json
{
  "accessToken": "<new_access_token>",
  "userDto": {
      "email": "user@mail.com",
      "id": "6818ab3a90a937ec7651de13",
      "isActivated": true
  }
}
```
> refreshToken приходит в HttpOnly-cookie, а не в теле ответа.

### Обновление токенов (refresh)

**Запрос**:

```
GET /api/refresh
Cookie: refreshToken=<refresh_token>
```

**Ответ**:
```
Set-Cookie: refreshToken=<new_refresh_token>; HttpOnly; Secure; SameSite=none
```
```json
{
  "accessToken": "<new_access_token>",
  "userDto": {
    "email": "user@mail.com",
    "id": "6818ab3a90a937ec7651de13",
    "isActivated": true
  }
}
```

### Подтверждение о получении refresh-токена (acknowledge)

**Запрос**:

```
POST /api/refresh/ack
Cookie: refreshToken=<refresh_token>
```

**Ответ**:

```json
{
  "message": "New refresh token saved successfully"
}
```

### Выход из аккаунта

**Запрос**:

```
POST /api/logout
Cookie: refreshToken=<refresh_token>
```

**Ответ**:
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=none; Max-Age=0
```
```json
{
  "message": "Logged out successfully"
}
```
> refreshToken удаляется из httpOnly-cookie.

### Получение избранного

**Запрос**:

```
GET /api/favorites
Authorization: Bearer <access_token>
```

**Ответ**:

```json
[
  {
    "favorites": [
      "sj_50271096",
      "hh_118530618",
      "tv_1036301104069_deadda88-f045-11ef-9917-d549be31d974"
    ],
    "id": "6818ab3b90a937ec7651de15"
  }
]
```

### Синхронизация избранного

**Запрос**:

```
POST /api/favorites
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Тело запроса**:

```json
{
  "favorites": [
    "sj_49640647",
    "hh_118530618"
  ]
}
```

**Ответ**:

```json
{
  "favorites": [
    "sj_50271096",
    "hh_118530618",
    "tv_1036301104069_deadda88-f045-11ef-9917-d549be31d974",
    "sj_49640647"
  ],
  "id": "6818ab3b90a937ec7651de15"
}
```

### Обновление избранного

**Запрос**:

```
PUT /api/favorites
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Тело запроса**:

```json
{
  "favorites": [
    "hh_117662661"
  ]
}
```

**Ответ**:

```json
{
  "favorites": [
    "hh_117662661"
  ],
  "id": "6818ab3b90a937ec7651de15"
}
```

### Поиск местоположений

**Запрос**:

```
GET /api/places?place=москв
```

**Ответ**:

```json
[
  {
    "id": "1",
    "name": "Москва",
    "type": "city"
  },
  {
    "id": "2095",
    "name": "Троицк (Москва)",
    "type": "city"
  },
  {
    "id": "4711",
    "name": "Москаленки",
    "type": "city"
  },
  {
    "id": "8164",
    "name": "Москаленский",
    "type": "city"
  },
  {
    "id": "7494",
    "name": "Москальво",
    "type": "city"
  }
]
```

### Запрос к внешним API

**Запрос**:

```
GET /api/vacanciesProxy?text=frontend
x-target-url: https://api.hh.ru/vacancies
```

**Ответ**: зависит от источника (возвращается как есть, без адаптации):

```json
{
  "items": [
    {
      "id": "120247974",
      "premium": false,
      "name": "Разработчик React",
      "department": null,
      "has_test": false,
      "response_letter_required": false,
      "area": {
        "id": "1",
        "name": "Москва",
        "url": "https://api.hh.ru/areas/1"
      },
      "salary": null,
      "salary_range": null,
      "type": {
        "id": "open",
        "name": "Открытая"
      },
  ...
```

> Прокси запросы разрешены только по доменам, указанным в `ALLOWED_TARGETS` в `.env`. При попытке использовать другой адрес вернётся 403.

### Поиск вакансий по местоположению

**Запрос**:

```
GET /api/vacanciesProxy?text=frontend&area=place~name~~Санкт
x-target-url: https://api.hh.ru/vacancies
x-target-source: hh
```

**Ответ**: зависит от источника (возвращается как есть, без адаптации):

```json
{
  "items": [
    {
      "id": "119932258",
      "premium": false,
      "name": "Продавец-консультант (бьюти-продукции)",
      "department": null,
      "has_test": false,
      "response_letter_required": false,
      "area": {
        "id": "2",
        "name": "Санкт-Петербург",
        "url": "https://api.hh.ru/areas/2"
      },
  ...
```

> Заголовок `X-Target-Source` обязателен для поиска id местоположений, соответствующих источнику. А маркер `place` необходим для подстановки найденного id в запрос.

</details>

## Демо

Сервер развёрнут по адресу:

> [https://jobtracker-server.onrender.com](https://jobtracker-server.onrender.com)

#### Проверка в реальных условиях

Сервер работает вместе с клиентом [JobTracker](https://github.com/cptblackmore/jobtracker), развёрнутым по адресу: 
> [https://cptblackmore-jobtracker.netlify.app](https://cptblackmore-jobtracker.netlify.app)

#### Проверка вручную

Чтобы отправить запрос напрямую (например, в Postman), обратите внимание:

- Во **всех** запросах, кроме `/api/activate/:link`, нужно добавить заголовок:
`Referer: https://cptblackmore-jobtracker.netlify.app`
  > ⚠️ **Сервер отклонит любые запросы с неизвестных `Referer` или `Origin`**, не указанных в `ALLOWED_CLIENTS` в `.env`.
- К запросам `GET`/`POST`/`PUT` `/api/favorites` нужно добавить заголовок:
`Authorization: Bearer <access_token>`
  > Избранное на сервере доступно только авторизованным пользователям. Сам accessToken можно получить в ответах при регистрации/логине/refresh (см. [примеры](#примеры-api-запросов)).
- В `GET /api/vacanciesProxy` нужно добавить заголовки:
  - `X-Target-Url: <url>` — адрес внешнего API. Разрешены только адреса, совпадающие с доменами, указанными в `ALLOWED_TARGETS` в `.env`. Например:
`https://api.superjob.ru/vacancies`, `https://api.hh.ru/vacancies`, `https://opendata.trudvsem.ru/vacancies`
  - `X-Target-Source: <source>` (опционально) — сокращённое название источника внешнего API, используемое при наличии маркера `place` (см. [примеры](#примеры-api-запросов), раздел **Поиск вакансий по местоположению**). Например: `sj`, `hh`, `tv`.

## Author

**Victor** *aka* **captain_blackmore**
- [Telegram](https://t.me/captain_blackmore)
- [Github](https://github.com/cptblackmore)

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/cptblackmore/jobtracker-server/blob/main/LICENSE) file for details.