# User soft deletion

The user service now relies on the `active` flag in the user Prisma model to control access without removing records from the database.

## Behaviors

- Authentication rejects inactive users in both credential and social flows.
- API consumers receive the `active` property for each user and can toggle it via `PATCH /api/users/:id`.
- The `DELETE /api/users/:id` endpoint performs a soft delete by setting `active = false` and clearing active sessions.

## Admin UI

- Backoffice pages display the user status and allow administrators to deactivate or reactivate accounts.
- The create-user form includes a toggle so inactive accounts can be staged before activation.

## Testing

- Automated tests under `tests/user-active-flag.test.js` validate the presence of the new behaviors.

