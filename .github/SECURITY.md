# Security policy

## Supported versions

Only the latest version of the game receives updates (new features, bug fixes and security patches).
Always play the most recent version available on the `main` branch.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a vulnerability

If you find a security problem (a way to forge biomass, force an evolution, bypass the room captcha
or abuse the match server), please **do not open a public issue**.

Use **[GitHub private vulnerability reporting](https://github.com/Emrecan45/morphz-io/security/advisories/new)**
instead, so the flaw reaches me safely.

You will get a quick reply confirming the report is being handled, and a fix will be published as
soon as possible.

## Scope

Matches run on an authoritative server: a Cloudflare Worker routes players into rooms and each room
is a Durable Object that owns positions, damage and death. The client predicts and reconciles but
never decides what happened. Anything that lets a client make the server accept a state it did not
compute is in scope.
