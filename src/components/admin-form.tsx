"use client";
import { cloneElement, createContext, isValidElement, useActionState, useContext, type ReactNode } from "react";
import { lookupAccess, updateAccess } from "@/app/admin/actions";
import type { AdminFormState } from "@/lib/admin/types";

const Errors = createContext<Record<string, string>>({});
export function AdminField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const errors = useContext(Errors);
  const control = isValidElement<{ name?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children) ? children : null;
  const error = control?.props.name ? errors[control.props.name] : undefined;
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
    {control ? cloneElement(control, { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined }) : children}
    {error ? <p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p> : null}
  </div>;
}

export function AdminForm({ children, operation, label, lookup = false, fields = {} }: {
  children: ReactNode; operation?: string; label: string; lookup?: boolean; fields?: Record<string, string>;
}) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(lookup ? lookupAccess : updateAccess, {});
  return <form action={action} noValidate onReset={event => event.preventDefault()} className="space-y-4">
    {operation ? <input type="hidden" name="operation" value={operation} /> : null}
    {Object.entries(fields).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
    {state.error || Object.keys(state.errors ?? {}).length ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
      {state.error || "Periksa isian berikut:"}
      {state.errors ? <ul className="mt-2 list-inside list-disc">{Object.entries(state.errors).map(([key, error]) => <li key={key}>{error}</li>)}</ul> : null}
    </div> : null}
    <Errors value={state.errors ?? {}}><fieldset disabled={pending} className="space-y-4 disabled:opacity-60"><legend className="sr-only">{label}</legend>{children}
      <button type="submit" className="min-h-11 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait">{pending ? "Memproses…" : label}</button>
    </fieldset></Errors>
  </form>;
}
