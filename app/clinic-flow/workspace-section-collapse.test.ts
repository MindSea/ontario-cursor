import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  defaultCollapsedBySection,
  workspaceSectionKeyForStage,
  workspaceSectionScrollTopFromRects,
  WORKSPACE_SECTION_SCROLL_ID,
} from "./workspace-section-collapse";

describe("workspaceSectionKeyForStage", () => {
  it("maps pipeline stages to section keys", () => {
    assert.equal(workspaceSectionKeyForStage("INTAKE"), "intake");
    assert.equal(workspaceSectionKeyForStage("WRAP UP"), "wrap-up");
  });

  it("returns null for completed", () => {
    assert.equal(workspaceSectionKeyForStage("COMPLETED"), null);
  });
});

describe("defaultCollapsedBySection", () => {
  it("expands only the active stage section", () => {
    const collapsed = defaultCollapsedBySection("ROOMING");
    assert.equal(collapsed.rooming, false);
    assert.equal(collapsed.previsit, true);
    assert.equal(collapsed.intake, true);
  });

  it("collapses all sections when completed", () => {
    const collapsed = defaultCollapsedBySection("COMPLETED");
    for (const key of Object.keys(WORKSPACE_SECTION_SCROLL_ID)) {
      assert.equal(collapsed[key as keyof typeof collapsed], true);
    }
  });
});

describe("workspaceSectionScrollTopFromRects", () => {
  it("offsets section top by container scroll position", () => {
    assert.equal(
      workspaceSectionScrollTopFromRects({
        containerScrollTop: 120,
        containerScrollHeight: 2000,
        containerClientHeight: 600,
        containerViewportTop: 80,
        sectionViewportTop: 260,
      }),
      300,
    );
  });

  it("clamps to scrollable range", () => {
    assert.equal(
      workspaceSectionScrollTopFromRects({
        containerScrollTop: 0,
        containerScrollHeight: 800,
        containerClientHeight: 600,
        containerViewportTop: 0,
        sectionViewportTop: 900,
      }),
      200,
    );
  });
});
