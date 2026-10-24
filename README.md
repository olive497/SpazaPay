# SpazaPay

Open Payments (Interledger) solution for spaza shops. Built for the Cape Town Software Development Meetup - Open Payments Hackathon.

## Repository structure

| Folder | Owner | Stack |
|---|---|---|
| `backend/` | Anold | Java 17, Spring Boot, Spring Security (JWT), PostgreSQL |
| `frontend/` | _frontend dev_ | _React / Angular_ |
| `security-tests/` | _security & testing dev_ | API tests, security checks |
| `docs/` | everyone | Diagrams, API notes, submission material |

## Git workflow

- `main` is protected by convention: **no direct pushes** after the initial setup. Open a pull request instead.
- One branch per area:
  - `feature/backend`
  - `feature/frontend`
  - `feature/security-tests`
- Only edit files inside your own folder. If you need a change in someone else's folder, ask them.
- Small, frequent commits. Pull `main` into your branch before opening a PR.

```bash
git clone https://github.com/olive497/SpazaPay.git
cd SpazaPay
git checkout -b feature/<your-area>
# work, then:
git add .
git commit -m "Describe the change"
git push -u origin feature/<your-area>
```

## Running the backend

```bash
cd backend
./mvnw spring-boot:run
```

## API contract (frontend <-> backend)

Base URL (local): `http://localhost:8080`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | none | Register a shop owner |
| POST | `/api/auth/login` | none | Login, returns JWT |
| GET | `/api/shops/me` | Bearer token | Current shop details |

Send the token as `Authorization: Bearer <token>`.

## Secrets

Never commit passwords, JWT secrets or Open Payments keys. Use environment variables or an untracked `application-local.properties`.
