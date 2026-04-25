import {
  getWorkoutLogs,
  getMealLogs,
  getWellnessLogs,
  getWeeklySummaries,
  generateWeeklySummary
} from "./api.js";

import {
  requireAuth,
  getSelectedDate
} from "./common.js";

const auth = requireAuth();
if (!auth) throw new Error("Unauthorized");

const els = {
  status: document.getElementById("statusMessage"),
  latestReportBtn: document.getElementById("latestReportBtn"),
  summaryText: document.getElementById("summaryText"),
  chartRange: document.getElementById("chartRange"),
  chartRangeLabel: document.getElementById("chartRangeLabel"),
  workoutHoursChart: document.getElementById("workoutHoursChart")
};

function showStatus(message, type = "loading") {
  if (!els.status) return;

  els.status.textContent = message;
  els.status.style.display = "block";
  els.status.className = "status-banner";

  if (type === "success") {
    els.status.classList.add("status-success");
  } else if (type === "error") {
    els.status.classList.add("status-error");
  } else {
    els.status.classList.add("status-loading");
  }
}

function parseLocalDate(dateString) {
  const value = String(dateString || "").slice(0, 10);

  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function getWeekRange(selectedDate) {
  const date = parseLocalDate(selectedDate);
  const day = date.getDay();

  const start = new Date(date);
  start.setDate(date.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start,
    end,
    weekStartDate: toIsoDate(start),
    weekEndDate: toIsoDate(end)
  };
}

function getPreviousWeekRange(selectedDate, weeksBack) {
  const currentWeek = getWeekRange(selectedDate);

  const start = new Date(currentWeek.start);
  start.setDate(currentWeek.start.getDate() - (7 * weeksBack));

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

function getChartRange(selectedDate) {
  const selectedRange = els.chartRange?.value || "week";

  if (selectedRange === "lastWeek") {
    return getPreviousWeekRange(selectedDate, 1);
  }

  if (selectedRange === "weekBefore") {
    return getPreviousWeekRange(selectedDate, 2);
  }

  return getWeekRange(selectedDate);
}

function isDateInRange(value, start, end) {
  const dateText = String(value || "").slice(0, 10);
  if (!dateText) return false;

  const date = parseLocalDate(dateText);
  return date >= start && date <= end;
}

function isSameDate(value, targetDate) {
  return String(value || "").slice(0, 10) === String(targetDate || "").slice(0, 10);
}

function buildDateBuckets(start, end) {
  const buckets = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    buckets.push({
      isoDate: toIsoDate(cursor),
      label: formatDisplayDate(cursor),
      hours: 0
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function formatHours(hours) {
  if (Number.isInteger(hours)) {
    return hours.toString();
  }

  return hours.toFixed(1);
}

function renderWorkoutHoursChart(workouts, start, end) {
  if (!els.workoutHoursChart) return;

  const buckets = buildDateBuckets(start, end);

  workouts.forEach((workout) => {
    const workoutDate = String(workout.workoutDate || "").slice(0, 10);
    const bucket = buckets.find((item) => item.isoDate === workoutDate);

    if (bucket) {
      bucket.hours += Number(workout.durationMinutes || 0) / 60;
    }
  });

  const maxYAxisHours = 6;
  const chartHeight = 170;

  if (els.chartRangeLabel) {
    els.chartRangeLabel.textContent = `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;
  }

  els.workoutHoursChart.innerHTML = `
    <div class="chart-y-axis">
      <span>6 hrs</span>
      <span>4 hrs</span>
      <span>2 hrs</span>
      <span>0 hrs</span>
    </div>

    <div class="chart-plot">
      <div class="y-grid y-grid-6"></div>
      <div class="y-grid y-grid-4"></div>
      <div class="y-grid y-grid-2"></div>
      <div class="y-grid y-grid-0"></div>

      <div class="chart-bars">
        ${buckets
          .map((item) => {
            const cappedHours = Math.min(item.hours, maxYAxisHours);

            const height =
              item.hours > 0
                ? Math.max(8, Math.round((cappedHours / maxYAxisHours) * chartHeight))
                : 4;

            const displayHours = formatHours(item.hours);
            const hourLabel = item.hours === 1 ? "hr" : "hrs";

            return `
              <div class="workout-bar-item">
                <div class="bar-tooltip">${displayHours} ${hourLabel}</div>
                <div 
                  class="workout-bar" 
                  style="height:${height}px" 
                  title="${displayHours} ${hourLabel} on ${item.label}">
                </div>
                <span>${item.label}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

async function loadInsights() {
  try {
    showStatus("Loading insights...", "loading");

    const selectedDate = getSelectedDate();
    const { start, end, weekStartDate } = getWeekRange(selectedDate);
    const chartRange = getChartRange(selectedDate);

    const [workouts, meals, wellness, summaries] = await Promise.all([
      getWorkoutLogs(),
      getMealLogs(),
      getWellnessLogs(),
      getWeeklySummaries()
    ]);

    const weeklyWorkouts = (workouts || []).filter((workout) =>
      isDateInRange(workout.workoutDate, start, end)
    );

    const weeklyMeals = (meals || []).filter((meal) =>
      isDateInRange(meal.mealDate, start, end)
    );

    const weeklyWellness = (wellness || []).filter((entry) =>
      isDateInRange(entry.logDate, start, end)
    );

    const chartWorkouts = (workouts || []).filter((workout) =>
      isDateInRange(workout.workoutDate, chartRange.start, chartRange.end)
    );

    const selectedWeekSummary = (summaries || []).find((summary) =>
      isSameDate(summary.weekStartDate, weekStartDate)
    );

    if (els.summaryText) {
      els.summaryText.textContent =
        selectedWeekSummary?.summaryText ||
        selectedWeekSummary?.summary ||
        `This week you logged ${weeklyWorkouts.length} workouts, ${weeklyMeals.length} meals, and ${weeklyWellness.length} wellness entries.`;
    }

    renderWorkoutHoursChart(chartWorkouts, chartRange.start, chartRange.end);

    showStatus("Latest report loaded.", "success");
  } catch (error) {
    showStatus(error.message || "Failed to load insights.", "error");
  }
}

els.chartRange?.addEventListener("change", loadInsights);

els.latestReportBtn?.addEventListener("click", async () => {
  try {
    showStatus("Generating latest report...", "loading");

    const selectedDate = getSelectedDate();
    const { weekStartDate } = getWeekRange(selectedDate);

    await generateWeeklySummary(undefined, weekStartDate);
    await loadInsights();

    showStatus("Latest report generated.", "success");
  } catch (error) {
    showStatus(error.message || "Failed to generate latest report.", "error");
  }
});

loadInsights();