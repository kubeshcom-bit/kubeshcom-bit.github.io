# Rufarm → приложение для Google Play (всё делается с телефона)

## Что в папке
| Файл | Куда |
|---|---|
| index.html, sw.js, manifest.webmanifest, privacy.html, native.js | в репозиторий GitHub (шаг 2) |
| icon-only.png, icon-foreground.png, icon-background.png | в репозиторий (иконка приложения; потом замените на свою, 1024×1024) |
| workflow-keystore.yml | создать файл `.github/workflows/keystore.yml` (шаг 3) |
| workflow-android.yml | создать файл `.github/workflows/android.yml` (шаг 3) |

## Шаг 1. GitHub
github.com → Sign up → New repository → имя `rufarm` → **Private** → Create.

## Шаг 2. Загрузить файлы
Add file → Upload files → выберите 8 файлов: index.html, sw.js, manifest.webmanifest, privacy.html, native.js, icon-only.png, icon-foreground.png, icon-background.png
(по желанию добавьте свои icon-192.png, icon-512.png, icon-maskable-512.png с сайта) → Commit changes.

## Шаг 3. Два файла сборки
Add file → **Create new file**. В поле имени введите `.github/workflows/keystore.yml` (слэши создадут папки). Откройте workflow-keystore.yml, скопируйте всё содержимое и вставьте → Commit.
То же для `.github/workflows/android.yml` и содержимого workflow-android.yml.

## Шаг 4. Ключ подписи (один раз)
Вкладка **Actions** → **Create upload key** → Run workflow. Через минуту откройте запуск → внизу **Artifacts** → `upload-key` → скачайте ZIP и распакуйте.
Settings → Secrets and variables → Actions → New repository secret. Создайте 4 секрета:
- `KEYSTORE_BASE64` — весь текст из KEYSTORE_BASE64.txt
- `KS_PASS` и `KEY_PASS` — пароль из PASSWORDS.txt (там оба одинаковые)
- `KEY_ALIAS` — слово `upload`

Сохраните upload-keystore.jks и PASSWORDS.txt в надёжном месте (облако, почта себе). Без ключа нельзя выпускать обновления. После этого удалите artifact `upload-key` в GitHub.

## Шаг 5. Сборка
Actions → **Build Android AAB** → Run workflow. Ждать 10–15 минут. Зелёная галочка → внизу Artifacts → `rufarm-aab` → скачать ZIP → внутри `app-release.aab`.
Красный крест? Откройте запуск, нажмите на красный шаг, скопируйте последние ~30 строк и пришлите мне.

## Шаг 6. Google Play Console (когда аккаунт подтвердят)
1. Create app: название Rufarm, Игра, Бесплатное.
2. Testing → **Closed testing** → Create track → Create new release → загрузите app-release.aab (подпись Play App Signing — оставьте по умолчанию).
3. Testers: список email (минимум 12 человек) → Save → отправьте на проверку. Тестеры принимают приглашение и держат приложение 14 дней подряд.
4. App content: Privacy policy (ссылка на privacy.html на вашем сайте), Ads = Да, Data safety, Content rating, Target audience.
5. Тексты для карточки — в store-listing.md.

## Шаг 7. Настоящая реклама (позже)
Сейчас в приложении ТЕСТОВАЯ реклама Google, ей можно пользоваться без риска.
Когда AdMob одобрит: AdMob → Apps → Add app (Android) → получите App ID и два ID блоков (баннер и видео за награду). Затем:
- в workflow-android.yml замените `ADMOB_APP_ID` на свой;
- в native.js вставьте свои ID в `real: ""` и поставьте `TEST = false`;
- загрузите файлы в GitHub заново и запустите сборку (номер версии растёт сам).
Во время закрытого тестирования оставляйте тестовую рекламу: клики тестеров по настоящей рекламе могут привести к блокировке AdMob.

## Обновить игру
Замените файлы в репозитории (Upload files перезапишет) → снова Build Android AAB → загрузите новый .aab в Play Console.
