import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  gapsForMeetings,
  SAMPLE_MEETINGS,
  type Gap,
  type Meeting,
  type Term,
} from "./model";

const STORAGE_KEY = "gapwise.mobile.timetable.v1";
const STORAGE_VERSION = 1;

type PersistedTimetable = {
  version: 1;
  meetings: Meeting[];
  activeTerm: Term;
};

type TimetableState = {
  meetings: Meeting[];
  gaps: Gap[];
  activeTerm: Term;
  hydrated: boolean;
  persistenceError: string | null;
  loadSample: () => void;
  clear: () => void;
  setActiveTerm: (term: Term) => void;
};

const TimetableContext = createContext<TimetableState | null>(null);

function isPersistedTimetable(value: unknown): value is PersistedTimetable {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedTimetable>;
  return (
    candidate.version === STORAGE_VERSION &&
    Array.isArray(candidate.meetings) &&
    ["Fall", "Winter", "Summer"].includes(String(candidate.activeTerm))
  );
}

export function TimetableProvider({ children }: PropsWithChildren) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeTerm, setActiveTermState] = useState<Term>("Fall");
  const [hydrated, setHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (!isPersistedTimetable(parsed))
            throw new Error("Saved timetable schema is unsupported.");
          setMeetings(parsed.meetings);
          setActiveTermState(parsed.activeTerm);
        }
        setPersistenceEnabled(true);
      })
      .catch(() => {
        if (!cancelled) {
          setPersistenceEnabled(false);
          setPersistenceError(
            "Saved timetable could not be restored. Gapwise will not overwrite it unless you make a new timetable change.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !persistenceEnabled) return;
    const payload: PersistedTimetable = {
      version: STORAGE_VERSION,
      meetings,
      activeTerm,
    };
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(payload), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
      .then(() => setPersistenceError(null))
      .catch(() =>
        setPersistenceError(
          "Changes are visible now but could not be saved on this device.",
        ),
      );
  }, [activeTerm, hydrated, meetings, persistenceEnabled]);

  const enablePersistenceForExplicitChange = useCallback(() => {
    if (!persistenceEnabled && hydrated) setPersistenceEnabled(true);
  }, [hydrated, persistenceEnabled]);

  const loadSample = useCallback(() => {
    enablePersistenceForExplicitChange();
    setMeetings(SAMPLE_MEETINGS);
    setActiveTermState("Fall");
  }, [enablePersistenceForExplicitChange]);

  const clear = useCallback(() => {
    enablePersistenceForExplicitChange();
    setMeetings([]);
  }, [enablePersistenceForExplicitChange]);

  const setActiveTerm = useCallback((term: Term) => {
    // A term-tab tap is only a view change. After a failed restore it must never
    // enable writes that could replace recoverable persisted meetings with defaults.
    setActiveTermState(term);
  }, []);

  const value = useMemo<TimetableState>(
    () => ({
      meetings,
      gaps: gapsForMeetings(meetings),
      activeTerm,
      hydrated,
      persistenceError,
      loadSample,
      clear,
      setActiveTerm,
    }),
    [
      activeTerm,
      clear,
      hydrated,
      loadSample,
      meetings,
      persistenceError,
      setActiveTerm,
    ],
  );

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const value = useContext(TimetableContext);
  if (!value)
    throw new Error("useTimetable must be used inside TimetableProvider");
  return value;
}
