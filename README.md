# Next.js Full-Stack Starter

A well-structured Next.js app using the App Router, TypeScript, Tailwind CSS, and a clean separation between frontend feature code and backend services.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- ESLint

## Project structure

```text
src/
	app/
		api/
			health/route.ts        # Backend API route
		layout.tsx
		page.tsx                 # Frontend entry page
	features/
		health/
			components/
				health-panel.tsx     # Frontend UI + state
	lib/
		client/
			api-client.ts          # Frontend API calls
		server/
			services/
				health-service.ts    # Backend business logic
		types/
			health.ts              # Shared API types
```

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

## Extend this starter

- Add new domain features under `src/features/<feature-name>`
- Add backend services in `src/lib/server/services`
- Keep API route handlers thin and delegate logic to services
- Add shared response/request types to `src/lib/types`
