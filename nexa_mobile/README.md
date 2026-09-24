# nexa_mobile — NEXA Troli (Android tablet)

Flutter client for the PIC on the needle trolley. Rules: `CLAUDE.md` (this folder). Folder layout: `../Docs/22-Mobile-Folder-Structure.md`. Backend contract: `../Docs/architecture/backend-mobile-contract-matrix.md`.

## Environments

Every run and build takes one environment file (`nexa_mobile/CLAUDE.md` §2):

| File | `APP_ENV` | `API_BASE_URL` |
|---|---|---|
| `config/dev.json` | `dev` | `http://192.168.43.175:3100/api/v1` (LAN backend; the IP may change — edit the file) |
| `config/staging.json` | `staging` | placeholder `https://api-uat.example.invalid/api/v1` — set the real host |
| `config/prod.json` | `prod` | placeholder `https://api.example.invalid/api/v1` — set the real host |

Only `dev` may use plain `http`: the app refuses to start otherwise, and `android/app/build.gradle.kts` enables cleartext traffic (network security config) for `APP_ENV=dev` only.

```sh
flutter pub get
dart run build_runner build          # Drift code generation (after changing tables)

flutter run   --dart-define-from-file=config/dev.json
flutter build apk --debug --dart-define-from-file=config/dev.json
```

A build without `--dart-define-from-file` starts on a "configuration invalid" screen.

## Tests

```sh
flutter analyze
flutter test                                   # unit + widget
flutter test integration_test -d <android-id>  # end-to-end, needs a device/emulator
```

## First launch on a tablet

1. WebApps → Administration → Devices → Details shows the device QR (active devices only).
2. The tablet scans it (or the UUID is typed in manually), then the PIC logs in.
3. The app calls `GET /mobile/bootstrap` straight after login; an inactive or revoked device is blocked there.
