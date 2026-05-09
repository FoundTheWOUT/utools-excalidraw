import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import { Transition } from "@headlessui/react";

// ── external store ──────────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  leaving: boolean;
}

let toasts: ToastItem[] = [];
let listeners: Array<() => void> = [];
let nextId = 0;

function emitChange() {
  toasts = [...toasts];
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot() {
  return toasts;
}

// ── imperative API (callable from anywhere) ─────────────────────

export function toast(message: string, duration = 3000) {
  const id = nextId++;
  toasts = [...toasts, { id, message, leaving: false }];
  emitChange();

  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    emitChange();
  }, duration);
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

// ── React hook & component ──────────────────────────────────────

export function useToast() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function ToastView({ t }: { t: ToastItem }) {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(true), []);

  return (
    <Transition show={show && !t.leaving} as={Fragment}>
      <div
        className="pointer-events-auto rounded-lg bg-gray-800 px-4 py-2 text-sm text-white shadow-lg transition duration-200 data-[closed]:-translate-y-2 data-[closed]:opacity-0"
        onTransitionEnd={() => {
          if (t.leaving) removeToast(t.id);
        }}
      >
        {t.message}
      </div>
    </Transition>
  );
}

export function ToastContainer() {
  const toasts = useToast();

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastView key={t.id} t={t} />
      ))}
    </div>
  );
}
