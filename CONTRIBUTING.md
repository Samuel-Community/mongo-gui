# Contributing

Contributions are welcome.

Before opening a pull request:

1. Run `npm install`.
2. Run `npm run build`.
3. Keep destructive MongoDB actions protected by `MONGO_GUI_MODE=readonly`.
4. Do not commit `.env`, local databases, `.next`, or `node_modules`.
5. Prefer small, focused pull requests.

For new MongoDB features, include server-side validation and safe defaults.
