"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { format, parse } from "date-fns";
import { MessageSquare, Phone, UserCircle, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { patientAgeFromDateOfBirth } from "./age";
import { PatientAppointmentsPanel } from "./patient-appointments-panel";
import { PatientConversationsPanel } from "./patient-conversations-panel";
import {
  PATIENT_PROFILE_SECTIONS,
  type PatientProfileSection,
} from "./patient-profile-sections";
import type {
  LongTermPanelTask,
  PatientCondition,
  PatientContactAdmin,
  PatientContactMethodPreference,
  PatientEmergencyContact,
  PatientPharmacy,
  PatientPrimaryInsurance,
  PatientProfileAggregate,
} from "./types";
import { InlineEditableText } from "./inline-editable-text";
import {
  PanelTasksSection,
  type PanelTaskToast,
} from "./panel-management-tasks";
import { usePatientPanelTasks } from "./panel-tasks-store";

function genderLabel(
  g: PatientProfileAggregate["demographics"]["gender"],
): string {
  switch (g) {
    case "female":
      return "Female";
    case "male":
      return "Male";
    case "non_binary":
      return "Non-binary";
    case "unknown":
      return "Unknown";
    case "declined":
      return "Declined to answer";
    default:
      return g;
  }
}

const CONTACT_PREFS: readonly PatientContactMethodPreference[] = [
  "phone",
  "sms",
  "email",
];

/**
 * Explicit display labels. Title-casing via `charAt(0).toUpperCase() +
 * slice(1)` produces `"Sms"` for the SMS option which reads as a typo;
 * map values to their preferred capitalization here instead.
 */
const CONTACT_PREF_LABEL: Record<PatientContactMethodPreference, string> = {
  phone: "Phone",
  sms: "SMS",
  email: "Email",
};

export type PatientProfileViewProps = {
  aggregate: PatientProfileAggregate;
  activeSection: PatientProfileSection;
  onSectionChange: (section: PatientProfileSection) => void;
  /**
   * Invoked by the in-dialog close button. The dialog shell wraps this in a
   * dirty-discard confirm so the view itself does not need to know about state.
   */
  onCloseRequest: () => void;
  className?: string;
};

export function PatientProfileView({
  aggregate,
  activeSection,
  onSectionChange,
  onCloseRequest,
  className,
}: PatientProfileViewProps) {
  const { summary, demographics, panel, contactAdmin: initialContact } =
    aggregate;
  /**
   * Contact / admin state. Edits commit per-field (no global Save) — each
   * `InlineEditableText` blur / Enter calls `setContact`, mirroring how
   * panel-management tasks commit individually. Closing the dialog discards
   * unsaved edits implicitly (matches the demo's task semantics). The dirty
   * system intentionally does NOT track this section anymore.
   */
  const [contact, setContact] = useState<PatientContactAdmin>(initialContact);
  /** Toast supports an optional action button (e.g. Undo) attached for ~6s. */
  type ToastAction = { label: string; onClick: () => void };
  type ToastState = { id: number; message: string; action?: ToastAction };
  const [toast, setToast] = useState<ToastState | null>(null);

  /* Panel tasks live in the app-wide store so edits sync with the Inbox. */
  const { tasks, setTasks } = usePatientPanelTasks(summary.patientId);

  /* Toasts auto-dismiss after ~6s when the toast carries an action (Undo),
   * 2.4s when it's a transient confirmation. */
  useEffect(() => {
    if (!toast) return;
    const lifetime = toast.action ? 6000 : 2400;
    const id = toast.id;
    const t = window.setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, lifetime);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      setToast({ id: Date.now() + Math.random(), message, action });
    },
    [],
  );

  /* Refs for the section tabs strip + each tab button. The strip can overflow
   * horizontally on narrow viewports, so when the active section changes (or
   * the profile mounts) we scroll the active tab into view. Without this, a
   * deep-linked section that lives on the far right (e.g. Contact / Admin) or
   * far left (Panel management) lands offscreen on mobile. */
  const tabsNavRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<PatientProfileSection, HTMLButtonElement | null>>(
    {
      panel: null,
      conversations: null,
      appointments: null,
      contact: null,
    },
  );
  useEffect(() => {
    const nav = tabsNavRef.current;
    const tab = tabRefs.current[activeSection];
    if (!nav || !tab) return;
    /* Manual horizontal scroll instead of `scrollIntoView` so we don't also
     * affect the dialog's vertical scroll position. We center the tab inside
     * the visible strip when it doesn't fit; otherwise this is a no-op (the
     * Math.max keeps the new scroll position non-negative). */
    const target =
      tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2;
    const max = nav.scrollWidth - nav.clientWidth;
    nav.scrollLeft = Math.max(0, Math.min(target, max));
  }, [activeSection]);

  const patientId = summary.patientId;

  const dobParsed = parse(
    demographics.dateOfBirth,
    "yyyy-MM-dd",
    new Date(),
  );
  const dobDisplay = format(dobParsed, "MMM d, yyyy");
  const age = patientAgeFromDateOfBirth(demographics.dateOfBirth);

  const activeLabel =
    PATIENT_PROFILE_SECTIONS.find((s) => s.id === activeSection)?.label ??
    "Patient profile";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col bg-background text-foreground",
        className,
      )}
    >
      <header className="relative shrink-0 border-b border-border/60 bg-background px-12 pt-3 pb-3 md:px-14 md:pt-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <UserCircle
              className="size-7 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              {summary.displayName}
            </h1>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Call patient ${summary.displayName}`}
                onClick={() =>
                  showToast(`Calling ${summary.displayName} (demo).`)
                }
              >
                <Phone className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Message patient ${summary.displayName}`}
                onClick={() =>
                  showToast(`Message to ${summary.displayName} (demo).`)
                }
              >
                <MessageSquare className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <p
            className={cn(
              "m-0 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-muted-foreground",
              textMeta,
            )}
          >
            {[
              `PCP: ${summary.pcpDisplayName}`,
              `Navigator: ${summary.navigatorDisplayName}`,
              `DOB: ${dobDisplay}`,
              `Age: ${age}`,
              `Gender: ${genderLabel(demographics.gender)}`,
            ].map((item, i) => (
              <Fragment key={item}>
                {/* Below md, force a wrap before DOB so the line splits
                 * predictably into PCP|Navigator / DOB|Age|Gender instead
                 * of breaking at whatever flex-wrap picks first. The 0-height
                 * `basis-full` element pushes following items to the next row. */}
                {i === 2 ? (
                  <span
                    aria-hidden
                    className="block h-0 basis-full md:hidden"
                  />
                ) : null}
                {i > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "text-muted-foreground/50",
                      i === 2 && "max-md:hidden",
                    )}
                  >
                    |
                  </span>
                ) : null}
                <span className="whitespace-nowrap">{item}</span>
              </Fragment>
            ))}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-9 md:top-3 md:right-4"
          aria-label="Close patient profile"
          onClick={onCloseRequest}
        >
          <X className="size-5" aria-hidden />
        </Button>
      </header>

      {/* Horizontal section tabs (all sizes). The desktop left rail was folded
       * into this strip so the section content gets the full dialog width.
       *
       * Alignment is responsive: `justify-start` on mobile keeps the first tab
       * (Panel management) fully visible when the row overflows — with
       * `justify-center` the overflow gets split equally on both sides and the
       * first tab is clipped off the left edge. On `md+` there's enough room
       * for every tab so centering reads better. */}
      <nav
        ref={tabsNavRef}
        role="tablist"
        aria-label="Patient profile sections"
        className="flex w-full shrink-0 justify-start overflow-x-auto border-b border-border/60 bg-background px-2 md:justify-center md:px-4"
      >
        {PATIENT_PROFILE_SECTIONS.map((s) => {
          const isActive = s.id === activeSection;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[s.id] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onSectionChange(s.id)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors md:px-4",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <section
        aria-label={activeLabel}
        /* Overflow behavior is per-section:
         * - Panel / Contact: `overflow-y-auto` so the centered max-w-3xl
         *   column scrolls vertically inside the section. `scrollbar-
         *   gutter: stable` reserves the scrollbar gutter even when
         *   content doesn't overflow, so adding content that pushes
         *   past one viewport (e.g. expanding the Add task form)
         *   doesn't shrink the inner width and shift the centered
         *   column left. (Tailwind 4.3 ships `scrollbar-gutter-stable`;
         *   we're on 4.2.4, so the arbitrary-property escape hatch
         *   emits the rule.)
         * - Conversations / Appointments: full-bleed list + detail
         *   split. Each pane scrolls internally (matches /messaging
         *   and /clinic-flow), so the section itself is
         *   `overflow-hidden`. */
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
          activeSection === "conversations" ||
            activeSection === "appointments"
            ? "overflow-hidden"
            : "overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
        )}
      >
        {/* Centered column for Panel / Contact. Hidden via `display: none`
         * (not unmounted) when a full-bleed section is active so any
         * in-flight contact-form / task edits stay alive across switches.
         *
         * Contact / admin uses a wider cap (`max-w-5xl`) than Panel
         * management (`max-w-3xl`): the 2-column card layout has real
         * horizontal demand (3-line address blocks were wrapping at
         * 3xl), whereas Panel management is a vertical task list that
         * reads better at a narrower line length. */}
        <div
          className={cn(
            "mx-auto w-full flex-1 px-4 py-5 md:px-6 md:py-6",
            activeSection === "contact" ? "max-w-5xl" : "max-w-3xl",
            (activeSection === "conversations" ||
              activeSection === "appointments") &&
              "hidden",
          )}
        >
          {activeSection === "panel" ? (
            <PanelManagementSection
              conditions={panel.conditions}
              tasks={tasks}
              setTasks={setTasks}
              showToast={showToast}
            />
          ) : activeSection === "contact" ? (
            <ContactAdminForm value={contact} onChange={setContact} />
          ) : null}
        </div>

        {/* Conversations + Appointments are always mounted (hidden via
         * `display: none` when another section is active) so each panel's
         * UI state (selection, mobile two-pane) survives tab switches.
         * Both panels read from app-wide stores so their data stays in
         * sync with /messaging and /clinic-flow respectively.
         *
         * Each panel owns its own outer padding (matching the source
         * surface's `max-w-6xl + px-8 + py-4`), so we deliberately don't
         * add any here. */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            activeSection !== "conversations" && "hidden",
          )}
        >
          <PatientConversationsPanel patientId={patientId} />
        </div>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            activeSection !== "appointments" && "hidden",
          )}
        >
          <PatientAppointmentsPanel patientId={patientId} />
        </div>
      </section>

      {/* Portal so `fixed` is viewport-relative, not relative to the
       * transformed DialogContent (which would land the toast inside the
       * modal frame). z-index sits above DialogContent (z-116) + overlay.
       * The toast itself is pointer-events-none; only the optional action
       * button re-enables clicks so the user can hit Undo. */}
      {toast && typeof document !== "undefined"
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none fixed bottom-6 left-1/2 z-200 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
                textBody,
              )}
            >
              <span className="min-w-0 flex-1">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                  className="pointer-events-auto shrink-0 rounded-md px-2 py-1 text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PanelManagementSection({
  conditions,
  tasks,
  setTasks,
  showToast,
}: {
  conditions: readonly PatientCondition[];
  tasks: readonly LongTermPanelTask[];
  setTasks: Dispatch<SetStateAction<readonly LongTermPanelTask[]>>;
  showToast: PanelTaskToast;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className={cn("mb-2 font-medium", textBody)}>Conditions</h3>
        {conditions.length === 0 ? (
          <p className={cn("text-muted-foreground", textMeta)}>
            No conditions on file.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <Badge
                key={c.id}
                variant={c.isActive ? "secondary" : "outline"}
                className="font-normal"
                title={c.isActive ? undefined : "Inactive"}
              >
                {c.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <PanelTasksSection tasks={tasks} setTasks={setTasks} showToast={showToast} />
    </div>
  );
}

/**
 * Contact / Admin section.
 *
 * Layout: six titled subsections (Contact info, Home address,
 * Language & communication, Emergency contact, Pharmacy, Primary insurance).
 * Each row is a `[label · value]` pair where the value is click-to-edit,
 * matching the panel-management task title / note pattern.
 *
 * Saving: per-field auto-commit on blur / Enter (no global Save button,
 * no dirty registration). Closing the dialog discards in-flight edits
 * implicitly — same semantics as task editing.
 */
function ContactAdminForm({
  value,
  onChange,
}: {
  value: PatientContactAdmin;
  onChange: (next: PatientContactAdmin) => void;
}) {
  const patch = useCallback(
    (partial: Partial<PatientContactAdmin>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  const patchEmergency = useCallback(
    (partial: Partial<PatientEmergencyContact>) => {
      onChange({
        ...value,
        emergencyContact: { ...value.emergencyContact, ...partial },
      });
    },
    [onChange, value],
  );

  const patchPharmacy = useCallback(
    (partial: Partial<PatientPharmacy>) => {
      onChange({ ...value, pharmacy: { ...value.pharmacy, ...partial } });
    },
    [onChange, value],
  );

  const patchInsurance = useCallback(
    (partial: Partial<PatientPrimaryInsurance>) => {
      onChange({
        ...value,
        primaryInsurance: { ...value.primaryInsurance, ...partial },
      });
    },
    [onChange, value],
  );

  return (
    <div
      className={cn(
        /* Mobile: two columns stack vertically. md+: side-by-side. */
        "space-y-6",
        "md:grid md:grid-cols-2 md:gap-x-10 md:space-y-0",
      )}
    >
      <ContactColumn>
        <ContactSection title="Contact information">
          <ContactRow label="Mobile">
            <InlineEditableText
              value={value.mobilePhone}
              onChange={(v) => patch({ mobilePhone: v })}
              emptyAffordance="+ Add mobile phone"
              ariaLabel="Mobile phone"
            />
          </ContactRow>
          <ContactRow label="Home">
            <InlineEditableText
              value={value.homePhone}
              onChange={(v) => patch({ homePhone: v })}
              emptyAffordance="+ Add home phone"
              ariaLabel="Home phone"
            />
          </ContactRow>
          <ContactRow label="Email">
            <InlineEditableText
              value={value.email}
              onChange={(v) => patch({ email: v })}
              emptyAffordance="+ Add email"
              ariaLabel="Email"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Home address">
          <ContactRow label="Address">
            <InlineEditableText
              multiline
              value={value.homeAddress}
              onChange={(v) => patch({ homeAddress: v })}
              emptyAffordance="+ Add home address"
              ariaLabel="Home address"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Language & communication">
          <ContactRow label="Primary language">
            <InlineEditableText
              value={value.primaryLanguage}
              onChange={(v) => patch({ primaryLanguage: v })}
              emptyAffordance="+ Add primary language"
              ariaLabel="Primary language"
            />
          </ContactRow>
          <ContactRow label="Translation required">
            <ToggleYesNo
              value={value.translationRequired}
              onChange={(v) => patch({ translationRequired: v })}
              ariaLabel="Translation required"
            />
          </ContactRow>
          <ContactRow label="Contact method">
            <ContactMethodSelect
              value={value.contactMethodPreference}
              onChange={(v) => patch({ contactMethodPreference: v })}
            />
          </ContactRow>
        </ContactSection>
      </ContactColumn>

      <ContactColumn>
        <ContactSection title="Emergency contact">
          <ContactRow label="Name">
            <InlineEditableText
              value={value.emergencyContact.name}
              onChange={(v) => patchEmergency({ name: v })}
              emptyAffordance="+ Add name"
              ariaLabel="Emergency contact name"
            />
          </ContactRow>
          <ContactRow label="Relationship">
            <InlineEditableText
              value={value.emergencyContact.relationship}
              onChange={(v) => patchEmergency({ relationship: v })}
              emptyAffordance="+ Add relationship"
              ariaLabel="Emergency contact relationship"
            />
          </ContactRow>
          <ContactRow label="Phone">
            <InlineEditableText
              value={value.emergencyContact.phone}
              onChange={(v) => patchEmergency({ phone: v })}
              emptyAffordance="+ Add phone"
              ariaLabel="Emergency contact phone"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Pharmacy">
          <ContactRow label="Name">
            <InlineEditableText
              value={value.pharmacy.name}
              onChange={(v) => patchPharmacy({ name: v })}
              emptyAffordance="+ Add pharmacy name"
              ariaLabel="Pharmacy name"
            />
          </ContactRow>
          <ContactRow label="Address">
            <InlineEditableText
              multiline
              value={value.pharmacy.address}
              onChange={(v) => patchPharmacy({ address: v })}
              emptyAffordance="+ Add pharmacy address"
              ariaLabel="Pharmacy address"
            />
          </ContactRow>
          <ContactRow label="Phone">
            <InlineEditableText
              value={value.pharmacy.phone}
              onChange={(v) => patchPharmacy({ phone: v })}
              emptyAffordance="+ Add pharmacy phone"
              ariaLabel="Pharmacy phone"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Primary insurance">
          <ContactRow label="Carrier">
            <InlineEditableText
              value={value.primaryInsurance.carrier}
              onChange={(v) => patchInsurance({ carrier: v })}
              emptyAffordance="+ Add carrier"
              ariaLabel="Insurance carrier"
            />
          </ContactRow>
          <ContactRow label="Member ID">
            <InlineEditableText
              value={value.primaryInsurance.memberId}
              onChange={(v) => patchInsurance({ memberId: v })}
              emptyAffordance="+ Add member ID"
              ariaLabel="Insurance member ID"
            />
          </ContactRow>
          <ContactRow label="Group number">
            <InlineEditableText
              value={value.primaryInsurance.groupNumber}
              onChange={(v) => patchInsurance({ groupNumber: v })}
              emptyAffordance="+ Add group number"
              ariaLabel="Insurance group number"
            />
          </ContactRow>
        </ContactSection>
      </ContactColumn>
    </div>
  );
}

/**
 * One of the two visual columns in the Contact / Admin layout. A simple
 * vertical stack of bordered `ContactSection` cards. No cross-section
 * grid is needed anymore — each section owns its own grid with a fixed
 * label-column width (see `ContactSection`) so values left-align
 * consistently within the column AND across the two columns.
 */
function ContactColumn({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/**
 * A titled, bordered subsection inside a `ContactColumn`.
 *
 * Layout choices:
 *   - `grid-cols-[10rem_1fr]` is a **fixed** label-column width, not
 *     `max-content`. This is what guarantees the user-visible promise
 *     that "the space between label and inputted field is the same
 *     between the two columns": both columns render with the same
 *     10rem label track, so values land at identical x positions in
 *     each column. 10rem comfortably fits the widest label in the
 *     form ("Translation required" ~9.5rem) with a small buffer.
 *   - `items-baseline` aligns the label baseline to the value's
 *     first-line baseline (single-line or multi-line), which reads as
 *     "label centered on the first line of the value" for our text
 *     sizes.
 *   - `gap-x-4` is the gutter between label and value; matched by
 *     the second visual column for free since both use this same
 *     ContactSection wrapper.
 *   - Border + padding turn each section into a discrete card so the
 *     groupings (Contact information / Home address / etc.) read as
 *     distinct units.
 */
function ContactSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-background p-4",
      )}
    >
      {/* `mb-3` (12px) on the title pushes the `dl` away from it.
       *
       * We can't use `space-y-*` on the parent here: the `dl` carries
       * `m-0` to neutralize its UA top/bottom margin, and in Tailwind v4
       * `m-0` is emitted as `margin: 0` which overrides the `margin-top`
       * that `space-y-*` adds to siblings. Using an explicit `mb-*` on
       * the heading sidesteps that cascade conflict entirely. */}
      <h3 className={cn("m-0 mb-3 font-medium", textBody)}>{title}</h3>
      <dl
        className={cn(
          "m-0 grid grid-cols-[10rem_1fr] items-baseline gap-x-4 gap-y-2",
        )}
      >
        {children}
      </dl>
    </section>
  );
}

/**
 * Single `[label · value]` row inside a `ContactSection`'s `<dl>`.
 * `<dt>` lands in the section grid's 10rem label column; `<dd>` fills
 * the rest. `whitespace-nowrap` keeps labels on one line so they read
 * cleanly in the fixed-width track.
 */
function ContactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt
        className={cn(
          "text-muted-foreground whitespace-nowrap",
          textMeta,
        )}
      >
        {label}
      </dt>
      <dd className={cn("m-0 min-w-0", textBody)}>{children}</dd>
    </>
  );
}

