# Vaidya Assist — Web Frontend

React frontend for doctors and clinic staff.

## Stack

- React + Redux Toolkit
- Axios for API calls
- MUI for components (verify current version in `package.json`)

## Conventions

- API base URL likely configured via env; requests attach `Authorization: Bearer <token>`.
- Auth state managed in Redux; token stored after login.

## Agent chat integration (Module 6, future)

A chat panel will be added that calls the `agent-service` API. Expectations:
- Send the user's JWT to `agent-service`.
- Render streamed or turn-based agent responses.
- Handle tool-result cards (appointments, low-stock lists) consistently with existing UI patterns.

For full project context, see the project-level memory files.
