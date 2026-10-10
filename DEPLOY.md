# Deploying to Fly.io

This app is a static PWA served by nginx inside a small Docker image. There's
no backend/database — Fly.io is just hosting here, same as any static site
host would, but it's what you're already using for your other projects.

## First time

From this project's folder, with `flyctl` installed and already logged in
(same as your other two apps):

```sh
fly launch --no-deploy
```

This detects the `Dockerfile` and `fly.toml` already in the project. It'll
ask you to confirm or rename the app (edit the `app = "..."` line in
`fly.toml` first, or let `fly launch` rename it interactively — Fly app
names are global, so `math-app-change-me` needs to become something unique)
and pick an organization. Say no to adding a Postgres/Redis database — this
app doesn't need one.

Then deploy:

```sh
fly deploy
```

Fly will print the app's URL (something like `https://your-app-name.fly.dev`)
once it's up. Open that on your iPad/iPhone in Safari, then "Add to Home
Screen" to install it as a PWA.

## Every deploy after that

```sh
fly deploy
```

That's it — it rebuilds the Docker image from the current source and
replaces the running version.

## Notes

- `auto_stop_machines`/`min_machines_running = 0` in `fly.toml` means the
  app can scale to zero when nobody's using it and spin back up on the next
  request (with a brief cold-start delay) — fine for a one-family app, and
  keeps it cheap. Bump `min_machines_running` to `1` later if the cold start
  ever becomes annoying.
- All of his progress is stored in the browser's IndexedDB on whichever
  device he's using (see the progression doc) — Fly.io only ever serves the
  static app shell, never his data.
