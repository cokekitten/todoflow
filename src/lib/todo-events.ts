export const TODOS_CHANGED_EVENT = "todoflow:todos-changed";

export function notifyTodosChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(TODOS_CHANGED_EVENT));
}
