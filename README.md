# Bastuguiden

A Swedish, sauna-only SEO/marketplace experiment built on Nuxt 4. See
[`AGENTS.md`](./AGENTS.md) for the full architecture overview, folder map,
and links to deeper docs (`docs/ai/`) and architecture decision records
(`docs/adr/`).

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more about the framework itself.

## Setup

This repo pins its Node version via `.nvmrc` — run `nvm use` before installing.

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
