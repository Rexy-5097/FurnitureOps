# Contributing to FurnitureOps

Thank you for your interest in contributing to FurnitureOps! We maintain high standards for code quality, security, and performance. Please review this guide before submitting a Pull Request.

## Development Process

1.  **Fork & Clone**: Fork the repository and clone it locally.
2.  **Branching**: Create a new branch for your feature or fix.
    - `feat/my-feature`
    - `fix/bug-id`
    - `refactor/cleanup`
3.  **Dependencies**: We use `pnpm` exclusively.
    ```bash
    pnpm install
    ```
4.  **Local Development**:
    ```bash
    pnpm dev
    ```

## Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Pull Request Process

1.  Ensure all tests pass locally.
2.  Update documentation if applicable.
3.  Open a Pull Request against the `main` branch.
4.  Fill out the Pull Request Template completely.
5.  Wait for code review from the Maintainers.

## Code Quality Standards

- **TypeScript**: Strict mode must be enabled. No `any` types.
- **Logging**: Use the structured logger (`src/lib/logger.ts`), never `console.log`.
- **Testing**: New features must include unit or integration tests.
- **Security**: Always validate inputs with Zod. Never trust client-side data.
