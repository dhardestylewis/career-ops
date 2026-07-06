# Custom Operating Rules

## SmartRecruiters Handling

- Treat SmartRecruiters as a high-friction, anti-bot application surface.
- Use a real, visible Chrome session with the user's normal profile first. Avoid headless probing on SmartRecruiters unless there is no other option.
- Do not open DevTools, inspect DOM repeatedly, or run rapid locator-evaluate loops on SmartRecruiters before the page has stabilized.
- Do not refresh, reopen, or retry the same SmartRecruiters application repeatedly in a tight loop. If a verification screen appears, stop and wait.
- If SmartRecruiters shows "Verification Required", "Access is temporarily restricted", a slider/challenge, or any DataDome/Cloudflare-style gate, hand control to the user instead of trying to brute-force the page.
- Never attempt to defeat or work around a verification challenge. No automation should try to bypass CAPTCHA, slider checks, or similar gates.
- Prefer a slow, single-click, single-navigation approach: open the job page, wait for the apply shell to settle, then inspect once.
- If the form is accessible after a manual verification step, continue from that exact session only. Do not start a fresh session unless the user explicitly wants that.

## General Browser Hygiene

- Avoid rapid taps or clicks on any ATS or job portal unless the page clearly needs it.
- Prefer visible browser sessions over headless ones for fragile application portals.
- When a portal begins to look suspicious, stop early and preserve the session rather than escalating the traffic.
