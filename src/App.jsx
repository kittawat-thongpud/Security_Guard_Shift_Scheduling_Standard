import { useEffect, useState } from 'react';
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
  setLanguage,
  getCurrentLanguage,
  onLanguageChange,
  translate,
  setTheme,
  getCurrentTheme,
  onThemeChange,
  getLocaleStrings,
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
  const [language, setLanguageState] = useState(getCurrentLanguage());
  const [theme, setThemeState] = useState(getCurrentTheme());

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const unsubscribeLang = onLanguageChange(setLanguageState);
    const unsubscribeTheme = onThemeChange(setThemeState);
    return () => {
      unsubscribeLang();
      unsubscribeTheme();
    };
  }, []);

  const locale = getLocaleStrings(language);
  const roleNames = locale.roles;
  const t = (key, replacements) => translate(key, replacements, language);
  const weekPlaceholder = t('weekCounter', { current: 1, total: 1 });

  const handleLanguageSelect = (event) => {
    setLanguage(event.target.value);
  };

  const handleThemeSelect = (event) => {
    setTheme(event.target.value);
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>{t('headerTitle')}</h1>
          <p>{t('headerSubtitle')}</p>
          <div className="header-controls">
            <label className="header-control">
              <span>{t('languageLabel')}</span>
              <select value={language} onChange={handleLanguageSelect}>
                <option value="en">{t('languageEnglish')}</option>
                <option value="th">{t('languageThai')}</option>
              </select>
            </label>
            <label className="header-control">
              <span>{t('themeLabel')}</span>
              <select value={theme} onChange={handleThemeSelect}>
                <option value="light">{t('themeLight')}</option>
                <option value="dark">{t('themeDark')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="test-section">
          <h2 className="section-title">{t('testSetupTitle')}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('schedulePeriodLabel')}</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" id="startDate" required />
                <input type="date" id="endDate" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="timezone">{t('timezoneLabel')}</label>
              <select id="timezone" required defaultValue="Asia/Bangkok">
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="country">{t('countryLabel')}</label>
              <select id="country" required defaultValue="TH">
                <option value="TH">Thailand</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>
          </div>

          <h3 style={{ margin: '20px 0 10px' }}>{t('shiftPatternTitle')}</h3>
              <table className="shift-table shift-table-patterns">
            <thead>
              <tr>
                <th>{t('shiftNameHeader')}</th>
                <th>{t('startTimeHeader')}</th>
                <th>{t('shiftSizeHeader')}</th>
                <th>{t('endTimeHeader')}</th>
                <th>{t('guardNeededHeader')}</th>
                <th>{t('supervisorNeededHeader')}</th>
                <th>{t('seniorNeededHeader')}</th>
                <th>{t('actionsHeader')}</th>
              </tr>
            </thead>
            <tbody id="shiftTableBody">
              <tr>
                <td><input type="text" defaultValue={locale.shiftMorningName} placeholder={t('shiftNamePlaceholder')} /></td>
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
                    {t('removeButton')}
                  </button>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue={locale.shiftAfternoonName} placeholder={t('shiftNamePlaceholder')} /></td>
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
                    {t('removeButton')}
                  </button>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue={locale.shiftNightName} placeholder={t('shiftNamePlaceholder')} /></td>
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
                    {t('removeButton')}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-secondary" type="button" onClick={addShift}>
            {t('addShiftButton')}
          </button>

          <h3 style={{ margin: '22px 0 10px' }}>{t('employeeConstraintsTitle')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="maxWeeklyHours">{t('maxWeeklyHoursLabel')}</label>
              <input type="number" id="maxWeeklyHours" defaultValue="48" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="maxConsecutiveDays">{t('maxConsecutiveDaysLabel')}</label>
              <input type="number" id="maxConsecutiveDays" defaultValue="6" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="minDayOff">{t('minDayOffLabel')}</label>
              <input type="number" id="minDayOff" defaultValue="1" min="1" required />
            </div>
            <div className="form-group">
              <label htmlFor="maxContinuousHours">{t('maxContinuousHoursLabel')}</label>
              <input type="number" id="maxContinuousHours" defaultValue="12" min="1" required />
            </div>
          </div>

          <h3 style={{ margin: '22px 0 10px' }}>{t('employeeRosterTitle')}</h3>
          <table className="employee-table">
            <thead>
              <tr>
                <th>{t('employeeNameHeader')}</th>
                <th>{t('roleHeader')}</th>
                <th>{t('maxHoursHeader')}</th>
                <th>
                  {t('unavailableDatesHeader')} <span className="muted">{t('unavailableDatesPanelHint')}</span>
                </th>
                <th>{t('preferredShiftsHeader')}</th>
                <th>{t('spareHeader')}</th>
                <th>{t('actionsHeader')}</th>
              </tr>
            </thead>
            <tbody id="employeeTableBody">
              <tr>
                <td><input type="text" defaultValue="นรินทร์ ป้อมปราการ" /></td>
                <td>
                  <select defaultValue="supervisor">
                    <option value="guard">{roleNames.guard}</option>
                    <option value="supervisor">{roleNames.supervisor}</option>
                    <option value="senior">{roleNames.senior}</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="48" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">{t('noneLabel')}</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue={locale.shiftMorningName} />
                  <div className="chips prefs-preview">
                    <span className="chip">{locale.shiftMorningName}</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      {t('editButton')}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      {t('removeButton')}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="สุรีย์พร วัฒนะ" /></td>
                <td>
                  <select defaultValue="guard">
                    <option value="guard">{roleNames.guard}</option>
                    <option value="supervisor">{roleNames.supervisor}</option>
                    <option value="senior">{roleNames.senior}</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="40" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">{t('noneLabel')}</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue={locale.shiftAfternoonName} />
                  <div className="chips prefs-preview">
                    <span className="chip">{locale.shiftAfternoonName}</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      {t('editButton')}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      {t('removeButton')}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="ชัชพงศ์ อินทร์ทอง" /></td>
                <td>
                  <select defaultValue="guard">
                    <option value="guard">{roleNames.guard}</option>
                    <option value="supervisor">{roleNames.supervisor}</option>
                    <option value="senior">{roleNames.senior}</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="44" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">{t('noneLabel')}</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue={locale.shiftNightName} />
                  <div className="chips prefs-preview">
                    <span className="chip">{locale.shiftNightName}</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      {t('editButton')}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      {t('removeButton')}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="วิภา จิตติ" /></td>
                <td>
                  <select defaultValue="senior">
                    <option value="guard">{roleNames.guard}</option>
                    <option value="supervisor">{roleNames.supervisor}</option>
                    <option value="senior">{roleNames.senior}</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="42" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">{t('noneLabel')}</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue={locale.shiftMorningName} />
                  <div className="chips prefs-preview">
                    <span className="chip">{locale.shiftMorningName}</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      {t('editButton')}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      {t('removeButton')}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><input type="text" defaultValue="อดิเทพ รัตนกุล" /></td>
                <td>
                  <select defaultValue="guard">
                    <option value="guard">{roleNames.guard}</option>
                    <option value="supervisor">{roleNames.supervisor}</option>
                    <option value="senior">{roleNames.senior}</option>
                  </select>
                </td>
                <td><input type="number" defaultValue="36" min="1" /></td>
                <td>
                  <input type="hidden" className="unavail-input" defaultValue="" />
                  <div className="chips unavail-preview">
                    <span className="muted">{t('noneLabel')}</span>
                  </div>
                </td>
                <td>
                  <input type="hidden" className="prefs-input" defaultValue={locale.shiftAfternoonName} />
                  <div className="chips prefs-preview">
                    <span className="chip">{locale.shiftAfternoonName}</span>
                  </div>
                </td>
                <td>
                  <input type="checkbox" className="spare-flag" defaultChecked />
                </td>
                <td>
                  <div className="inline">
                    <button className="btn btn-primary" type="button" onClick={handleOpenEmployeeConfig}>
                      {t('editButton')}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleRemoveEmployee}>
                      {t('removeButton')}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-secondary" type="button" onClick={addEmployee}>
            {t('addEmployeeButton')}
          </button>

          <h3 style={{ margin: '22px 0 10px' }}>{t('holidayRegisterTitle')}</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <table className="mini-table" aria-label={t('holidayRegisterTitle')}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>{t('holidayDateHeader')}</th>
                    <th style={{ width: '55%' }}>{t('holidayNameHeader')}</th>
                    <th>{t('actionsHeader')}</th>
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
                  {t('addHolidayButton')}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => loadDefaultHolidaysForCountry().catch(() => {})}
                >
                  {t('loadCountryDefaultsButton')}
                </button>
                <button className="btn btn-danger" type="button" onClick={clearHolidayTable}>
                  {t('clearAllButton')}
                </button>
              </div>
              <p className="muted" style={{ marginTop: '6px' }}>
                {t('holidayHint')}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '22px' }}>
            <button id="startTest" className="btn btn-primary" type="button">
              {t('generateScheduleButton')}
            </button>
          </div>
        </div>

        <div className="test-section" id="resultsContainer" style={{ display: 'none' }}>
          <h2 className="section-title">{t('resultsTitle')}</h2>
          <div className="results-grid">
            <div className="metric-card">
              <h3>{t('coverageRateTitle')}</h3>
              <div className="metric-value" id="coverageRate">
                0%
              </div>
              <p>{t('coverageRateSubtitle')}</p>
            </div>
            <div className="metric-card">
              <h3>{t('roleComplianceTitle')}</h3>
              <div className="metric-value" id="roleCompliance">
                0%
              </div>
              <p>{t('roleComplianceSubtitle')}</p>
            </div>
            <div className="metric-card">
              <h3>{t('constraintTitle')}</h3>
              <div className="metric-value" id="constraintCompliance">
                0%
              </div>
              <p>{t('constraintSubtitle')}</p>
            </div>
            <div className="metric-card">
              <h3>{t('processingTimeTitle')}</h3>
              <div className="metric-value" id="processingTime">
                0ms
              </div>
              <p>{t('processingTimeSubtitle')}</p>
            </div>
          </div>
          <div className="tabs">
            <button className="tab active" type="button" onClick={(event) => switchTab(event, 'siteView')}>
              {t('siteTab')}
            </button>
            <button className="tab" type="button" onClick={(event) => switchTab(event, 'personView')}>
              {t('personalTab')}
            </button>
            <button className="tab" type="button" onClick={(event) => switchTab(event, 'constraintView')}>
              {t('constraintTab')}
            </button>
          </div>
          <div className="tab-content active" id="siteView">
            <h3>{t('siteTab')}</h3>
            <p>
              {t('schedulePeriodLabel')}: <span id="schedulePeriodDisplay" />
            </p>
            <div className="calendar-toolbar">
              <div className="toolbar-group">
                <label htmlFor="calendarMode">{t('windowLabel')}</label>
                <select id="calendarMode" defaultValue="week">
                  <option value="week">{t('toolbarWeek')}</option>
                  <option value="month">{t('toolbarMonth')}</option>
                </select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="calendarMonth">{t('monthLabel')}</label>
                <select id="calendarMonth"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="calendarYear">{t('yearLabel')}</label>
                <select id="calendarYear"></select>
              </div>
              <div className="toolbar-group week-controls" id="calendarWeekControls">
                <button className="btn btn-secondary" type="button" id="calendarPrevWeek" aria-label={t('previous')}>
                  &lt;
                </button>
                <span id="calendarWeekLabel">{weekPlaceholder}</span>
                <button className="btn btn-secondary" type="button" id="calendarNextWeek" aria-label={t('next')}>
                  &gt;
                </button>
              </div>
            </div>
            <div className="calendar-view" id="siteCalendar" />
          </div>
          <div className="tab-content" id="personView">
            <h3>{t('personalTab')}</h3>
            <div className="calendar-toolbar personal-toolbar">
              <div className="toolbar-group">
                <label htmlFor="personalEmployeeSelect">{t('employeeLabel')}</label>
                <select id="personalEmployeeSelect"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalMode">{t('windowLabel')}</label>
                <select id="personalMode" defaultValue="week">
                  <option value="week">{t('toolbarWeek')}</option>
                  <option value="month">{t('toolbarMonth')}</option>
                </select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalMonth">{t('monthLabel')}</label>
                <select id="personalMonth"></select>
              </div>
              <div className="toolbar-group">
                <label htmlFor="personalYear">{t('yearLabel')}</label>
                <select id="personalYear"></select>
              </div>
              <div className="toolbar-group week-controls" id="personalWeekControls">
                <button className="btn btn-secondary" type="button" id="personalPrevWeek" aria-label={t('previous')}>
                  &lt;
                </button>
                <span id="personalWeekLabel">{weekPlaceholder}</span>
                <button className="btn btn-secondary" type="button" id="personalNextWeek" aria-label={t('next')}>
                  &gt;
                </button>
              </div>
            </div>
            <div className="personal-summary" id="personalSummary" />
            <div className="personal-calendar" id="personalCalendar" />
          </div>
          <div className="tab-content" id="constraintView">
            <h3>{t('constraintTab')}</h3>
            <div className="schedule-visualization">
              <h4>{t('constraintWeeklyHours')}</h4>
              <div id="hoursAnalysis" />
            </div>
            <div className="schedule-visualization">
              <h4>{t('constraintConsecutiveDays')}</h4>
              <div id="consecutiveAnalysis" />
            </div>
          </div>
          <div className="export-controls">
            <div className="export-control">
              <label htmlFor="exportFormat">{t('exportFormatLabel')}</label>
              <select id="exportFormat" defaultValue="pdf">
                <option value="pdf">{t('exportFormatPdf')}</option>
                <option value="html">{t('exportFormatHtml')}</option>
                <option value="json">{t('exportFormatJson')}</option>
                <option value="excel">{t('exportFormatExcel')}</option>
              </select>
            </div>
            <div className="export-buttons">
              <button id="previewExport" className="btn btn-secondary btn-compact" type="button">
                {t('previewButton')}
              </button>
              <button id="exportResults" className="btn btn-primary" type="button">
                {t('exportButton')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="employeeConfigOverlay" className="config-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div className="config-panel">
          <div className="config-header">
            <h2>{t('employeeConfigTitle')}</h2>
            <div className="inline">
              <button className="btn btn-secondary" type="button" onClick={handleCloseEmployeeConfig}>
                {t('closeButton')}
              </button>
            </div>
          </div>
          <div className="config-section">
            <div className="form-group">
              <label htmlFor="cfgName">{t('employeeNameHeader')}</label>
              <input id="cfgName" type="text" />
            </div>
            <div className="form-group">
              <label htmlFor="cfgRole">{t('roleHeader')}</label>
              <select id="cfgRole" defaultValue="guard">
                <option value="guard">{roleNames.guard}</option>
                <option value="supervisor">{roleNames.supervisor}</option>
                <option value="senior">{roleNames.senior}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cfgHours">{t('maxHoursHeader')}</label>
              <input id="cfgHours" type="number" min="1" defaultValue="48" />
            </div>
            <div className="form-group">
              <label className="inline" style={{ gap: '8px' }}>
                <input id="cfgSpare" type="checkbox" /> {t('markAsSpare')}
              </label>
            </div>
          </div>
          <div className="config-section">
            <label>{t('unavailRegisterTitle')}</label>
            <table className="mini-table" aria-label={t('unavailRegisterTitle')}>
              <thead>
                <tr>
                  <th style={{ width: '70%' }}>{t('holidayDateHeader')}</th>
                  <th>{t('actionsHeader')}</th>
                </tr>
              </thead>
              <tbody id="cfgUnavailBody" />
            </table>
            <div style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary" type="button" onClick={handleAddUnavailabilityRow}>
                {t('addDateButton')}
              </button>
            </div>
          </div>
          <div className="config-section">
            <label>{t('preferredShiftsHeader')}</label>
            <div id="cfgShiftChecks" className="inline" style={{ flexWrap: 'wrap', gap: '14px' }} />
            <p className="muted" style={{ marginTop: '6px' }}>
              {t('preferredShiftsHint')}
            </p>
          </div>
          <div className="config-section">
            <button className="btn btn-primary" type="button" onClick={saveEmployeeConfig}>
              {t('saveButton')}
            </button>
          </div>
        </div>
      </div>

      <div id="dayDetailOverlay" className="detail-overlay" aria-modal="true" aria-hidden="true">
        <div className="day-panel">
          <div className="day-head">
            <h2 id="dayTitle">{t('dayDetailTitle')}</h2>
            <div className="inline">
              <button className="btn btn-secondary" type="button" onClick={handleCloseDayDetail}>
                {t('closeButton')}
              </button>
            </div>
          </div>
          <div id="dayMeta" className="meta" />
          <div className="day-toolbar">
            <div className="day-toolbar-left">
              <label htmlFor="dayShiftTemplate">{t('addShiftLabel')}</label>
              <div className="inline compact">
                <select id="dayShiftTemplate" />
                <button className="btn btn-secondary btn-compact" type="button" id="dayAddShift">
                  {t('addShiftButton')}
                </button>
              </div>
            </div>
            <div className="day-toolbar-right">
              <span id="dayPendingHint" className="pending-hint">
                {t('unsavedChanges')}
              </span>
              <button className="btn btn-secondary btn-compact" type="button" id="dayDiscardChanges">
                {t('discardButton')}
              </button>
              <button className="btn btn-primary btn-compact" type="button" id="daySaveChanges" disabled>
                {t('saveButton')}
              </button>
            </div>
          </div>
          <div className="gantt-wrap">
            <div className="gantt-legend">
              <span>
                <span className="legend-dot legend-guard" /> {roleNames.guard}
              </span>
              <span>
                <span className="legend-dot legend-supervisor" /> {roleNames.supervisor}
              </span>
              <span>
                <span className="legend-dot legend-senior" /> {roleNames.senior}
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
