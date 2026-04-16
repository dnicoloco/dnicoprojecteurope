"use client";

import * as React from "react";

export type PersonaRole = "student" | "tutor";

export type Persona = {
  id: string;
  studentId?: "marta" | "tomas"; // which metrics record to load
  name: string;
  role: PersonaRole;
  initial: string;
  subtitle: string;
  color: string; // accent used on avatar + switcher
  avatarSrc?: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "marta",
    studentId: "marta",
    name: "Borys",
    role: "student",
    initial: "B",
    subtitle: "Learner, level B2",
    color: "#FF7AAC",
    avatarSrc: "/borys-avatar.png",
  },
];

const STORAGE_KEY = "preply:persona";

type Ctx = {
  persona: Persona;
  setPersonaId: (id: string) => void;
};

const PersonaContext = React.createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = React.useState<string>(PERSONAS[0].id);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PERSONAS.some((p) => p.id === stored)) setId(stored);
    setHydrated(true);
  }, []);

  const setPersonaId = React.useCallback((next: string) => {
    setId(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const persona =
    PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];

  const value = React.useMemo(
    () => ({ persona, setPersonaId }),
    [persona, setPersonaId],
  );

  return (
    <PersonaContext.Provider value={value}>
      <div style={hydrated ? undefined : { visibility: "hidden" }}>
        {children}
      </div>
    </PersonaContext.Provider>
  );
}

export function usePersona(): Ctx {
  const ctx = React.useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside PersonaProvider");
  return ctx;
}
