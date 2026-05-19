"use client";

import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { useAppointmentsStore } from "./appointments-store";
import { HuddleTaskList } from "./huddle-task-list";
import type { Appointment, HuddleTask } from "./types";

export function WorkspaceHuddleCard({
  appointment,
  layout,
}: {
  appointment: Appointment;
  layout: "mobile" | "desktop";
}) {
  const { updateAppointment } = useAppointmentsStore();
  const tasks = appointment.huddleTasks ?? [];

  const onTasksChange = (next: HuddleTask[]) => {
    updateAppointment(appointment.id, { huddleTasks: next });
  };

  const body = (
    <HuddleTaskList
      appointmentId={appointment.id}
      tasks={tasks}
      onTasksChange={onTasksChange}
      sectionTitle="HUDDLE"
    />
  );

  const huddleSectionSurface =
    "border border-border bg-muted/40 shadow-md ring-1 ring-border/50";

  if (layout === "mobile") {
    return (
      <section
        className={cn(
          textBody,
          "block w-full rounded-xl px-4 pt-4 pb-2",
          huddleSectionSurface,
        )}
      >
        {body}
      </section>
    );
  }

  return (
    <section
      className={cn(
        textBody,
        "block w-full rounded-lg px-6 pt-6 pb-4",
        huddleSectionSurface,
      )}
    >
      {body}
    </section>
  );
}
