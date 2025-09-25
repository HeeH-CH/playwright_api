# playwright_api
api for playwright

## Stealth Mode
- Default behaviour uses standard Playwright Chromium launch.
- Set the `DEFAULT_STEALTH_MODE=true` (or `STEALTH_MODE=true`) environment variable before starting the server to enable stealth globally.
- Override per session by including `"stealth": true` in the `/browser/launch` request body.
- Stealth is only supported for Chromium; other browsers ignore the flag and run in standard mode.
