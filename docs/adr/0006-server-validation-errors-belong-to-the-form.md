# Server validation errors belong to the form

When a form's mutation fails with `ErrorCode.VALIDATION_ERROR` (422), the form shows the
feedback; route and feature boundaries never see it, because mutations do not throw to them. Each
`details` entry whose path is `["body", …]` and names a registered field is shown under that field
with the server's message, and focus moves to the first such field in render order. If every
detail matched, there is no toast. If any detail is unmatched, or there are no details, the
matched ones still show inline and the form's destructive toast shows one fixed message: "We
couldn't accept this form. Please refresh the page and try again." Every other error code keeps
the toast with the normalized error's message.

The forms validate with the same body schemas the server uses, so a server rejection mostly means
the client and server disagree, for example a bundle cached from before a deploy that tightened a
schema. Before this, the shopper saw "Validation failed: 1 error(s)" with no field marked.
`applyServerErrors` in `apps/client/src/lib/errors/form-errors.ts` implements the split for the
login, signup and checkout forms.

## Considered options

A toast even when every detail matched was rejected: it repeats the inline feedback, and the marked
fields and the focus move already tell the shopper what to fix.

Showing unmatched messages verbatim was rejected: they are written for developers
(`Unrecognized key: "role"`), and an unmatched detail almost always means the client is out of
date, which a refresh fixes.

Writing the errors under TanStack Form's `onServer` error key was rejected: an `onServer` field
error stays when the shopper edits the field. The `onSubmit` key is cleared by the field's next
non-submit validation, so a server error disappears on edit like a client error does, and the next
submit reruns the schema and resets it.

## Consequences

`applyServerErrors` is the only reader of `AppError.details` in the client. A new form that
submits a body gets field-level server errors by calling it from its mutation's `onError`, as
long as each input's `id` is its field name, which is what the focus move looks up, and the field
renders its errors. The checkout payment radios use other ids and render no error, so a detail on
`paymentMethod` counts as matched but shows nothing. A server change that moves a field's path,
or reports a field the form does not register, shows up to shoppers as the fixed refresh message
rather than as a field error.
