# Security Policy

MongoDB WebGUI is an administrative tool. Treat it like a database admin panel.

## Recommended deployment

- Run behind HTTPS.
- Bind Next.js to `127.0.0.1`, not a public interface.
- Use a reverse proxy with rate limiting.
- Use a MongoDB user with minimum required privileges.
- Prefer `MONGO_GUI_MODE=readonly` when write access is not required.
- Keep dependencies updated.

## Reporting vulnerabilities

Please open a private security advisory on GitHub if available, or contact the maintainer through the support channel listed in the project repository.

Do not publish exploit details publicly before a fix is available.
