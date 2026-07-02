import test from "node:test";
import assert from "node:assert/strict";
import { milestones } from "../src/core/data-store.js";
import { updateMilestone } from "../src/core/mutations.js";

// R6: actual_end_date validation only checked the PREVIOUS milestone
// (sortOrder-1). Editing an EARLIER milestone to a date later than a
// LATER milestone's actual_end_date created an inversion the reorder
// validation would reject -- but updateMilestone let it through silently.

function resetMilestones() {
  milestones.length = 0;
}

test("updateMilestone rejects an actual_end_date later than the NEXT milestone's actual_end_date", async () => {
  resetMilestones();
  milestones.push(
    { id: "M1", projectId: "P1", sortOrder: 1, name: "M1", planned_start_date: "2026-05-01", planned_end_date: "2026-05-10", actual_start_date: "2026-05-01", actual_end_date: "2026-05-05", rev: 1 },
    { id: "M2", projectId: "P1", sortOrder: 2, name: "M2", planned_start_date: "2026-05-11", planned_end_date: "2026-05-20", actual_start_date: "2026-05-11", actual_end_date: "2026-06-10", rev: 1 },
    { id: "M3", projectId: "P1", sortOrder: 3, name: "M3", planned_start_date: "2026-06-11", planned_end_date: "2026-06-20", actual_start_date: null, actual_end_date: null, rev: 1 },
  );

  // M1 has no PREVIOUS milestone, so the old prev-only check never fires --
  // but setting M1's actual_end_date after M2's (2026-06-10) is still an
  // inversion and must be rejected.
  await assert.rejects(
    () => updateMilestone("M1", { actual_end_date: "2026-06-15" }),
    /不能晚于|晚于下一/,
    "should reject when the new actual_end_date is later than the NEXT milestone's actual_end_date"
  );
});

test("updateMilestone still allows a valid actual_end_date consistent with both neighbors", async () => {
  resetMilestones();
  milestones.push(
    { id: "M1", projectId: "P1", sortOrder: 1, name: "M1", planned_start_date: "2026-05-01", planned_end_date: "2026-05-10", actual_start_date: "2026-05-01", actual_end_date: null, rev: 1 },
    { id: "M2", projectId: "P1", sortOrder: 2, name: "M2", planned_start_date: "2026-05-11", planned_end_date: "2026-05-20", actual_start_date: "2026-05-11", actual_end_date: "2026-06-10", rev: 1 },
  );

  // No network call will actually succeed in this Node test environment,
  // so we only assert that validation does NOT reject -- the promise may
  // still reject later at the (unmocked) fetch step, which is out of scope
  // for this validation-only test.
  let validationError = null;
  try {
    await updateMilestone("M1", { actual_end_date: "2026-06-01" });
  } catch (err) {
    validationError = err;
  }
  assert.ok(
    !validationError || !/不能晚于|晚于下一|不能早于/.test(validationError.message),
    "a date consistent with both neighbors must not be rejected by validation"
  );
});
