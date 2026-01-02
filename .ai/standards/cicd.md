# CI/CD & DevOps Standards

> CI/CD and containerization best practices for the GSD project.
> Referenced from main [CLAUDE.md](../../CLAUDE.md)

## CI/CD Best Practices (GitHub Actions)

- Check if `package.json` exists in project root and summarize key scripts
- Check if `.nvmrc` exists in project root
- Check if `.env.example` exists in project root to identify key environment variables
- Always use terminal command: `git branch -a | cat` to verify whether we use `main` or `master` branch
- Always use `env:` variables and secrets attached to jobs instead of global workflows
- Always use `npm ci` for Node-based dependency setup
- Extract common steps into composite actions in separate files
- For each public action always use the most up-to-date version (use only major version)

## DevOps & Containerization

### Containerization (Docker)

- Use multi-stage builds to create smaller production images
- Use non-root users in containers for better security

### Deployment

- GitHub Actions workflow: lint, typecheck, test, build
- Deploy: Containerized (Docker) for both frontend and backend services
- Postgres: managed service or self-hosted
