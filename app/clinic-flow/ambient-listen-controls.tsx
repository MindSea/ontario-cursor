"use client";

import { Button } from "@/components/ui/button";

import { useAmbientListen } from "./ambient-listen-context";

/** Full ambient listen controls (same behavior everywhere in the workspace). */
export function AmbientListenControls() {
  const { listenState, setListenState } = useAmbientListen();

  return (
    <>
      {listenState === "not_started" || listenState === "stopped" ? (
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="shrink-0"
          onClick={() => setListenState("recording")}
        >
          Start
        </Button>
      ) : null}
      {listenState === "recording" ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0"
            onClick={() => setListenState("paused")}
          >
            Pause
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0"
            onClick={() => setListenState("stopped")}
          >
            Stop
          </Button>
        </>
      ) : null}
      {listenState === "paused" ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0"
            onClick={() => setListenState("recording")}
          >
            Resume
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0"
            onClick={() => setListenState("stopped")}
          >
            Stop
          </Button>
        </>
      ) : null}
    </>
  );
}
