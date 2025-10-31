import { useEffect } from 'react';
import {
  initializeApp,
  addShift,
  removeShift,
  openEmployeeConfig,
  removeEmployee,
  addEmployee,
  addHolidayRow,
  loadDefaultHolidaysForCountry,
  clearHolidayTable,
  switchTab,
  closeEmployeeConfig,
  addUnavailRow,
  saveEmployeeConfig,
  closeDayDetail,
} from './appLogic.js';

function handleRemoveShift(event) {
  removeShift(event.currentTarget);
}

function handleOpenEmployeeConfig(event) {
  openEmployeeConfig(event.currentTarget);
}

function handleRemoveEmployee(event) {
  removeEmployee(event.currentTarget);
}

function handleCloseEmployeeConfig() {
  closeEmployeeConfig();
}

function handleAddUnavailabilityRow() {
  addUnavailRow();
}

function handleCloseDayDetail() {
  closeDayDetail();
}

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>Enhanced Security Guard Scheduling</h1>
          <p>Thailand calendar, role constraints, and editable rosters</p>
        </div>

        <div className="test-section">
          <h2 className="section-title">Test Setup</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Schedule Period</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" id="startDate" required />
                <input type="date" id="endDate" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select id="timezone" required defaultValue="Asia/Bangkok">
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="country">Country for Holidays</label>
              <select id="country" required defaultValue="TH">
                <option value="TH">Thailand</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
          </div>

          <h3 style={{ margin: '20px 0 10px' }}>Shift Pattern Registration</h3>
          <table className="shift-table">
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>Start Time</th>
                <th>Size (hrs)</th>
                <th>End Time</th>
                <th>Guard Roles Needed</th>
                <th>Supervisor Roles Needed</th>
                <th>Senior Roles Needed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="shiftTableBody">
              <tr>
                <td><input type="text" defaultValue="Morning" placeholder="Shift name" /></td>
                <td><input type="time" defaultValue="06:00" className="shift-start" /></td>
                <td>
                  <select className="shift-size" defaultValue="8">
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                  </select>
                </td>
                <td><input type="time" defaultValue="14:00" className="shift-end" disabled /></td>
                <td><input type="number" defaultValue="3" min="0" /></td>
                <td><input type="number" defaultValue="1" min="0" /></td>
                <td><input type="number" defaultValue="0" min="0" /></td>
                <td>
                  <button className="btn btn-secondary" type="button" onClick={handleRemoveShift}>
                    Remove
                  </button>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="Afternoon" placeholder="Shift name" /></td>
                <td><input type="time" defaultValue="14:00" className="shift-start" /></td>
                <td>
                  <select className="shift-size" defaultValue="8">
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                  </select>
                </td>
                <td><input type="time" defaultValue="22:00" className="shift-end" disabled /></td>
                <td><input type="number" defaultValue="2" min="0" /></td>
                <td><input type="number" defaultValue="0" min="0" /></td>
                <td><input type="number" defaultValue="1" min="0" /></td>
                <td>
                  <button className="btn btn-secondary" type="button" onClick={handleRemoveShift}>
                    Remove
                  </button>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="Night" placeholder="Shift name" /></td>
                <td><input type="time" defaultValue="22:00" className="shift-start" /></td>
                <td>
                  <select className="shift-size" defaultValue="8">
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                  </select>
                </td>
                <td><input type="time" defaultValue="06:00" className="shift-end" disabled /></td>
                <td><input type="number" defaultValue="2" min="0" /></td>
                <td><input type="number" defaultValue="1" min="0" /></td>
                <td><input type="number" defaultValue="0" min="0" /></td>
                <td>
                  <button className="btn btn-secondary" type="button" onClick={handleRemoveShift}>
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-secondary" type="button" onClick={addShift}>
            Add Shift
          </button>

          <h3 style={{ margin: '22px 0 10px' }}>Employee Constraints</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="maxWeeklyHours">Max Weekly Hours per Employee</label>
              <input type="number" id="maxWeeklyHours" defaultValue="48" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="maxConsecutiveDays">Max Consecutive Working Days</label>
              <input type="number" id="maxConsecutiveDays" defaultValue="6" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="minDayOff">Minimum Full Day Off After Max Consecutive</label>
              <input type="number" id="minDayOff" defaultValue="1" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="maxContinuousHours">Max Continuous Hours Per Day</label>
              <input type="number" id="maxContinuousHours" defaultValue="12" min="1" required />
            </div>
          </div>

          <h3 style={{ margin: '22px 0 10px' }}>Employee Roster</h3>
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Max Weekly Hours</th>
                <th>
                  Unavailable Dates <span className="muted">(panel)</span>
                </th>
                <th>Preferred Shifts</th>
                <th>Spare</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="employeeTableBody">
              <tr>
                <td><input type="text" defaultValue="John Smith" /></td>
                <td>
                  <select defaultValue="supervisor">
                    <option value="guard">Guard</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="senior">Senior Guard</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="48" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">none</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue="Morning" />
                  <div className="chips prefs-preview">
                    <span className="chip">Morning</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="Maria Garcia" /></td>
                <td>
                  <select defaultValue="guard">
                    <option value="guard">Guard</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="senior">Senior Guard</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="40" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">none</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue="Afternoon" />
                  <div className="chips prefs-preview">
                    <span className="chip">Afternoon</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-secondary" type="button" onClick={addEmployee}>
            Add Employee
          </button>

          <h3 style={{ margin: '22px 0 10px' }}>Holiday Register</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <table className="mini-table" aria-label="Holiday register">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Date</th>
                    <th style={{ width: '55%' }}>Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="holidayTableBody" />
              </table>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => addHolidayRow()}
                >
                  Add Holiday
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => loadDefaultHolidaysForCountry().catch(() => {})}
                >
                  Load Country Defaults
                </button>
                <button className="btn btn-danger" type="button" onClick={clearHolidayTable}>
                  Clear All
                </button>
              </div>
              <p className="muted" style={{ marginTop: '6px' }}>
                Defaults come from selected country and are filterable by date range.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '22px' }}>
            <button id="startTest" className="btn btn-primary" type="button">
              Generate Schedule
            </button>
          </div>

          <div className="tests">
            <div className="inline" style={{ gap: '8px', marginBottom: '8px' }}>
              <button className="btn btn-secondary" id="runTests" type="button">
                Run Self-Tests
              </button>
              <span className="muted">Verifies holidays, spares, day-off plan, and 8-8-8 upgrade.</span>
            </div>
            <pre id="testOutput">No tests run.</pre>
          </div>
        </div>

        <div className="test-section" id="resultsContainer" style={{ display: 'none' }}>
          <h2 className="section-title">Schedule Results</h2>
          <div className="results-grid">
            <div className="metric-card">
              <h3>Coverage Rate</h3>
              <div className="metric-value" id="coverageRate">
                0%
              </div>
              <p>Staffing vs Requirement</p>
            </div>
            <div className="metric-card">
              <h3>Role Compliance</h3>
              <div className="metric-value" id="roleCompliance">
                0%
              </div>
              <p>Role Requirements Met</p>
            </div>
            <div className="metric-card">
              <h3>Constraint Satisfaction</h3>
              <div className="metric-value" id="constraintCompliance">
                0%
              </div>
              <p>Rules Applied</p>
            </div>
            <div className="metric-card">
              <h3>Processing Time</h3>
              <div className="metric-value" id="processingTime">
                0ms
              </div>
              <p>Algorithm Execution</p>
            </div>
          </div>
          <div className="tabs">
            <button className="tab active" type="button" onClick={(event) => switchTab(event, 'siteView')}>
              Site Schedule View
            </button>
            <button className="tab" type="button" onClick={(event) => switchTab(event, 'personView')}>
              Personal Schedules
            </button>
            <button className="tab" type="button" onClick={(event) => switchTab(event, 'constraintView')}>
              Constraint Analysis
            </button>
          </div>
          <div className="tab-content active" id="siteView">
            <h3>Site Schedule Calendar</h3>
            <p>
              Period: <span id="schedulePeriodDisplay" />
            </p>
            <div className="calendar-toolbar">
              <div className="toolbar-group">
                <label htmlFor="calendarMode">Window</label>
                <select id="calendarMode" defaultValue="week">
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="calendarMonth">Month</label>
                <select id="calendarMonth"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="calendarYear">Year</label>
                <select id="calendarYear"></select>
              </div>
              <div className="toolbar-group week-controls" id="calendarWeekControls">
                <button className="btn btn-secondary" type="button" id="calendarPrevWeek" aria-label="Previous week">
                  &lt;
                </button>
                <span id="calendarWeekLabel">Week 1 / 1</span>
                <button className="btn btn-secondary" type="button" id="calendarNextWeek" aria-label="Next week">
                  &gt;
                </button>
              </div>
            </div>
            <div className="calendar-view" id="siteCalendar" />
          </div>
          <div className="tab-content" id="personView">
            <h3>Personal Schedules</h3>
            <div className="calendar-toolbar personal-toolbar">
              <div className="toolbar-group">
                <label htmlFor="personalEmployeeSelect">Employee</label>
                <select id="personalEmployeeSelect"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalMode">Window</label>
                <select id="personalMode" defaultValue="week">
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalMonth">Month</label>
                <select id="personalMonth"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalYear">Year</label>
                <select id="personalYear"></select>
              </div>
              <div className="toolbar-group week-controls" id="personalWeekControls">
                <button className="btn btn-secondary" type="button" id="personalPrevWeek" aria-label="Previous week">
                  &lt;
                </button>
                <span id="personalWeekLabel">Week 1 / 1</span>
                <button className="btn btn-secondary" type="button" id="personalNextWeek" aria-label="Next week">
                  &gt;
                </button>
              </div>
            </div>
            <div className="personal-calendar" id="personalCalendar" />
          </div>
          <div className="tab-content" id="constraintView">
            <h3>Constraint Analysis</h3>
            <div className="schedule-visualization">
              <h4>Weekly Hours</h4>
              <div id="hoursAnalysis" />
            </div>
            <div className="schedule-visualization">
              <h4>Consecutive Days</h4>
              <div id="consecutiveAnalysis" />
            </div>
          </div>
          <button id="exportResults" className="btn btn-primary" type="button">
            Export Schedule
          </button>
        </div>
      </div>

      <div id="employeeConfigOverlay" className="config-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div className="config-panel">
          <div className="config-header">
            <h2>Employee Config</h2>
            <div className="inline">
              <button className="btn btn-secondary" type="button" onClick={handleCloseEmployeeConfig}>
                Close
              </button>
            </div>
          </div>
          <div className="config-section">
            <div className="form-group">
              <label htmlFor="cfgName">Employee Name</label>
              <input id="cfgName" type="text" />
            </div>
            <div className="form-group">
              <label htmlFor="cfgRole">Role</label>
              <select id="cfgRole" defaultValue="guard">
                <option value="guard">Guard</option>
                <option value="supervisor">Supervisor</option>
                <option value="senior">Senior Guard</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cfgHours">Max Weekly Hours</label>
              <input id="cfgHours" type="number" min="1" defaultValue="48" />
            </div>
            <div className="form-group">
              <label htmlFor="cfgSpare">
                <input id="cfgSpare" type="checkbox" /> Mark as Spare
              </label>
            </div>
          </div>
          <div className="config-section">
            <label>Unavailable Dates Register</label>
            <table className="mini-table" aria-label="Unavailable dates">
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="cfgUnavailBody" />
            </table>
            <div style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary" type="button" onClick={handleAddUnavailabilityRow}>
                Add Date
              </button>
            </div>
          </div>
          <div className="config-section">
            <label>Preferred Shifts</label>
            <div id="cfgShiftChecks" className="inline" style={{ flexWrap: 'wrap', gap: '14px' }} />
            <p className="muted" style={{ marginTop: '6px' }}>
              Multiple selections allowed. Options sync with global shift list.
            </p>
          </div>
          <div className="config-section">
            <button className="btn btn-primary" type="button" onClick={saveEmployeeConfig}>
              Save
            </button>
          </div>
        </div>
      </div>

      <div id="dayDetailOverlay" className="detail-overlay" aria-modal="true" aria-hidden="true">
        <div className="day-panel">
          <div className="day-head">
            <h2 id="dayTitle">Day Detail</h2>
            <div className="inline">
              <button className="btn btn-secondary" type="button" onClick={handleCloseDayDetail}>
                Close
              </button>
            </div>
          </div>
          <div id="dayMeta" className="meta" />
          <div className="day-toolbar">
            <div className="day-toolbar-left">
              <label htmlFor="dayShiftTemplate">Add shift</label>
              <div className="inline compact">
                <select id="dayShiftTemplate" />
                <button className="btn btn-secondary btn-compact" type="button" id="dayAddShift">
                  Add Shift
                </button>
              </div>
            </div>
            <div className="day-toolbar-right">
              <span id="dayPendingHint" className="pending-hint">
                Unsaved changes
              </span>
              <button className="btn btn-secondary btn-compact" type="button" id="dayDiscardChanges">
                Discard
              </button>
              <button className="btn btn-primary btn-compact" type="button" id="daySaveChanges" disabled>
                Save
              </button>
            </div>
          </div>
          <div className="gantt-wrap">
            <div className="gantt-legend">
              <span>
                <span className="legend-dot legend-guard" />{' '}Guard
              </span>
              <span>
                <span className="legend-dot legend-supervisor" />{' '}Supervisor
              </span>
              <span>
                <span className="legend-dot legend-senior" />{' '}Senior Guard
              </span>
            </div>
            <div className="gantt-header">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <div id="ganttRows" />
          </div>
          <div id="dayAssignments" className="day-assignments" />
        </div>
      </div>
    </>
  );
}
