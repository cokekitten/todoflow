export const TODOS_CHANGED_EVENT = "todoflow:todos-changed";
export const TAGS_CHANGED_EVENT = "todoflow:tags-changed";

export function notifyTodosChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(TODOS_CHANGED_EVENT));
}

export function notifyTagsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(TAGS_CHANGED_EVENT));
}