/**
 * Click-to-toggle Yes / No control. Visually mirrors the
 * `InlineEditableText` display mode (text + hover background) so the
 * row reads the same as text rows in the section.
 */
function ToggleYesNo({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-label={ariaLabel}
      aria-pressed={value}
      className={cn(
        "-mx-1 -my-0.5 cursor-pointer rounded-sm px-1 py-0.5 text-left hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      {value ? "Yes" : "No"}
    </button>
  );
}

/**
 * Contact method preference selector.
 *
 * Renders a `SelectTrigger` styled to sit unobtrusively in the row
 * (transparent background, no border, hover background to signal it's
 * clickable). Uses `size="sm"` rather than overriding the height — the
 * default `data-[size=*]:h-*` data-variant utilities have higher
 * cascade precedence than plain `h-auto`, so a manual `h-auto` override
 * silently doesn't apply and the trigger ends up rendering at a height
 * that broke the original click target. Letting `size="sm"` set h-7
 * keeps the click target reliable.
 */
function ContactMethodSelect({
  value,
  onChange,
}: {
  value: PatientContactMethodPreference;
  onChange: (next: PatientContactMethodPreference) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as PatientContactMethodPreference)}
    >
      <SelectTrigger
        size="sm"
        aria-label="Contact method"
        className={cn(
          "-mx-1 border-0 bg-transparent shadow-none",
          "hover:bg-muted/40",
          "focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent",
          textBody,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      {/* `z-1000` lifts the portaled `SelectContent` above the patient
       * profile Dialog (z-50). Without it the dropdown opens but renders
       * behind the dialog and appears to do nothing. Every other Select
       * in the patient profile (Stage, Room, task Stage) uses the same
       * fix — see e.g. `StageChip`. */}
      <SelectContent className="z-1000">
        {CONTACT_PREFS.map((pref) => (
          <SelectItem key={pref} value={pref}>
            {CONTACT_PREF_LABEL[pref]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
