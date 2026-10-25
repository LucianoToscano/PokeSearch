# LT79 bridge — public Google Drive rollout and future GitHub updates

Source branch: `release/lt79-drive-bridge-github-20261024` (based on PR #51 LT79).
Release-candidate Android versionName `0.00.79`, versionCode `54282`, Application ID `com.lucianotoscano.pokesearch`.

For public stability the undocumented API QA toggle defaults **OFF**, preserving existing saved user selection. The documented site/DOM collector remains the default. API QA is opt-in and still not device-homologated. Secure sprite and catalog code are present but only used when API QA is manually chosen.

The new GitHubUpdateCenter polls stable GitHub Releases once installed. The *first transition update* is shown by the existing LT76 Drive updater, which fetches the same public `atualizacao.json` Drive file ID. After transition, official future builds must be deployed with `workflow_dispatch` approved through environment `official-updates` (manual). No Releases exist yet, so the new updater will display no GitHub update until the next release is approved.

Public Drive rollout requires, IN THIS ORDER:
1. Compile and verify bridge APK release signed with fingerprint `34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e`.
2. Upload standalone APK to the public Drive `Atualizacoes_PokeSearch` folder with Anyone-Reader permission.
3. Back up existing `atualizacao.json`; atomically update **existing file ID** with `schema=pokesearch-update-v1`, `enabled=true`, code 54282, `PokeSearch-v0.00.79-LT.apk`, APK file ID, direct canonical Drive URL, matching SHA256, `forceUpdate=false`, notes and status. Confirm Drive fetch + permissions afterward.
4. Users on LT76 must open/return to Home to check Drive; automatic notifications from GitHub only start after bridge app is installed.
5. Never publish LT79 experimental API QA as default for everyone.
6. Samsung physical installation, Pikachu, source filters and Android background notifications require real-device validation; don't label physical tests passed without evidence.

Existing public LT76 remains rollback archive. Repo main, PR #34, #49, #51 and settings preserved.
