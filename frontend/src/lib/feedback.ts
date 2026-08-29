import { notifications } from "@mantine/notifications";
import { ApiError } from "./api.ts";

export function showError(err: unknown, title = "Eroare") {
  const isApi = err instanceof ApiError;
  notifications.show({
    color: "red",
    title: isApi && err.status === 409 ? "Operație blocată" : title,
    message: err instanceof Error ? err.message : "A apărut o eroare necunoscută",
    autoClose: 8000,
  });
}

export function showSaved(message = "Salvat") {
  notifications.show({ color: "green", message });
}

/**
 * A form that failed client-side validation. Pass it as the second argument to
 * `form.onSubmit` — Mantine calls it with the errors, which it ignores, since
 * the offending inputs are already marked in red on the page itself.
 */
export function notifyIncomplete() {
  notifications.show({
    color: "red",
    message: "Au rămas câmpuri care trebuie completate",
  });
}
