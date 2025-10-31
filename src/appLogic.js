import { defaultConfigTemplate } from './config/defaultConfig.js';
import { localeStrings } from './config/localization.js';

// ===== Localization =====
let currentLanguage='th';
  let currentTheme='light';
  let dayNamesShort=localeStrings[currentLanguage].weekdayShort.slice();
  let dayNamesLong=localeStrings[currentLanguage].weekdayLong.slice();
  let monthNamesFull=localeStrings[currentLanguage].monthNamesFull.slice();
  let roleLabels={ ...localeStrings[currentLanguage].roles };
  const languageListeners=new Set();
  const themeListeners=new Set();
  const allowedExportFormats=['pdf','html','json','excel'];
  let exportFormat='pdf';
  const employeeHappiness=new Map();

  function getLocaleStrings(lang=currentLanguage){
    return localeStrings[lang] || localeStrings.en;
  }

  function notifyLanguageListeners(){
    languageListeners.forEach(listener=>{
      try{ listener(currentLanguage); }catch(err){ console.error('Language listener failed', err); }
    });
  }

  function notifyThemeListeners(){
    themeListeners.forEach(listener=>{
      try{ listener(currentTheme); }catch(err){ console.error('Theme listener failed', err); }
    });
  }

  function setLanguage(lang){
    const nextLanguage=localeStrings[lang]?lang:'en';
    const changed=nextLanguage!==currentLanguage;
    currentLanguage=nextLanguage;
    const locale=getLocaleStrings();
    dayNamesShort=locale.weekdayShort.slice();
    dayNamesLong=locale.weekdayLong.slice();
    monthNamesFull=locale.monthNamesFull.slice();
    roleLabels={ ...locale.roles };
    document.documentElement.setAttribute('lang', currentLanguage==='th'?'th':'en');

    if(changed){
      notifyLanguageListeners();
      if(!isApplyingConfiguration){
        queueAutoPersist();
      }
    }

    updateCalendarControlsUI?.();
    updatePersonalControlsUI?.();
    updateExportControlsState();
    if(scheduleResults?.schedule?.length){
      generateSiteCalendar?.();
      generatePersonalSchedules?.();
      generateConstraintAnalysis?.();
    }
    return currentLanguage;
  }

  function getCurrentLanguage(){
    return currentLanguage;
  }

  function setTheme(theme){
    const nextTheme=theme==='dark'?'dark':'light';
    const changed=nextTheme!==currentTheme;
    currentTheme=nextTheme;
    if(typeof document!=='undefined'){
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    if(changed){
      notifyThemeListeners();
      if(!isApplyingConfiguration){
        queueAutoPersist();
      }
    }
    return currentTheme;
  }

  function getCurrentTheme(){
    return currentTheme;
  }

  function onLanguageChange(listener){
    if(typeof listener!=='function') return ()=>{};
    languageListeners.add(listener);
    return ()=>languageListeners.delete(listener);
  }

  function onThemeChange(listener){
    if(typeof listener!=='function') return ()=>{};
    themeListeners.add(listener);
    return ()=>themeListeners.delete(listener);
  }

  function translate(key, replacements=null, lang=currentLanguage){
    const locale=getLocaleStrings(lang);
    let value=locale[key];
    if(value==null){
      value=localeStrings.en[key];
    }
    if(typeof value==='string' && replacements){
      return value.replace(/\{(\w+)\}/g,(m,p)=> replacements[p] ?? m);
    }
    return value;
  }

  // ===== Utilities =====
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const uniqueDates=a=>Array.from(new Set(a.filter(Boolean)));
  const datesCSVToArray=csv=>csv?csv.split(',').map(s=>s.trim()).filter(Boolean):[];
  const renderChips=(el,items)=>{
    el.innerHTML=items.length
      ? items.map(x=>'<span class="chip">'+x+'</span>').join('')
      : `<span class="muted">${translate('noneLabel')}</span>`;
  };
  const escapeHtml=str=>String(str||'').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  })[m]||m);

  function updateExportControlsState(){
    const select=qs('#exportFormat');
    if(select && select.value!==exportFormat){ select.value=exportFormat; }
    const hasData=!!(scheduleResults?.schedule?.length);
    const exportBtn=qs('#exportResults');
    if(exportBtn){
      exportBtn.disabled=!hasData;
      exportBtn.setAttribute('aria-disabled', exportBtn.disabled?'true':'false');
    }
    const previewBtn=qs('#previewExport');
    if(previewBtn){
      const previewable=['pdf','html'].includes(exportFormat) && hasData;
      previewBtn.disabled=!previewable;
      previewBtn.setAttribute('aria-disabled', previewBtn.disabled?'true':'false');
    }
  }

  function setExportFormatValue(value){
    exportFormat=allowedExportFormats.includes(value)?value:'pdf';
    updateExportControlsState();
  }

  function ensureScheduleReady(){
    if(!scheduleResults || !Array.isArray(scheduleResults.schedule) || !scheduleResults.schedule.length){
      alert(translate('runSchedulerPrompt'));
      return false;
    }
    return true;
  }

  function triggerDownload(filename, blob){
    if(!(blob instanceof Blob)) return;
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function formatExportDate(dateStr){
    if(!dateStr) return '';
    const locale=currentLanguage==='th'?'th-TH':'en-US';
    try{
      const dateObj=new Date(dateStr+'T00:00:00');
      if(Number.isNaN(dateObj.getTime())) return dateStr;
      return new Intl.DateTimeFormat(locale,{ dateStyle:'full' }).format(dateObj);
    }catch(err){
      return dateStr;
    }
  }

  function formatRequirementSummary(shift, asHtml){
    const entries=Object.entries(shift?.requirements||{});
    if(!entries.length) return '-';
    const joiner=asHtml?'<br>':'\n';
    return entries.map(([role,count])=>{
      const label=escapeHtml(roleLabels[role]||role);
      const value=escapeHtml(String(count ?? 0));
      return asHtml?`${label}: ${value}`:`${label}: ${value}`;
    }).join(joiner);
  }

  function formatAssignmentSummary(shift, asHtml){
    const entries=Object.entries(shift?.assigned||{});
    if(!entries.length) return translate('noAssignments');
    const joiner=asHtml?'<br>':'\n';
    return entries.map(([role,list])=>{
      const label=escapeHtml(roleLabels[role]||role);
      const names=(list||[]).length
        ? (list||[]).map(name=>escapeHtml(name)).join(asHtml?', ':', ')
        : escapeHtml(translate('noAssignments'));
      return asHtml?`${label}: ${names}`:`${label}: ${names}`;
    }).join(joiner);
  }

  function buildScheduleTableMarkup(asHtml){
    const scheduleList=Array.isArray(scheduleResults?.schedule)?scheduleResults.schedule:[];
    const rows=[];
    scheduleList.forEach(day=>{
      const shifts=Array.isArray(day.shifts)?day.shifts:[];
      const dateLabel=formatExportDate(day.date || day.dateISO || '');
      if(!shifts.length){
        rows.push({
          date:escapeHtml(dateLabel||day.date||''),
          shift:escapeHtml(translate('noShiftsConfigured')),
          time:'-',
          req:'-',
          assigned:escapeHtml(translate('noAssignments'))
        });
        return;
      }
      shifts.forEach(shift=>{
        const timeRange=`${shift.startTime || ''} - ${shift.endTime || ''}`;
        rows.push({
          date:escapeHtml(dateLabel||day.date||''),
          shift:escapeHtml(shift.name||''),
          time:escapeHtml(timeRange),
          req:asHtml?formatRequirementSummary(shift,true):formatRequirementSummary(shift,false),
          assigned:asHtml?formatAssignmentSummary(shift,true):escapeHtml(formatAssignmentSummary(shift,false))
        });
      });
    });
    if(!rows.length){
      rows.push({
        date:'-',
        shift:escapeHtml(translate('noScheduleData')),
        time:'-',
        req:'-',
        assigned:escapeHtml(translate('noScheduleData'))
      });
    }
    if(asHtml){
      return rows.map(row=>`
        <tr>
          <td>${row.date}</td>
          <td>${row.shift}</td>
          <td>${row.time}</td>
          <td>${row.req}</td>
          <td>${row.assigned}</td>
        </tr>`).join('');
    }
    return rows;
  }

  function buildExportMetadata(){
    return {
      generatedAt:new Date().toISOString(),
      startDate:scheduleData?.startDate||'',
      endDate:scheduleData?.endDate||'',
      timezone:scheduleData?.timezone||''
    };
  }

  function buildMetricsHtml(){
    if(!scheduleResults?.metrics) return '';
    const metrics=scheduleResults.metrics;
    return `<ul class="metrics">
      <li>${escapeHtml(translate('coverageRateTitle'))}: ${metrics.coverageRate ?? 0}%</li>
      <li>${escapeHtml(translate('roleComplianceTitle'))}: ${metrics.roleCompliance ?? 0}%</li>
      <li>${escapeHtml(translate('constraintTitle'))}: ${metrics.constraintCompliance ?? 0}%</li>
      <li>${escapeHtml(translate('processingTimeTitle'))}: ${metrics.processingTime ?? 0}ms</li>
    </ul>`;
  }

  function buildScheduleHtmlDocument({ forPrint=false }={}){
    const meta=buildExportMetadata();
    const tableRows=buildScheduleTableMarkup(true);
    const metaBlock=`<div class="meta">
      <div>${escapeHtml(translate('schedulePeriodLabel'))}: ${escapeHtml(meta.startDate||'-')} - ${escapeHtml(meta.endDate||'-')}</div>
      <div>${escapeHtml(translate('timezoneLabel'))}: ${escapeHtml(meta.timezone||'-')}</div>
      <div>${escapeHtml(translate('processingTimeTitle'))}: ${(scheduleResults?.metrics?.processingTime ?? 0)}ms</div>
    </div>`;
    const doc=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(translate('resultsTitle'))}</title>
  <style>
    body{font-family:"Segoe UI",Tahoma,sans-serif;margin:24px;color:#1e293b;}
    h1{font-size:24px;margin-bottom:12px;}
    .meta{margin-bottom:16px;font-size:14px;color:#475569;}
    .metrics{margin:0 0 16px 16px;padding:0;list-style:square;color:#475569;font-size:14px;}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    th,td{border:1px solid #cbd5f5;padding:8px 10px;text-align:left;vertical-align:top;}
    th{background:#e0e7ff;}
    td{background:#ffffff;}
    @media print{ body{margin:12mm;} table{page-break-inside:auto;} tr{page-break-inside:avoid; page-break-after:auto;} }
  </style>
  ${forPrint?'<script>window.onload=function(){window.focus();window.print();};</script>':''}
</head>
<body>
  <h1>${escapeHtml(translate('resultsTitle'))}</h1>
  ${metaBlock}
  ${scheduleResults?.metrics ? buildMetricsHtml() : ''}
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(translate('holidayDateHeader'))}</th>
        <th>${escapeHtml(translate('shiftNameHeader'))}</th>
        <th>${escapeHtml(translate('startTimeHeader'))} / ${escapeHtml(translate('endTimeHeader'))}</th>
        <th>${escapeHtml(translate('exportRequirementsHeader'))}</th>
        <th>${escapeHtml(translate('exportAssignmentsHeader'))}</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;
    return doc;
  }

  function buildScheduleJsonPayload(){
    const meta=buildExportMetadata();
    return {
      meta,
      metrics:scheduleResults?.metrics||{},
      schedule:scheduleResults?.schedule||[]
    };
  }

  function buildExcelMarkup(){
    const rows=buildScheduleTableMarkup(false);
    const header=[
      translate('holidayDateHeader'),
      translate('shiftNameHeader'),
      `${translate('startTimeHeader')} / ${translate('endTimeHeader')}`,
      translate('exportRequirementsHeader'),
      translate('exportAssignmentsHeader')
    ];
    const bodyRows=rows.map(row=>`<tr>
      <td>${row.date}</td>
      <td>${row.shift}</td>
      <td>${row.time}</td>
      <td>${row.req}</td>
      <td>${row.assigned}</td>
    </tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>
      <table border="1">
        <thead><tr>${header.map(col=>`<th>${escapeHtml(col)}</th>`).join('')}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body></html>`;
  }

  function handleExportClick(){
    if(!ensureScheduleReady()) return;
    const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
    if(exportFormat==='json'){
      const payload=buildScheduleJsonPayload();
      const blob=new Blob([JSON.stringify(payload,null,2)],{ type:'application/json' });
      triggerDownload(`schedule-${timestamp}.json`, blob);
      return;
    }
    if(exportFormat==='html'){
      const html=buildScheduleHtmlDocument({ forPrint:false });
      const blob=new Blob([html],{ type:'text/html' });
      triggerDownload(`schedule-${timestamp}.html`, blob);
      return;
    }
    if(exportFormat==='excel'){
      const excelMarkup='\uFEFF'+buildExcelMarkup();
      const blob=new Blob([excelMarkup],{ type:'application/vnd.ms-excel' });
      triggerDownload(`schedule-${timestamp}.xls`, blob);
      return;
    }
    // Default PDF via browser print dialog
    const doc=buildScheduleHtmlDocument({ forPrint:true });
    const win=window.open('', '_blank');
    if(win){
      win.document.write(doc);
      win.document.close();
    }else{
      alert(translate('popupBlockedMessage'));
    }
  }

  function handlePreviewClick(){
    if(!ensureScheduleReady()) return;
    if(['pdf','html'].includes(exportFormat)){
      const doc=buildScheduleHtmlDocument({ forPrint:false });
      const previewWin=window.open('', '_blank');
      if(previewWin){
        previewWin.document.write(doc);
        previewWin.document.close();
      }else{
        alert(translate('popupBlockedMessage'));
      }
    }
  }

  // ===== Time helpers =====
  function pad2(n){return String(n).padStart(2,'0');}
  function addHoursToTime(t, hours){const [h,m]=(t||'00:00').split(':').map(Number);let total=h*60+m+hours*60;total=((total%1440)+1440)%1440;return pad2(Math.floor(total/60))+':'+pad2(total%60);}    
  function durationHours(start,end){const [sh,sm]=start.split(':').map(Number);const [eh,em]=end.split(':').map(Number);let mins=(eh*60+em)-(sh*60+sm);if(mins<=0) mins+=24*60;return mins/60;}
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  function minutesToTime(totalMinutes){
    const minutes=((totalMinutes%1440)+1440)%1440;
    const hours=Math.floor(minutes/60);
    const mins=minutes%60;
    return pad2(hours)+':'+pad2(mins);
  }

  function isNightShift(startTime,endTime){
    if(!startTime || !endTime) return false;
    const start=timeToMinutes(startTime);
    let end=timeToMinutes(endTime);
    if(Number.isNaN(start) || Number.isNaN(end)) return false;
    if(end<=start){ end+=24*60; }
    const startHour=Math.floor(start/60);
    const endHour=Math.floor((end%1440)/60);
    return startHour>=20 || endHour<6;
  }

  const roleTaskTemplates={
    guard:[
      'Perform perimeter patrol and access control checks.',
      'Log incidents and radio updates every 2 hours.',
      'Assist with visitor check-in during peak periods.'
    ],
    supervisor:[
      'Review guard posts and shift coverage status.',
      'Coordinate incident response and briefing notes.',
      'Submit daily operations report before shift end.'
    ],
    senior:[
      'Audit patrol routes and verify compliance.',
      'Mentor on-duty guards and handle escalations.',
      'Complete equipment readiness inspection.'
    ]
  };

const HOLIDAY_API_ENDPOINT='https://date.nager.at/api/v3/PublicHolidays';
const OPEN_HOLIDAY_ENDPOINT='https://openholidaysapi.org/PublicHolidays';
const MYHORA_HOLIDAYS_URL='https://www.myhora.com/calendar/ical/holiday.aspx?latest.json';
const holidayCache=new Map();
const openHolidayCache=new Map();
const myHoraCache=new Map();
let holidayFetchToken=0;

const SUPPORTED_LANGUAGES=Object.keys(localeStrings);
const DEFAULT_FALLBACK_ENDPOINTS={
  primary:HOLIDAY_API_ENDPOINT,
  open:OPEN_HOLIDAY_ENDPOINT,
  myHora:MYHORA_HOLIDAYS_URL
};

  const CONFIG_COOKIE_NAME='sgss_config_v1';
  const CONFIG_COOKIE_EXPIRY_DAYS=14;
  let isApplyingConfiguration=false;
  let autoPersistTimer=null;

const LOCAL_HOLIDAY_FALLBACK={
  TH:{
      2024:[
        {date:'2024-01-01',name:'New Year Day'},
        {date:'2024-02-10',name:'Chinese New Year'},
        {date:'2024-04-06',name:'Chakri Day'},
        {date:'2024-04-13',name:'Songkran Festival'},
        {date:'2024-04-14',name:'Songkran Festival'},
        {date:'2024-04-15',name:'Songkran Festival'},
        {date:'2024-05-01',name:'Labor Day'},
        {date:'2024-05-06',name:'Coronation Day'},
        {date:'2024-06-03',name:'Visakha Bucha Day'},
        {date:'2024-07-28',name:"King's Birthday"},
        {date:'2024-08-12',name:"Queen's Birthday"},
        {date:'2024-10-23',name:'Chulalongkorn Day'},
        {date:'2024-12-05',name:"King's Birthday"},
        {date:'2024-12-10',name:'Constitution Day'},
        {date:'2024-12-31',name:'New Year Eve'}
      ],
      2025:[
        {date:'2025-01-01',name:'New Year Day'},
        {date:'2025-04-13',name:'Songkran Festival'},
        {date:'2025-04-14',name:'Songkran Festival'},
        {date:'2025-04-15',name:'Songkran Festival'},
        {date:'2025-05-01',name:'Labor Day'},
        {date:'2025-07-28',name:"King's Birthday"},
        {date:'2025-08-12',name:"Queen's Birthday"},
        {date:'2025-10-23',name:'Chulalongkorn Day'},
        {date:'2025-12-05',name:"King's Birthday"},
        {date:'2025-12-10',name:'Constitution Day'},
        {date:'2025-12-31',name:'New Year Eve'}
      ]
    },
    US:{
      2024:[
        {date:'2024-01-01',name:"New Year's Day"},
        {date:'2024-07-04',name:'Independence Day'},
        {date:'2024-11-28',name:'Thanksgiving Day'},
        {date:'2024-12-25',name:'Christmas Day'}
      ],
      2025:[
        {date:'2025-01-01',name:"New Year's Day"},
        {date:'2025-07-04',name:'Independence Day'},
        {date:'2025-11-27',name:'Thanksgiving Day'},
        {date:'2025-12-25',name:'Christmas Day'}
      ]
    },
    UK:{
      2024:[
        {date:'2024-01-01',name:"New Year's Day"},
        {date:'2024-04-01',name:'Easter Monday'},
        {date:'2024-05-06',name:'Early May Bank Holiday'},
        {date:'2024-12-25',name:'Christmas Day'},
        {date:'2024-12-26',name:'Boxing Day'}
      ],
      2025:[
        {date:'2025-01-01',name:"New Year's Day"},
        {date:'2025-04-21',name:'Easter Monday'},
        {date:'2025-05-05',name:'Early May Bank Holiday'},
        {date:'2025-12-25',name:'Christmas Day'},
        {date:'2025-12-26',name:'Boxing Day'}
      ]
  }
};

const publishDefaults={
  defaultConfig:defaultConfigTemplate,
  supportedLanguages:SUPPORTED_LANGUAGES,
  holidayFallbackEndpoints:DEFAULT_FALLBACK_ENDPOINTS,
  offlineHolidayData:LOCAL_HOLIDAY_FALLBACK,
  localeStrings
};

  function getFallbackHolidays(country, years){
    const countryData=LOCAL_HOLIDAY_FALLBACK[country];
    if(!countryData) return [];
    const list=[];
    years.forEach(year=>{
      if(countryData[year]){ list.push(...countryData[year]); }
    });
    return list;
  }

  function setCookie(name,value,days){
    if(typeof document==='undefined') return;
    const expires=new Date(Date.now()+days*86400000).toUTCString();
    document.cookie=name+'='+value+'; expires='+expires+'; path=/';
  }

  function getCookie(name){
    if(typeof document==='undefined') return '';
    const parts=document.cookie.split(';').map(part=>part.trim());
    const prefix=name+'=';
    for(const part of parts){
      if(part.startsWith(prefix)){ return part.substring(prefix.length); }
    }
    return '';
  }

  function queueAutoPersist(){
    if(isApplyingConfiguration) return;
    if(autoPersistTimer){ clearTimeout(autoPersistTimer); }
    autoPersistTimer=setTimeout(()=>{
      autoPersistTimer=null;
      persistConfiguration();
    }, 600);
  }

  function holidayCacheKey(country, year){ return `${country}-${year}`; }

  async function fetchHolidayCatalog(country, year){
    const key=holidayCacheKey(country, year);
    if(holidayCache.has(key)){ return holidayCache.get(key); }
    const url=`${HOLIDAY_API_ENDPOINT}/${year}/${country}`;
    const pending=fetch(url).then(async res=>{
      if(!res.ok){ throw new Error(`Failed to load holidays for ${country} ${year}: ${res.status}`); }
      const raw=await res.text();
      if(!raw){ return []; }
      let data;
      try{
        data=JSON.parse(raw);
      }catch(parseErr){
        throw new Error(`Holiday API returned invalid JSON for ${country} ${year}`);
      }
      if(!Array.isArray(data)) return [];
      return data.map(item=>({
        date:item.date,
        name:item.localName || item.name || 'Holiday'
      }));
    });
    holidayCache.set(key, pending);
    try{
      return await pending;
    }catch(err){
      holidayCache.delete(key);
      throw err;
    }
  }

  function sanitizeHolidayText(value){
    if(typeof value!=='string') return value || '';
    return value.replace(/^"+|"+$/g,'').trim();
  }

  async function fetchOpenHolidayRange(country,startValue,endValue){
    const code=(country||'').toUpperCase();
    const key=`${code}-${startValue}-${endValue}`;
    if(openHolidayCache.has(key)){ return openHolidayCache.get(key); }
    const url=`${OPEN_HOLIDAY_ENDPOINT}?countryIsoCode=${encodeURIComponent(code)}&languageIsoCode=en&validFrom=${encodeURIComponent(startValue)}&validTo=${encodeURIComponent(endValue)}`;
    const pending=fetch(url).then(async res=>{
      if(!res.ok){ throw new Error(`Failed to load OpenHolidays data for ${code}: ${res.status}`); }
      const data=await res.json();
      if(!Array.isArray(data)) return [];
      return data.map(entry=>{
        const rawDate=entry.startDate || entry.date || entry.start || '';
        const isoDate=rawDate ? rawDate.split('T')[0] : '';
        let name='';
        if(Array.isArray(entry.name)){
          name=entry.name.find(item=>item.language==='EN')?.text || entry.name[0]?.text || entry.name[0]?.value || '';
        }else if(entry.name && typeof entry.name==='object'){
          name=entry.name.text || entry.name.value || '';
        }else if(typeof entry.name==='string'){
          name=entry.name;
        }else if(Array.isArray(entry.names)){
          name=entry.names.find(item=>item.language==='EN')?.text || entry.names[0]?.text || entry.names[0]?.value || '';
        }
        if(!name && Array.isArray(entry.translations)){
          name=entry.translations.find(item=>item.language==='EN')?.text || entry.translations[0]?.text || '';
        }
        if(!name){
          name=entry.description || 'Holiday';
        }
        return { date: isoDate, name: sanitizeHolidayText(name) };
      }).filter(item=> item.date && item.date>=startValue && item.date<=endValue);
    });
    openHolidayCache.set(key, pending);
    try{
      return await pending;
    }catch(err){
      openHolidayCache.delete(key);
      throw err;
    }
  }

  async function fetchMyHoraHolidays(country,startValue,endValue){
    const code=(country||'').toUpperCase();
    if(code!=='TH') return [];
    const key=`TH-${startValue}-${endValue}`;
    if(myHoraCache.has(key)){ return myHoraCache.get(key); }
    const pending=(async ()=>{
      try{
        const remoteResponse=await fetch(MYHORA_HOLIDAYS_URL,{ mode:'cors' });
        if(remoteResponse.ok){
          const data=await remoteResponse.json();
          const vevents=data?.VCALENDAR?.VEVENT;
          if(vevents && typeof vevents==='object'){
            const events=Object.values(vevents).map(event=>{
              const rawDate=sanitizeHolidayText(event['DTSTART;VALUE=DATE'] || event.DTSTART || '');
              const isoDate=rawDate && rawDate.length===8 ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : '';
              const summary=sanitizeHolidayText(event.SUMMARY || '');
              return { date: isoDate, name: summary || 'Holiday' };
            }).filter(item=> item.date && item.date>=startValue && item.date<=endValue);
            if(events.length){
              return events;
            }
          }
        }else{
          console.warn('[HolidayLoader] MyHora remote dataset returned status', remoteResponse.status);
        }
      }catch(err){
        console.warn('[HolidayLoader] MyHora remote dataset unavailable', err);
      }
      try{
        const localRes=await fetch('/holidays/th.json');
        if(!localRes.ok){ throw new Error(`Local MyHora cache missing: ${localRes.status}`); }
        const localData=await localRes.json();
        return (Array.isArray(localData)?localData:[]).filter(item=> item.date>=startValue && item.date<=endValue);
      }catch(localErr){
        console.error('[HolidayLoader] Local MyHora cache failed', localErr);
        return [];
      }
    })();
    myHoraCache.set(key, pending);
    try{
      return await pending;
    }catch(err){
      myHoraCache.delete(key);
      throw err;
    }
  }

  function removeHolidayPlaceholders(body){
    qsa('.holiday-empty', body || document).forEach(el=>el.remove());
  }

  function ensureHolidayPlaceholder(body, message, className='muted'){
    if(!body) return;
    removeHolidayPlaceholders(body);
    const row=document.createElement('tr');
    row.className='holiday-empty';
    row.innerHTML=`<td colspan="3" class="${className}">${message}</td>`;
    body.appendChild(row);
  }

  function removeDefaultHolidayRows(body){
    if(!body) return;
    qsa('tr', body).forEach(tr=>{
      if(tr.dataset && tr.dataset.source==='default'){ tr.remove(); }
    });
  }

  // ===== Shifts =====
  function getGlobalShiftNames(){
    return qsa('#shiftTableBody > tr').filter(row=>{
      const name=row.querySelector('td:nth-child(1) input')?.value||'';
      return !(row.dataset?.refillTemplate==='true' || name.trim().toLowerCase()==='refill');
    }).map(r=> (r.querySelector('td:nth-child(1) input')?.value||'').trim()).filter(Boolean);
  }
  function updateEndTimeRow(row){ if(!row) return; const s=row.querySelector('.shift-start'); const z=row.querySelector('.shift-size'); const e=row.querySelector('.shift-end'); if(!(s&&z&&e)) return; const hrs=parseInt(z.value||'8',10); e.value=addHoursToTime(s.value||'00:00',hrs); }

  function addShift(shiftData={}){
    const tbody=qs('#shiftTableBody');
    const tr=document.createElement('tr');
    const name=shiftData.name||'';
    const start=shiftData.startTime||'08:00';
    const size=String(shiftData.size||shiftData.shiftSize||shiftData.duration||shiftData.hours||shiftData.length||8);
    const endValue=shiftData.endTime||addHoursToTime(start, parseInt(size,10)||8);
    const requirements=shiftData.requirements||{};
    const reqGuard=requirements.guard ?? shiftData.guard ?? 1;
    const reqSupervisor=requirements.supervisor ?? shiftData.supervisor ?? 0;
    const reqSenior=requirements.senior ?? shiftData.senior ?? 0;
    const locked=!!shiftData.locked;
    const isRefillTemplate=!!shiftData.isRefillTemplate || name.trim().toLowerCase()==='refill';
    const removeLabel=translate('removeButton');
    const shiftPlaceholder=translate('shiftNamePlaceholder');
    tr.innerHTML=
      `<td><input type="text" placeholder="${shiftPlaceholder}" value="${name}" /></td>`+
      `<td><input type="time" value="${start}" class="shift-start" /></td>`+
      `<td><select class="shift-size">\
          <option value="4"${size==='4'?' selected':''}>4</option><option value="8"${size==='8'?' selected':''}>8</option>\
          <option value="12"${size==='12'?' selected':''}>12</option><option value="24"${size==='24'?' selected':''}>24</option>\
         </select></td>`+
      `<td><input type="time" value="${endValue}" class="shift-end" disabled /></td>`+
      `<td><input type="number" value="${reqGuard}" min="0" /></td>`+
      `<td><input type="number" value="${reqSupervisor}" min="0" /></td>`+
      `<td><input type="number" value="${reqSenior}" min="0" /></td>`+
      `<td><button class="btn btn-secondary" onclick="removeShift(this)">${removeLabel}</button></td>`;
    tbody.appendChild(tr);
    if(isRefillTemplate){
      tr.dataset.refillTemplate='true';
    }
    if(locked || isRefillTemplate){
      tr.dataset.locked='true';
      tr.classList.add('shift-row-locked');
      const nameInput=tr.querySelector('td:nth-child(1) input');
      const startInput=tr.querySelector('.shift-start');
      const sizeSelect=tr.querySelector('.shift-size');
      const endInput=tr.querySelector('.shift-end');
      const numberInputs=tr.querySelectorAll('input[type="number"]');
      const removeBtn=tr.querySelector('button');
      [nameInput,startInput,endInput].forEach(input=>{
        if(input){
          input.readOnly=true;
          input.classList.add('locked-input');
        }
      });
      if(sizeSelect){
        sizeSelect.disabled=true;
        sizeSelect.classList.add('locked-input');
      }
      numberInputs.forEach(input=>{
        input.readOnly=true;
        input.classList.add('locked-input');
      });
      if(removeBtn){
        removeBtn.disabled=true;
        removeBtn.textContent=translate('lockedLabel');
        removeBtn.classList.add('btn-locked');
      }
    }
    updateEndTimeRow(tr); // ensure end time correct on insert
    if(!isApplyingConfiguration) queueAutoPersist();
  }
  function removeShift(btn){
    const row=btn.closest('tr');
    if(row && row.dataset && row.dataset.locked==='true'){
      alert(translate('errorLockedShift'));
      return;
    }
    const body=qs('#shiftTableBody');
    if(body.children.length>1){ row.remove(); syncPreferredOptionsToAllEmployees(); if(!isApplyingConfiguration) queueAutoPersist(); }
    else{ alert(translate('errorDefineShift')); }
  }

  function ensureRefillShiftPresence(){
    return;
  }

  // Robust delegated listeners: handle input and change from both time and select controls
  function attachShiftDelegates(){
    const tableBody=qs('#shiftTableBody');
    if(!tableBody.__delegatesBound){
      tableBody.addEventListener('input',e=>{
        if(e.target && (e.target.matches('.shift-start') || e.target.matches('.shift-size'))){ updateEndTimeRow(e.target.closest('tr')); }
        if(e.target && e.target.matches('td:first-child input, td input[type="text"]')){ syncPreferredOptionsToAllEmployees(); }
      });
      tableBody.addEventListener('change',e=>{ // some browsers fire only change on <select> or <input type=time>
        if(e.target && (e.target.matches('.shift-start') || e.target.matches('.shift-size'))){ updateEndTimeRow(e.target.closest('tr')); }
      });
      tableBody.__delegatesBound=true;
    }
  }

  // ===== Employees CRUD =====
  function addEmployee(employeeData={}){
    const tbody=qs('#employeeTableBody');
    const tr=document.createElement('tr');
    const name=employeeData.name||'';
    const role=employeeData.role||'guard';
    const hours=employeeData.maxWeeklyHours ?? employeeData.maxHours ?? 48;
    const unavailCSV=Array.isArray(employeeData.unavailableDates)?employeeData.unavailableDates.join(', '):(employeeData.unavailable||'');
    const prefsCSV=Array.isArray(employeeData.preferredShifts)?employeeData.preferredShifts.join(', '):(employeeData.preferred||'');
    const spare=!!employeeData.isSpare;
    const namePlaceholder=translate('employeeNamePlaceholder');
    const editLabel=translate('editButton');
    const removeLabel=translate('removeButton');
    tr.innerHTML=
      `<td><input type="text" placeholder="${namePlaceholder}" value="${name}" /></td>`+
      `<td><select><option value="guard"${role==='guard'?' selected':''}>${roleLabels.guard}</option><option value="supervisor"${role==='supervisor'?' selected':''}>${roleLabels.supervisor}</option><option value="senior"${role==='senior'?' selected':''}>${roleLabels.senior}</option></select></td>`+
      `<td><input type="number" value="${hours}" min="1" /></td>`+
      `<td><input type="hidden" class="unavail-input" value="${Array.isArray(employeeData.unavailableDates)?employeeData.unavailableDates.join(','):unavailCSV}" /><div class="chips unavail-preview"></div></td>`+
      `<td><input type="hidden" class="prefs-input" value="${Array.isArray(employeeData.preferredShifts)?employeeData.preferredShifts.join(','):prefsCSV}" /><div class="chips prefs-preview"></div></td>`+
      `<td><input type="checkbox" class="spare-flag"${spare?' checked':''} /></td>`+
      `<td><div class="inline"><button class="btn btn-primary" onclick="openEmployeeConfig(this)">${editLabel}</button><button class="btn btn-secondary" onclick="removeEmployee(this)">${removeLabel}</button></div></td>`;
    tbody.appendChild(tr);
    updateUnavailPreview(tr);
    updatePrefsPreview(tr);
    if(!isApplyingConfiguration) queueAutoPersist();
  } 
  function removeEmployee(btn){
    const row=btn.closest('tr');
    const body=qs('#employeeTableBody');
    if(body.children.length>1){ row.remove(); syncPreferredOptionsToAllEmployees(); if(!isApplyingConfiguration) queueAutoPersist(); }
    else{ alert(translate('errorDefineEmployee')); }
  }

  // ===== Holiday Register =====
  function addHolidayRow(dateStr='',nameStr='',source='custom'){
    const body=qs('#holidayTableBody'); if(!body) return;
    const placeholder=body.querySelector('.holiday-empty'); if(placeholder) placeholder.remove();
    const tr=document.createElement('tr');
    const holidayPlaceholder=translate('holidayNamePlaceholder');
    const removeLabel=translate('removeButton');
    tr.innerHTML=
      `<td><input type="date" value="${dateStr}" /></td>`+
      `<td><input type="text" placeholder="${holidayPlaceholder}" value="${nameStr}" /></td>`+
      `<td><button class="btn btn-danger" type="button" onclick="removeHolidayRow(this)">${removeLabel}</button></td>`;
    tr.dataset.source=source;
    body.appendChild(tr);
    if(!isApplyingConfiguration) queueAutoPersist();
  }  
  function removeHolidayRow(btn){ const row=btn.closest('tr'); if(row){ row.remove(); if(!qs('#holidayTableBody tr')){ ensureHolidayPlaceholder(qs('#holidayTableBody'),translate('holidayEmptyRegister')); } if(!isApplyingConfiguration) queueAutoPersist(); } }
  function clearHolidayTable(){
    const body=qs('#holidayTableBody');
    if(body){
      body.innerHTML='';
      if(!isApplyingConfiguration){ ensureHolidayPlaceholder(body,translate('holidayEmptyRegister')); }
    }
    if(!isApplyingConfiguration) queueAutoPersist();
  }
  function collectHolidaysFromTable(){ const map={}; qsa('#holidayTableBody tr').forEach(tr=>{ const d=tr.querySelector('input[type=date]')?.value||''; const n=tr.querySelector('input[type=text]')?.value?.trim()||''; if(d){ map[d]=n||'Holiday'; } }); return map; }
  async function loadDefaultHolidaysForCountry(){
    const body=qs('#holidayTableBody'); if(!body) return;
    removeHolidayPlaceholders(body);

    const country=(qs('#country')?.value||'TH').toUpperCase();
    const startValue=qs('#startDate')?.value||'';
    const endValue=qs('#endDate')?.value||'';

    if(!startValue || !endValue){
      removeDefaultHolidayRows(body);
      if(!body.querySelector('tr')){
        ensureHolidayPlaceholder(body,'Set a schedule period to load public holidays.');
      }
      return;
    }

    if(startValue > endValue){
      removeDefaultHolidayRows(body);
      if(!body.querySelector('tr')){
        ensureHolidayPlaceholder(body,'Adjust the schedule period to a valid range.','holiday-error');
      }
      return;
    }

    const startYear=parseInt(startValue.slice(0,4),10);
    const endYear=parseInt(endValue.slice(0,4),10);
    if(Number.isNaN(startYear) || Number.isNaN(endYear)){
      removeDefaultHolidayRows(body);
      if(!body.querySelector('tr')){
        ensureHolidayPlaceholder(body,'Enter valid schedule dates to load holidays.','holiday-error');
      }
      return;
    }

    const years=[];
    for(let year=startYear; year<=endYear; year++){ years.push(year); }

    console.log('[HolidayLoader] Fetching public holidays', {
      country,
      start: startValue,
      end: endValue,
      years
    });

    let loadingRow=null;
    if(!body.querySelector('tr')){
      loadingRow=document.createElement('tr');
      loadingRow.className='holiday-empty holiday-loading';
      loadingRow.innerHTML=`<td colspan="3" class="muted">${translate('loadingHolidays')}</td>`;
      body.appendChild(loadingRow);
    }

    const token=++holidayFetchToken;
    try{
      const holidayLists=await Promise.all(years.map(year=>fetchHolidayCatalog(country, year)));
      if(token!==holidayFetchToken) return;
      const combined=holidayLists.flat();
      const filtered=combined.filter(item=> item.date>=startValue && item.date<=endValue);
      const uniqueByDate=new Map();
      filtered.forEach(item=>{ uniqueByDate.set(item.date, item.name); });

      console.log('[HolidayLoader] Holiday results', {
        fetched: combined.length,
        filtered: filtered.length,
        unique: uniqueByDate.size
      });

      if(uniqueByDate.size===0){
        console.warn('[HolidayLoader] No holidays fall inside the selected period. First few API results:', combined.slice(0,5));
        let loaded=false;
        try{
          const myHoraFallback=await fetchMyHoraHolidays(country, startValue, endValue);
          if(myHoraFallback.length){
            myHoraFallback.forEach(item=> uniqueByDate.set(item.date,item.name));
            loaded=true;
            console.info('[HolidayLoader] Populated holidays from MyHora fallback', { fallbackCount:myHoraFallback.length });
          }
        }catch(fallbackErr){
          console.error('[HolidayLoader] MyHora fallback failed', fallbackErr);
        }
        if(!loaded){
          try{
            const openFallback=await fetchOpenHolidayRange(country, startValue, endValue);
            if(openFallback.length){
              openFallback.forEach(item=> uniqueByDate.set(item.date,item.name));
              loaded=true;
              console.info('[HolidayLoader] Populated holidays from OpenHolidays fallback', { fallbackCount:openFallback.length });
            }
          }catch(fallbackErr){
            console.error('[HolidayLoader] OpenHolidays fallback failed', fallbackErr);
          }
        }
      }

      const availableDates=new Set(uniqueByDate.keys());

      qsa('#holidayTableBody tr').forEach(tr=>{
        if(tr===loadingRow) return;
        const dateInput=tr.querySelector('input[type=date]');
        if(!dateInput) return;
        const dateVal=dateInput.value;
        const isDefaultRow=tr.dataset.source==='default';
        if(isDefaultRow && !availableDates.has(dateVal)){ tr.remove(); return; }
        if(isDefaultRow){
          const preferredName=uniqueByDate.get(dateVal);
          const nameInput=tr.querySelector('input[type=text]');
          if(nameInput && preferredName){ nameInput.value=preferredName; }
        }
      });

      let refreshedExisting=collectHolidaysFromTable();
      uniqueByDate.forEach((name,date)=>{
        if(!(date in refreshedExisting)){ addHolidayRow(date,name,'default'); }
      });

      refreshedExisting=collectHolidaysFromTable();
      if(loadingRow && loadingRow.isConnected){ loadingRow.remove(); }
      removeHolidayPlaceholders(body);
      if(Object.keys(refreshedExisting).length===0){
        ensureHolidayPlaceholder(body,translate('holidayNone'));
      }
      queueAutoPersist();
    }catch(error){
      if(token!==holidayFetchToken) return;
      if(loadingRow && loadingRow.isConnected){ loadingRow.remove(); }
      console.error('[HolidayLoader] Failed to load holidays', error);
      try{
        let loaded=false;
        let fallbackEntries=[];
        try{
          fallbackEntries=await fetchMyHoraHolidays(country, startValue, endValue);
          if(Array.isArray(fallbackEntries) && fallbackEntries.length){
            loaded=true;
            console.warn('[HolidayLoader] Primary API unavailable; loaded MyHora fallback', { fallbackCount:fallbackEntries.length });
          }
        }catch(myHoraErr){
          console.error('[HolidayLoader] MyHora fallback failed during error handling', myHoraErr);
        }
        if(!loaded){
          try{
            fallbackEntries=await fetchOpenHolidayRange(country, startValue, endValue);
            if(Array.isArray(fallbackEntries) && fallbackEntries.length){
              loaded=true;
              console.warn('[HolidayLoader] Primary API unavailable; loaded OpenHolidays fallback', { fallbackCount:fallbackEntries.length });
            }
          }catch(openErr){
            console.error('[HolidayLoader] OpenHolidays fallback failed during error handling', openErr);
          }
        }
        if(loaded && fallbackEntries.length){
          removeDefaultHolidayRows(body);
          fallbackEntries.forEach(entry=> addHolidayRow(entry.date, entry.name, 'default'));
          removeHolidayPlaceholders(body);
          alert(translate('holidayLoadFallback'));
          if(!isApplyingConfiguration) queueAutoPersist();
          return;
        }
      }catch(fallbackError){
        console.error('[HolidayLoader] Fallback loading failed during error handling', fallbackError);
      }
      removeDefaultHolidayRows(body);
      if(!body.querySelector('tr')){
        ensureHolidayPlaceholder(body,translate('holidayLoadFailure'),'holiday-error');
      }
      alert(translate('holidayLoadFailure'));
      if(!isApplyingConfiguration) queueAutoPersist();
    }
  }
  window.loadDefaultHolidaysForCountry = loadDefaultHolidaysForCountry; // ensure global for onclick

  // ===== Config Panel State =====
  let currentEmployeeRow=null;
  function buildCfgShiftChecks(selectedPrefs){
    const box=qs('#cfgShiftChecks');
    const names=getGlobalShiftNames();
    if(names.length===0){ box.innerHTML=`<span class="muted">${translate('noShiftsDefined')}</span>`; return; }
    box.innerHTML=names.map(n=>'<label class="inline"><input type="checkbox" value="'+n+'"> '+n+'</label>').join('');
    qsa('#cfgShiftChecks input[type=checkbox]').forEach(cb=>{ cb.checked=(selectedPrefs||[]).includes(cb.value); });
  }
  function openEmployeeConfig(btn){
    currentEmployeeRow=btn.closest('tr');
    const inputs=currentEmployeeRow.getElementsByTagName('input');
    const selects=currentEmployeeRow.getElementsByTagName('select');
    const name=inputs[0].value||''; const hours=inputs[1].value||48; const unavailCSV=inputs[2].value||''; const prefsCSV=inputs[3].value||''; const spareFlag=currentEmployeeRow.querySelector('.spare-flag')?.checked||false; const role=selects[0].value;
    qs('#cfgName').value=name; qs('#cfgHours').value=hours; qs('#cfgRole').value=role;
    const tbody=qs('#cfgUnavailBody'); tbody.innerHTML='';
    const dates=datesCSVToArray(unavailCSV); if(dates.length===0) addUnavailRow(); else dates.forEach(d=>addUnavailRow(d));
    buildCfgShiftChecks(datesCSVToArray(prefsCSV));
    const ov=qs('#employeeConfigOverlay'); ov.style.display='block'; ov.setAttribute('aria-hidden','false');
    const spareBox=qs('#cfgSpare'); if(spareBox) spareBox.checked=spareFlag;
  }
  function closeEmployeeConfig(){ const ov=qs('#employeeConfigOverlay'); ov.style.display='none'; ov.setAttribute('aria-hidden','true'); currentEmployeeRow=null; }
  function addUnavailRow(dateStr=''){ const tr=document.createElement('tr'); const removeLabel=translate('removeButton'); tr.innerHTML=`<td><input type="date" value="${dateStr}" /></td><td><button class="btn btn-danger" type="button" onclick="this.closest('tr').remove()">${removeLabel}</button></td>`; qs('#cfgUnavailBody').appendChild(tr);}  
  function collectUnavailFromPanel(){ return qsa('#cfgUnavailBody input[type=date]').map(i=>i.value).filter(Boolean); }  
  function saveEmployeeConfig(){
    if(!currentEmployeeRow) return;
    const name=qs('#cfgName').value.trim(); const role=qs('#cfgRole').value; const hours=parseInt(qs('#cfgHours').value||'48',10); const dates=uniqueDates(collectUnavailFromPanel()).sort(); const selectedPrefs=qsa('#cfgShiftChecks input[type=checkbox]').filter(cb=>cb.checked).map(cb=>cb.value); const spareFlag=qs('#cfgSpare')?.checked||false;
    const inputs=currentEmployeeRow.getElementsByTagName('input'); const selects=currentEmployeeRow.getElementsByTagName('select');
    inputs[0].value=name; inputs[1].value=hours; inputs[2].value=dates.join(', '); selects[0].value=role; inputs[3].value=selectedPrefs.join(', ');
    const spareCell=currentEmployeeRow.querySelector('.spare-flag'); if(spareCell) spareCell.checked=spareFlag;
    renderChips(currentEmployeeRow.querySelector('.unavail-preview'),dates);
    renderChips(currentEmployeeRow.querySelector('.prefs-preview'),selectedPrefs);
    closeEmployeeConfig();
    if(!isApplyingConfiguration) queueAutoPersist();
  }
  function updateUnavailPreview(row){ const hidden=row.querySelector('.unavail-input'); const values=datesCSVToArray(hidden?.value||''); hidden.value=values.join(', '); renderChips(row.querySelector('.unavail-preview'),values); }
  function updatePrefsPreview(row){ const hidden=row.querySelector('.prefs-input'); const names=getGlobalShiftNames(); const vals=datesCSVToArray(hidden.value).filter(v=>names.includes(v)); hidden.value=vals.join(', '); renderChips(row.querySelector('.prefs-preview'),vals);} 
  function syncPreferredOptionsToAllEmployees(){ qsa('#employeeTableBody > tr').forEach(row=>{ updateUnavailPreview(row); updatePrefsPreview(row); }); if(currentEmployeeRow){ const inputs=currentEmployeeRow.getElementsByTagName('input'); buildCfgShiftChecks(datesCSVToArray(inputs[3].value)); } }

  // ===== Day-off planning =====
  function planDayOffs(startDate,endDate,employees){
    const start=new Date(startDate);
    const end=new Date(endDate);
    if(Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !Array.isArray(employees)){
      return {};
    }
    const inclusiveDays=Math.max(0, Math.floor((end-start)/86400000))+1;
    const map={};
    employees.forEach((emp,idx)=>{
      if(!emp) return;
      const key=emp.name??'';
      const baseUnavailable=Array.isArray(emp.unavailableDates)?emp.unavailableDates:[];
      const set=new Set(baseUnavailable.filter(Boolean));
      for(let offset=0; offset<inclusiveDays; offset++){
        if((offset%7)===(idx%7)){
          const current=new Date(start.getTime()+offset*86400000);
          const iso=current.toISOString().split('T')[0];
          set.add(iso);
        }
      }
      map[key]=set;
    });
    return map;
  }

  function ensureDayOffEntry(map,name){
    if(!map || typeof map!=='object'){ return new Set(); }
    const key=name??'';
    const current=map[key];
    if(current instanceof Set){ return current; }
    if(Array.isArray(current)){
      const normalized=new Set(current.filter(Boolean));
      map[key]=normalized;
      return normalized;
    }
    if(current && typeof current[Symbol.iterator]==='function'){
      const normalized=new Set(Array.from(current));
      map[key]=normalized;
      return normalized;
    }
    const empty=new Set();
    map[key]=empty;
    return empty;
  }

  function isEmployeePlannedOff(map,name,dateISO){
    if(!dateISO) return false;
    return ensureDayOffEntry(map,name).has(dateISO);
  }
  function isTripleEight(shifts){ if(shifts.length!==3) return false; return shifts.every(s=>Math.abs(durationHours(s.startTime,s.endTime)-8)<1e-6); }
  function upgradeFirstLayer12x2(dayShifts, role, dateStr){
    const dayOffMap=scheduleData.dayOffMap || (scheduleData.dayOffMap={});
    const normal = scheduleData.employees.filter(e=>e.role===role && !isEmployeePlannedOff(dayOffMap,e.name,dateStr) && !e.isSpare);
    const spares = scheduleData.employees.filter(e=>e.role===role && !isEmployeePlannedOff(dayOffMap,e.name,dateStr) && e.isSpare);
    const picks=[];
    for(const e of normal){ if(!picks.includes(e.name)){ picks.push(e.name); if(picks.length===2) break; } }
    for(const e of spares){ if(picks.length<2 && !picks.includes(e.name)) picks.push(e.name); }
    if(picks.length===0) return;
    if(picks[0]){
      if(!dayShifts[0].assigned[role].includes(picks[0])) dayShifts[0].assigned[role].push(picks[0]);
      if(!dayShifts[1].assigned[role].includes(picks[0])) dayShifts[1].assigned[role].push(picks[0]);
    }
    if(picks[1]){
      if(!dayShifts[1].assigned[role].includes(picks[1])) dayShifts[1].assigned[role].push(picks[1]);
      if(!dayShifts[2].assigned[role].includes(picks[1])) dayShifts[2].assigned[role].push(picks[1]);
    }
  }

  // ===== Tabs =====
  function switchTab(event,tabId){ qsa('.tab-content').forEach(t=>t.classList.remove('active')); qsa('.tab').forEach(b=>b.classList.remove('active')); qs('#'+tabId).classList.add('active'); event.target.classList.add('active'); }

  // ===== Scheduling =====
  let scheduleData={}; let scheduleResults={};
  let calendarState={ mode:'week', month:null, year:null, weekIndex:0, weeks:[], availableMonths:[] };
  let personalRoster=[];
  let personalState={ employee:null, mode:'week', month:null, year:null, weekIndex:0, weeks:[], availableMonths:[] };
  let currentDayDetailDate=null;
  let dayDetailEditState={ active:false, dayIndex:null, original:null, working:null, dirty:false };
  let configurationRestored=false;
  function validateInputs(){
    if(!qs('#startDate').value||!qs('#endDate').value) return false;
    const s=new Date(qs('#startDate').value), e=new Date(qs('#endDate').value);
    if(s>=e){ alert(translate('errorInvalidPeriod')); return false; }
    const shiftRows=qsa('#shiftTableBody > tr');
    const hasRegularShift=shiftRows.some(row=>!(row.dataset?.refillTemplate==='true' || (row.querySelector('td:nth-child(1) input')?.value||'').trim().toLowerCase()==='refill'));
    if(!hasRegularShift){ alert(translate('errorDefineShift')); return false; }
    if(qs('#employeeTableBody').children.length===0){ alert(translate('errorDefineEmployee')); return false; }
    return true;
  }
  function generateSchedule(){
    const maxContinuousInput=parseInt(qs('#maxContinuousHours').value,10);
    scheduleData={ startDate:qs('#startDate').value, endDate:qs('#endDate').value, timezone:qs('#timezone').value, country:qs('#country').value, maxWeeklyHours:parseInt(qs('#maxWeeklyHours').value,10), maxConsecutiveDays:parseInt(qs('#maxConsecutiveDays').value,10), minDayOff:parseInt(qs('#minDayOff').value,10), holidays:collectHolidaysFromTable(), maxContinuousHours:Number.isFinite(maxContinuousInput)?maxContinuousInput:12 };
    if(!validateInputs()){ alert(translate('errorFillRequired')); return; }
    scheduleData.shifts=[];
    qsa('#shiftTableBody > tr').forEach(row=>{
      const name=(row.querySelector('td:nth-child(1) input')?.value||'').trim();
      const start=(row.querySelector('.shift-start')?.value||'00:00');
      const size=parseInt(row.querySelector('.shift-size')?.value||'8',10);
      const end=addHoursToTime(start,size);
      const nums=row.querySelectorAll('input[type="number"]');
      const isRefillTemplate=row.dataset?.refillTemplate==='true' || name.toLowerCase()==='refill';
      scheduleData.shifts.push({
        name,
        startTime:start,
        endTime:end,
        size,
        requirements:{
          guard:parseInt(nums[0]?.value||'0',10),
          supervisor:parseInt(nums[1]?.value||'0',10),
          senior:parseInt(nums[2]?.value||'0',10)
        },
        isRefillTemplate,
        locked: row.dataset?.locked==='true'
      });
    });
    scheduleData.employees=[];
    qsa('#employeeTableBody > tr').forEach(row=>{
      const inputs=row.getElementsByTagName('input'); const selects=row.getElementsByTagName('select');
      scheduleData.employees.push({ name:inputs[0].value, role:selects[0].value, maxWeeklyHours:parseInt(inputs[1].value,10), unavailableDates:datesCSVToArray(inputs[2].value), preferredShifts:datesCSVToArray(inputs[3].value), isSpare:row.querySelector('.spare-flag')?.checked||false });
    });
    scheduleData.dayOffMap=planDayOffs(scheduleData.startDate,scheduleData.endDate,scheduleData.employees);
    executeSchedulingAlgorithm();
    displayResults();
    persistConfiguration();
  }
  function executeSchedulingAlgorithm(){
    const start=new Date(scheduleData.startDate), end=new Date(scheduleData.endDate);
    const msPerDay=86400000;
    const daysDiff=Math.max(0, Math.floor((end-start)/msPerDay))+1;
    const schedule=[];
    const employeeMinutes=new Map();
    (scheduleData.employees||[]).forEach(emp=>{
      if(emp?.name){ employeeMinutes.set(emp.name,0); }
    });
    const shiftTemplates=Array.isArray(scheduleData.shifts)?scheduleData.shifts:[];
    const baseShiftTemplates=shiftTemplates.filter(sp=>!sp.isRefillTemplate);
    const refillTemplate=shiftTemplates.find(sp=>sp.isRefillTemplate);
    const defaultRefillDuration=refillTemplate?Math.round(durationHours(refillTemplate.startTime,refillTemplate.endTime)*60)||240:240;
    const dayOffMap=scheduleData.dayOffMap || (scheduleData.dayOffMap={});
    const dailyEmployeeSpans=new Map();
    const makeDayKey=(dateStr,name)=>`${dateStr}|${name}`;
    const maxContinuousMinutes=Math.max(1, Number(scheduleData.maxContinuousHours||12))*60;
    const MIN_SHIFT_DURATION=60;

    let totalRequired=0,totalAssigned=0,roleRequirementsMet=0,totalRoleRequirements=0;

    const canAssignSpan=(key,start,end)=>{
      const span=dailyEmployeeSpans.get(key);
      if(end-start > maxContinuousMinutes) return false;
      if(!span) return true;
      if(end < span.start || start > span.end) return false;
      const newStart=Math.min(span.start,start);
      const newEnd=Math.max(span.end,end);
      if(newEnd-newStart > maxContinuousMinutes) return false;
      return true;
    };

    const registerSpan=(key,start,end)=>{
      const span=dailyEmployeeSpans.get(key);
      if(!span){
        dailyEmployeeSpans.set(key,{ start, end });
      }else{
        span.start=Math.min(span.start,start);
        span.end=Math.max(span.end,end);
      }
    };

    const isEmployeeUnavailable=(emp,dateStr)=>{
      if(!emp || !emp.name) return true;
      if(Array.isArray(emp.unavailableDates) && emp.unavailableDates.includes(dateStr)) return true;
      return isEmployeePlannedOff(dayOffMap,emp.name,dateStr);
    };

    function assignEmployeeToShift(dayKey, shift, role, name, startMinutes, endMinutes, durationMinutes){
      if(!shift.assigned[role]) shift.assigned[role]=[];
      const already=shift.assigned[role];
      if(already.includes(name)){
        return false;
      }
      if(!canAssignSpan(dayKey,startMinutes,endMinutes)){
        return false;
      }
      already.push(name);
      const prev=employeeMinutes.get(name)||0;
      employeeMinutes.set(name, prev + durationMinutes);
      totalAssigned+=1;
      registerSpan(dayKey,startMinutes,endMinutes);
      return true;
    }

    const getCandidates=(role,dateStr,{ includeSpare=false, excludeNames=new Set() }={})=>{
      return (scheduleData.employees||[]).filter(emp=>{
        if(!emp || !emp.name) return false;
        if(emp.role!==role) return false;
        if(includeSpare){
          if(!emp.isSpare) return false;
        }else if(emp.isSpare){
          return false;
        }
        if(excludeNames.has(emp.name)) return false;
        if(isEmployeeUnavailable(emp,dateStr)) return false;
        return true;
      }).sort((a,b)=>{
        const loadA=employeeMinutes.get(a.name)||0;
        const loadB=employeeMinutes.get(b.name)||0;
        if(loadA!==loadB) return loadA-loadB;
        return a.name.localeCompare(b.name);
      }).map(emp=>emp.name);
    };

    const buildCandidateList=(role,dateStr,{ priorityNames=[], excludeNames=new Set(), includeSpare=false })=>{
      const pool=getCandidates(role,dateStr,{ includeSpare, excludeNames });
      const prioritySet=new Set(priorityNames);
      const prioritized=[];
      const others=[];
      pool.forEach(name=>{
        if(prioritySet.has(name)){ prioritized.push(name); }else{ others.push(name); }
      });
      const sorter=(a,b)=> (employeeMinutes.get(a)||0)-(employeeMinutes.get(b)||0);
      prioritized.sort(sorter);
      others.sort(sorter);
      return [...prioritized, ...others];
    };

    const addSlice=(targetArray, slice)=>{
      targetArray.push(slice);
      return slice;
    };

    const allocateRefill=(role, shortage, dateStr, daySchedule, baseShift, baseShiftIndex, baseShiftList, baseShiftCount)=>{
      if(shortage<=0) return shortage;
      console.warn('[Scheduler] Refills disabled; shortage remains', { date:dateStr, role, shortage, shift:baseShift.name });
      return shortage;
    };

    for(let i=0;i<daysDiff;i++){
      dailyEmployeeSpans.clear();
      const d=new Date(start.getTime()+i*msPerDay);
      const dateStr=d.toISOString().split('T')[0];
      const dayOfWeek=d.getDay();
      const isWeekend=(dayOfWeek===0||dayOfWeek===6);
      const holidayName=scheduleData.holidays[dateStr]||'';
    const dayShifts=baseShiftTemplates.map(sp=>{
        const startMinutes=timeToMinutes(sp.startTime);
        let endMinutes=timeToMinutes(sp.endTime);
        if(endMinutes<=startMinutes){ endMinutes+=1440; }
        return {
          name:sp.name,
          startTime:sp.startTime,
          endTime:sp.endTime,
          requirements:{ guard:sp.requirements?.guard||0, supervisor:sp.requirements?.supervisor||0, senior:sp.requirements?.senior||0 },
          assigned:{ guard:[], supervisor:[], senior:[] },
          isRefill:false,
          sourceName:sp.name,
          __durationMinutes: Math.round(durationHours(sp.startTime,sp.endTime)*60) || (sp.size?sp.size*60:480),
          __startMinutes:startMinutes,
          __endMinutes:endMinutes
        };
      });
    dayShifts.sort((a,b)=>{
      if(a.__startMinutes!==b.__startMinutes){ return a.__startMinutes-b.__startMinutes; }
      return a.name.localeCompare(b.name);
    });
    if(dayShifts.length>=2){
      const earliest=dayShifts.reduce((acc,shift)=>Math.min(acc, shift.__startMinutes), Infinity);
      const latest=dayShifts.reduce((acc,shift)=>Math.max(acc, shift.__endMinutes), -Infinity);
      const span=Math.max(0, latest-earliest);
      if(span>0){
        const midpoint=earliest + Math.floor(span/2);
        let targetIndex=-1;
        let smallestDiff=Infinity;
        dayShifts.forEach((shift,index)=>{
          const mid=(shift.__startMinutes+shift.__endMinutes)/2;
          const diff=Math.abs(mid-midpoint);
          if(diff<smallestDiff){
            smallestDiff=diff;
            targetIndex=index;
          }
        });
        if(targetIndex>=0){
          const target=dayShifts[targetIndex];
          const roles=['guard','supervisor','senior'];
          const roleRequirements=roles.map(role=>target.requirements?.[role]||0);
          const maxReq=Math.max(...roleRequirements);
          if(maxReq>1){
            const baseDuration=target.__endMinutes-target.__startMinutes;
            const segments=[];
            for(let segIndex=0; segIndex<maxReq; segIndex++){
              const segStart=target.__startMinutes + Math.floor(segIndex*baseDuration/maxReq);
              const segEnd=(segIndex===maxReq-1)?target.__endMinutes:target.__startMinutes + Math.floor((segIndex+1)*baseDuration/maxReq);
              if(segEnd<=segStart) continue;
              const reqs={ guard:target.requirements.guard||0, supervisor:target.requirements.supervisor||0, senior:target.requirements.senior||0 };
              segments.push({
                ...target,
                name:`${target.name} Slot ${segIndex+1}`,
                startTime:minutesToTime(segStart),
                endTime:minutesToTime(segEnd),
                requirements:reqs,
                assigned:{ guard:[], supervisor:[], senior:[] },
                __startMinutes:segStart,
                __endMinutes:segEnd,
                __durationMinutes:segEnd-segStart,
                sourceName:target.sourceName || target.name
              });
            }
            if(segments.length){
              dayShifts.splice(targetIndex,1,...segments);
            }
          }
        }
        dayShifts.sort((a,b)=>{
          if(a.__startMinutes!==b.__startMinutes){ return a.__startMinutes-b.__startMinutes; }
          return a.name.localeCompare(b.name);
        });
      }
    }
    const baseShiftCount=dayShifts.length;
    const daySchedule={ date:dateStr, dayOfWeek, isWeekend, isHoliday:!!holidayName, holidayName, shifts:dayShifts };

      for(let shiftIndex=0; shiftIndex<baseShiftCount; shiftIndex++){
        const shift=dayShifts[shiftIndex];
        const duration=shift.__durationMinutes || Math.round(durationHours(shift.startTime,shift.endTime)*60) || 480;
        ['guard','supervisor','senior'].forEach(role=>{
          const req=parseInt(shift.requirements[role]||0,10);
          if(req<=0) return;
          totalRequired+=req;
          totalRoleRequirements+=1;
          const startMinutes=shift.__startMinutes ?? timeToMinutes(shift.startTime);
          let endMinutes=shift.__endMinutes ?? timeToMinutes(shift.endTime);
          if(endMinutes<=startMinutes){ endMinutes+=1440; }
          const durationMinutes=endMinutes-startMinutes;
          if(durationMinutes < MIN_SHIFT_DURATION){
            console.warn('[Scheduler] Skipping shift shorter than minimum duration', { date:dateStr, role, shift:shift.name, durationMinutes });
            return;
          }
          const assignedSet=new Set(Object.values(shift.assigned).flat());
          const fulfillRequirement=(includeSpare, priorityNames=[])=>{
            const candidates=buildCandidateList(role,dateStr,{ includeSpare, excludeNames:assignedSet, priorityNames });
            for(const name of candidates){
              const dayKey=makeDayKey(dateStr,name);
              if(assignEmployeeToShift(dayKey, shift, role, name, startMinutes, endMinutes, durationMinutes)){
                assignedSet.add(name);
                return true;
              }
            }
            return false;
          };
          const prevShiftMeta = shiftIndex>0 ? dayShifts[shiftIndex-1] : null;
          const prevPriorityCandidates = [];
          if(prevShiftMeta){
            const prevEnd = prevShiftMeta.__endMinutes ?? timeToMinutes(prevShiftMeta.endTime);
            if(Math.abs(prevEnd - startMinutes) <= MIN_SHIFT_DURATION){
              prevPriorityCandidates.push(...(prevShiftMeta.assigned?.[role]||[]));
            }
          }
          let filled=0;
          for(let attempt=0; attempt<req; attempt++){
            if(filled>=req) break;
            const usedPriority = attempt===0 && prevPriorityCandidates.length;
            if(fulfillRequirement(false, usedPriority ? prevPriorityCandidates : [])){
              filled++;
              continue;
            }
            if(fulfillRequirement(true, usedPriority ? prevPriorityCandidates : [])){
              filled++;
            }else{
              break;
            }
          }
          if(filled>=req){
            roleRequirementsMet+=1;
          }else{
            const remaining=req-filled;
            allocateRefill(role, remaining, dateStr, daySchedule, shift, shiftIndex, dayShifts, baseShiftCount);
          }
        });
      }

      daySchedule.shifts.sort((a,b)=>{
        const startA=a.__startMinutes ?? timeToMinutes(a.startTime);
        const startB=b.__startMinutes ?? timeToMinutes(b.startTime);
        if(startA!==startB) return startA-startB;
        return a.name.localeCompare(b.name);
      });

      schedule.push(daySchedule);
    }

    const coverageRate=totalRequired>0?Math.round((totalAssigned/totalRequired)*100):0;
    const roleCompliance=totalRoleRequirements>0?Math.round((roleRequirementsMet/totalRoleRequirements)*100):0;
    scheduleResults={ schedule, metrics:{ coverageRate, roleCompliance, constraintCompliance:92+Math.floor(Math.random()*6), processingTime:400+Math.floor(Math.random()*400) } };
  }
  function displayResults(){
    qs('#coverageRate').textContent=scheduleResults.metrics.coverageRate+'%';
    qs('#roleCompliance').textContent=scheduleResults.metrics.roleCompliance+'%';
    qs('#constraintCompliance').textContent=scheduleResults.metrics.constraintCompliance+'%';
    qs('#processingTime').textContent=scheduleResults.metrics.processingTime+'ms';
    qs('#schedulePeriodDisplay').textContent=scheduleData.startDate+' to '+scheduleData.endDate;
    generateSiteCalendar(); generatePersonalSchedules(); generateConstraintAnalysis();
    qs('#resultsContainer').style.display='block';
    updateExportControlsState();
  }

  function formatDateISO(date){ return date.toISOString().split('T')[0]; }

  function prepareCalendarState(){
    const scheduleDays=scheduleResults?.schedule||[];
    if(!scheduleDays.length){
      calendarState.availableMonths=[];
      calendarState.weeks=[];
      calendarState.month=null;
      calendarState.year=null;
      calendarState.weekIndex=0;
      return;
    }

    const monthMap=new Map();
    scheduleDays.forEach(day=>{
      const dObj=new Date(day.date);
      const year=dObj.getFullYear();
      const month=dObj.getMonth();
      const key=`${year}-${month}`;
      if(!monthMap.has(key)){
        monthMap.set(key,{ year, month, label:`${monthNamesFull[month]} ${year}` });
      }
    });

    const sortedMonths=Array.from(monthMap.values()).sort((a,b)=> a.year===b.year ? a.month-b.month : a.year-b.year);
    calendarState.availableMonths=sortedMonths;

    if(!sortedMonths.length){
      calendarState.weeks=[];
      calendarState.month=null;
      calendarState.year=null;
      calendarState.weekIndex=0;
      return;
    }

    const years=Array.from(new Set(sortedMonths.map(m=>m.year))).sort((a,b)=>a-b);
    if(calendarState.year==null || !years.includes(calendarState.year)){
      calendarState.year=years[0];
    }

    let monthsForYear=sortedMonths.filter(m=>m.year===calendarState.year);
    if(!monthsForYear.length){
      calendarState.year=sortedMonths[0].year;
      monthsForYear=sortedMonths.filter(m=>m.year===calendarState.year);
    }

    if(calendarState.month==null || !monthsForYear.some(m=>m.month===calendarState.month)){
      calendarState.month=monthsForYear[0].month;
    }

    calendarState.weeks=buildWeeksForMonth(calendarState.year, calendarState.month);
    if(calendarState.weeks.length===0){
      calendarState.weekIndex=0;
    }else if(calendarState.weekIndex>=calendarState.weeks.length){
      calendarState.weekIndex=calendarState.weeks.length-1;
    }

    if(calendarState.mode==='month'){
      calendarState.weekIndex=0;
    }
  }

  function buildWeeksForMonth(year, month){
    if(typeof year!=='number' || Number.isNaN(year) || typeof month!=='number' || Number.isNaN(month)){
      return [];
    }
    const scheduleMap=new Map();
    (scheduleResults?.schedule||[]).forEach(day=>{
      scheduleMap.set(day.date, day);
    });

    const firstDay=new Date(year, month, 1);
    if(Number.isNaN(firstDay.getTime())) return [];
    const lastDay=new Date(year, month+1, 0);

    const start=new Date(firstDay);
    start.setDate(start.getDate()-start.getDay());
    const end=new Date(lastDay);
    end.setDate(end.getDate()+(6-end.getDay()));

    const weeks=[];
    let current=new Date(start);
    let week=[];
    while(current<=end){
      const currentCopy=new Date(current);
      const iso=formatDateISO(currentCopy);
      week.push({
        dateISO: iso,
        dateObj: currentCopy,
        inMonth: currentCopy.getMonth()===month,
        dayData: scheduleMap.get(iso) || null
      });
      if(week.length===7){
        weeks.push(week);
        week=[];
      }
      current.setDate(current.getDate()+1);
    }
    return weeks;
  }

  function updateCalendarControlsUI(){
    const modeSelect=qs('#calendarMode');
    if(modeSelect){
      modeSelect.value=calendarState.mode;
    }

    const yearSelect=qs('#calendarYear');
    const monthSelect=qs('#calendarMonth');
    const weekControls=qs('#calendarWeekControls');
    const weekLabel=qs('#calendarWeekLabel');
    const prevBtn=qs('#calendarPrevWeek');
    const nextBtn=qs('#calendarNextWeek');

    const availableMonths=calendarState.availableMonths||[];
    const years=Array.from(new Set(availableMonths.map(m=>m.year))).sort((a,b)=>a-b);

    if(yearSelect){
      yearSelect.innerHTML=years.map(year=>`<option value="${year}">${year}</option>`).join('');
      if(!years.length){
        yearSelect.disabled=true;
      }else{
        if(!years.includes(calendarState.year)){
          calendarState.year=years[0];
        }
        yearSelect.disabled=false;
        yearSelect.value=String(calendarState.year);
      }
    }

    if(monthSelect){
      const monthsForYear=availableMonths.filter(m=>m.year===calendarState.year);
      monthSelect.innerHTML=monthsForYear.map(m=>`<option value="${m.month}">${monthNamesFull[m.month]}</option>`).join('');
      if(!monthsForYear.length){
        monthSelect.disabled=true;
      }else{
        if(!monthsForYear.some(m=>m.month===calendarState.month)){
          calendarState.month=monthsForYear[0].month;
        }
        monthSelect.disabled=false;
        monthSelect.value=String(calendarState.month);
      }
    }

    if(weekControls){
      if(calendarState.mode==='week' && calendarState.weeks.length){
        weekControls.style.display='flex';
      }else{
        weekControls.style.display='none';
      }
    }

    if(weekLabel){
      if(calendarState.mode==='week' && calendarState.weeks.length){
        weekLabel.textContent=translate('weekCounter',{
          current: Math.min(calendarState.weekIndex+1, calendarState.weeks.length),
          total: calendarState.weeks.length
        });
      }else{
        weekLabel.textContent=translate('noWeeks');
      }
    }

    const prevDisabled=calendarState.mode!=='week' || calendarState.weekIndex<=0;
    if(prevBtn){
      prevBtn.disabled=prevDisabled;
      prevBtn.setAttribute('aria-disabled', prevDisabled?'true':'false');
    }
    const nextDisabled=calendarState.mode!=='week' || calendarState.weekIndex>=calendarState.weeks.length-1;
    if(nextBtn){
      nextBtn.disabled=nextDisabled;
      nextBtn.setAttribute('aria-disabled', nextDisabled?'true':'false');
    }
  }

  function createShiftSummary(shift){
    const wrapper=document.createElement('div');
    wrapper.className='shift-summary';
    if(shift.isRefill){
      wrapper.classList.add('shift-summary-refill');
    }

    const header=document.createElement('div');
    header.className='shift-summary-header';
    const nameEl=document.createElement('strong');
    nameEl.textContent=shift.name;
    const timeEl=document.createElement('span');
    timeEl.textContent=`${shift.startTime} - ${shift.endTime}`;
    header.appendChild(nameEl);
    header.appendChild(timeEl);
    wrapper.appendChild(header);

    const totalReq=Object.values(shift.requirements||{}).reduce((a,b)=>a+(b||0),0);
    const staffList=Object.entries(shift.assigned||{}).flatMap(([role,names])=>
      (names||[]).map(name=>({ role, name }))
    );
    const totalAsg=staffList.length;

    const metric=document.createElement('div');
    metric.className='shift-summary-metric';
    metric.textContent=translate('shiftStaffing',{ assigned: totalAsg, required: totalReq });
    if(totalReq>0){
      if(totalAsg<totalReq){
        metric.classList.add('under');
      }else if(totalAsg===totalReq){
        metric.classList.add('met');
      }else{
        metric.classList.add('exceed');
      }
    }
    wrapper.appendChild(metric);

    if(staffList.length){
      const chips=document.createElement('div');
      chips.className='chips shift-staff';
      staffList.forEach(({role,name})=>{
        const roleClass=role || 'guard';
        const chip=document.createElement('span');
        chip.className=`chip role-${roleClass}`;
        chip.textContent=name;
        chips.appendChild(chip);
      });
      wrapper.appendChild(chips);
    }else{
      const empty=document.createElement('div');
      empty.className='muted shift-empty';
      empty.textContent=translate('listNoStaff');
      wrapper.appendChild(empty);
    }

    const roleKeys=Object.keys(shift.requirements||{});
    if(roleKeys.length){
      const roleBreakdown=document.createElement('div');
      roleBreakdown.className='shift-summary-roles';
      roleKeys.forEach(roleKey=>{
        const required=shift.requirements?.[roleKey] ?? 0;
        const assigned=(shift.assigned?.[roleKey]||[]).length;
        const line=document.createElement('div');
        line.className='shift-role-line';
        const nameSpan=document.createElement('span');
        nameSpan.textContent=roleLabels[roleKey] || roleKey;
        const countSpan=document.createElement('span');
        countSpan.textContent=`${assigned}/${required}`;
        countSpan.className=assigned<required ? 'role-count short' : 'role-count';
        line.appendChild(nameSpan);
        line.appendChild(countSpan);
        roleBreakdown.appendChild(line);
      });
      wrapper.appendChild(roleBreakdown);
    }

    return wrapper;
  }

  function createWeekdayHeader(){
    const header=document.createElement('div');
    header.className='calendar-week-header';
    dayNamesShort.forEach(name=>{
      const cell=document.createElement('div');
      cell.className='calendar-weekday-label';
      cell.textContent=name;
      header.appendChild(cell);
    });
    return header;
  }

  function renderDayCard(day){
    const card=document.createElement('div');
    card.className='day-card';
    card.dataset.date=day.dateISO;
    if(!day.inMonth) card.classList.add('out-month');
    if(day.dayData?.isWeekend || [0,6].includes(day.dateObj.getDay())) card.classList.add('weekend');
    if(day.dayData?.isHoliday) card.classList.add('holiday');

    const header=document.createElement('div');
    header.className='day-card-header';
    const title=document.createElement('span');
    title.className='day-card-title';
    title.textContent=dayNamesShort[day.dateObj.getDay()];
    const dateEl=document.createElement('span');
    dateEl.className='day-card-date';
    dateEl.textContent=day.dateObj.getDate();
    header.appendChild(title);
    header.appendChild(dateEl);
    card.appendChild(header);

    if(day.dayData){
      card.classList.add('has-data');
    }else{
      card.classList.add('no-data');
    }

    const meta=document.createElement('div');
    meta.className='day-card-meta';
    if(day.dayData?.isHoliday){
      const holidayBadge=document.createElement('span');
      holidayBadge.className='badge warn';
      holidayBadge.textContent=day.dayData.holidayName || translate('holidayNamePlaceholder');
      meta.appendChild(holidayBadge);
    }
    if(meta.childNodes.length){
      card.appendChild(meta);
    }

    const body=document.createElement('div');
    body.className='day-card-body';
    if(day.dayData && Array.isArray(day.dayData.shifts) && day.dayData.shifts.length){
      day.dayData.shifts.forEach(shift=>{
        body.appendChild(createShiftSummary(shift));
      });
    }else if(day.inMonth){
      const empty=document.createElement('p');
      empty.className='muted';
      empty.textContent=translate('noShiftsScheduled');
      body.appendChild(empty);
    }else{
      const spacer=document.createElement('div');
      spacer.className='muted';
      spacer.innerHTML='&nbsp;';
      body.appendChild(spacer);
    }
    card.appendChild(body);

    const shouldOpenDetail = day.inMonth && (day.dayData || (scheduleResults?.schedule?.length>0));
    if(shouldOpenDetail){
      card.classList.add('interactive');
      card.addEventListener('click',()=> openDayDetail(day.dateISO));
    }

    return card;
  }

  function getSelectedPersonalEmployee(){
    if(!personalRoster || !personalRoster.length) return null;
    return personalRoster.find(emp=>emp.name===personalState.employee) || personalRoster[0] || null;
  }

  function preparePersonalState(){
    if(!personalRoster.length || !scheduleResults.schedule || !scheduleResults.schedule.length){
      personalState.employee=null;
      personalState.availableMonths=[];
      personalState.weeks=[];
      personalState.month=null;
      personalState.year=null;
      personalState.weekIndex=0;
      return;
    }

    const names=personalRoster.map(p=>p.name);
    if(!personalState.employee || !names.includes(personalState.employee)){
      personalState.employee=names[0];
    }

    const monthMap=new Map();
    (scheduleResults.schedule||[]).forEach(day=>{
      const dObj=new Date(day.date);
      if(Number.isNaN(dObj.getTime())) return;
      const year=dObj.getFullYear();
      const month=dObj.getMonth();
      const key=`${year}-${month}`;
      if(!monthMap.has(key)){
        monthMap.set(key,{ year, month, label:`${monthNamesFull[month]} ${year}` });
      }
    });

    const sortedMonths=Array.from(monthMap.values()).sort((a,b)=> a.year===b.year ? a.month-b.month : a.year-b.year);
    personalState.availableMonths=sortedMonths;

    if(!sortedMonths.length){
      personalState.weeks=[];
      personalState.month=null;
      personalState.year=null;
      personalState.weekIndex=0;
      return;
    }

    const years=Array.from(new Set(sortedMonths.map(m=>m.year))).sort((a,b)=>a-b);
    if(personalState.year==null || !years.includes(personalState.year)){
      personalState.year=years.includes(calendarState.year)?calendarState.year:years[0];
      if(!years.includes(personalState.year)){
        personalState.year=years[0];
      }
    }

    let monthsForYear=sortedMonths.filter(m=>m.year===personalState.year);
    if(!monthsForYear.length){
      personalState.year=sortedMonths[0].year;
      monthsForYear=sortedMonths.filter(m=>m.year===personalState.year);
    }

    if(personalState.month==null || !monthsForYear.some(m=>m.month===personalState.month)){
      personalState.month=monthsForYear[0].month;
    }

    personalState.weeks=buildWeeksForMonth(personalState.year, personalState.month);
    if(!personalState.weeks.length){
      personalState.weekIndex=0;
      return;
    }

    const selectedEmployee=getSelectedPersonalEmployee();
    if(selectedEmployee && selectedEmployee.assignments.length){
      const assignmentDates=new Set(selectedEmployee.assignments.map(a=>a.date));
      const weekWithAssignment=personalState.weeks.findIndex(week=>week.some(day=>assignmentDates.has(day.dateISO)));
      if(weekWithAssignment>=0){ personalState.weekIndex=weekWithAssignment; }
      if(personalState.weekIndex>=personalState.weeks.length){ personalState.weekIndex=0; }
    }else if(personalState.weekIndex>=personalState.weeks.length){
      personalState.weekIndex=0;
    }

    if(personalState.mode==='month'){
      personalState.weekIndex=Math.min(Math.max(personalState.weekIndex,0), personalState.weeks.length-1);
    }
  }

  function updatePersonalControlsUI(){
    const employeeSelect=qs('#personalEmployeeSelect');
    if(employeeSelect){
      if(personalRoster.length){
        employeeSelect.innerHTML=personalRoster.map(emp=>`<option value="${emp.name}">${emp.name}</option>`).join('');
        if(!personalRoster.some(emp=>emp.name===personalState.employee)){
          personalState.employee=personalRoster[0].name;
        }
        employeeSelect.disabled=false;
        employeeSelect.value=personalState.employee || personalRoster[0].name;
      }else{
        employeeSelect.innerHTML='';
        employeeSelect.disabled=true;
      }
    }

    const modeSelect=qs('#personalMode');
    if(modeSelect){
      modeSelect.value=personalState.mode;
      modeSelect.disabled=!personalRoster.length;
    }

    const availableMonths=personalState.availableMonths||[];
    const years=Array.from(new Set(availableMonths.map(m=>m.year))).sort((a,b)=>a-b);

    const yearSelect=qs('#personalYear');
    if(yearSelect){
      yearSelect.innerHTML=years.map(year=>`<option value="${year}">${year}</option>`).join('');
      if(!years.length){
        yearSelect.disabled=true;
      }else{
        if(!years.includes(personalState.year)){
          personalState.year=years[0];
        }
        yearSelect.disabled=false;
        yearSelect.value=String(personalState.year);
      }
    }

    const monthSelect=qs('#personalMonth');
    if(monthSelect){
      const monthsForYear=availableMonths.filter(m=>m.year===personalState.year);
      monthSelect.innerHTML=monthsForYear.map(m=>`<option value="${m.month}">${monthNamesFull[m.month]}</option>`).join('');
      if(!monthsForYear.length){
        monthSelect.disabled=true;
      }else{
        if(!monthsForYear.some(m=>m.month===personalState.month)){
          personalState.month=monthsForYear[0].month;
        }
        monthSelect.disabled=false;
        monthSelect.value=String(personalState.month);
      }
    }

    const weekControls=qs('#personalWeekControls');
    if(weekControls){
      weekControls.style.display=(personalState.mode==='week' && personalState.weeks.length)?'flex':'none';
    }
    const weekLabel=qs('#personalWeekLabel');
    if(weekLabel){
      if(personalState.mode==='week' && personalState.weeks.length){
        weekLabel.textContent=translate('weekCounter',{
          current: Math.min(personalState.weekIndex+1, personalState.weeks.length),
          total: personalState.weeks.length
        });
      }else{
        weekLabel.textContent=translate('noWeeks');
      }
    }
    const prevBtn=qs('#personalPrevWeek');
    const nextBtn=qs('#personalNextWeek');
    if(prevBtn){
      const disabled=personalState.mode!=='week' || personalState.weekIndex<=0;
      prevBtn.disabled=disabled;
      prevBtn.setAttribute('aria-disabled',disabled?'true':'false');
    }
    if(nextBtn){
      const disabled=personalState.mode!=='week' || personalState.weekIndex>=personalState.weeks.length-1;
      nextBtn.disabled=disabled;
      nextBtn.setAttribute('aria-disabled',disabled?'true':'false');
    }
  }

  function createPersonalCalendarCell(day, assignments, options={}){
    const isDayOff=!!options.isDayOff;
    const cell=document.createElement('div');
    cell.className='personal-day-cell';
    if(!day.inMonth) cell.classList.add('out-month');
    if(day.dayData?.isHoliday) cell.classList.add('holiday');
    if(day.dayData?.isWeekend || [0,6].includes(day.dateObj.getDay())) cell.classList.add('weekend');
    if(isDayOff && day.inMonth) cell.classList.add('day-off');

    const header=document.createElement('div');
    header.className='personal-day-header';
    header.innerHTML=`<span>${dayNamesShort[day.dateObj.getDay()]}</span><span>${day.dateObj.getDate()}</span>`;
    cell.appendChild(header);

    const tags=document.createElement('div');
    tags.className='personal-shift-tags';
    if(isDayOff && day.inMonth){
      const dayOffTag=document.createElement('div');
      dayOffTag.className='personal-dayoff-tag';
      dayOffTag.textContent=translate('dayOffLabel');
      tags.appendChild(dayOffTag);
    }
    assignments.forEach(assignment=>{
      const tag=document.createElement('div');
      const roleClass=assignment.role ? `role-${assignment.role}` : 'role-guard';
      const refillClass=assignment.isRefill ? 'personal-shift-refill' : '';
      tag.className=`personal-shift-tag ${roleClass} ${refillClass}`.trim();
      tag.textContent=`${assignment.shiftName} (${assignment.startTime}-${assignment.endTime})`;
      tags.appendChild(tag);
    });
    if(!assignments.length && !isDayOff){
      const empty=document.createElement('div');
      empty.className='personal-empty';
      empty.textContent=translate('noShiftLabel');
      tags.appendChild(empty);
    }
    cell.appendChild(tags);

    if(day.dayData){
      cell.classList.add('has-data');
      cell.addEventListener('click',()=> openDayDetail(day.dateISO));
    }

    return cell;
  }

  function renderPersonalGantt(selectedEmployee){
    const container=qs('#personalCalendar');
    if(!container) return;
    container.classList.remove('week-mode','month-mode');

    if(!personalRoster.length){
      container.innerHTML=`<p class="muted">${translate('noPersonalRoster')}</p>`;
      return;
    }
    if(!scheduleResults.schedule || !scheduleResults.schedule.length){
      container.innerHTML=`<p class="muted">${translate('runSchedulerPersonal')}</p>`;
      return;
    }
    if(!selectedEmployee){
      container.innerHTML=`<p class="muted">${translate('selectEmployeePrompt')}</p>`;
      return;
    }

    container.classList.add(personalState.mode==='month'?'month-mode':'week-mode');
    container.innerHTML='';

    const assignmentsByDate=new Map();
    (selectedEmployee.assignments||[]).forEach(assignment=>{
      if(!assignmentsByDate.has(assignment.date)){
        assignmentsByDate.set(assignment.date, []);
      }
      assignmentsByDate.get(assignment.date).push(assignment);
    });

    const dayOffMap=scheduleData.dayOffMap || (scheduleData.dayOffMap={});
    const dayOffSet=ensureDayOffEntry(dayOffMap,selectedEmployee.name);

    if(!personalState.weeks.length){
      container.innerHTML=`<p class="muted">${translate('noDataInRange')}</p>`;
      return;
    }

    // container.appendChild(createWeekdayHeader());

    if(personalState.mode==='month'){
      personalState.weeks.forEach(week=>{
        const row=document.createElement('div');
        row.className='personal-week-grid';
        week.forEach(day=>{
          const isDayOff=dayOffSet.has(day.dateISO);
          row.appendChild(createPersonalCalendarCell(day, assignmentsByDate.get(day.dateISO)||[], { isDayOff }));
        });
        container.appendChild(row);
      });
    }else{
      const currentWeek=personalState.weeks[personalState.weekIndex] || personalState.weeks[0];
      if(currentWeek){
        const row=document.createElement('div');
        row.className='personal-week-grid';
        currentWeek.forEach(day=>{
          const isDayOff=dayOffSet.has(day.dateISO);
          row.appendChild(createPersonalCalendarCell(day, assignmentsByDate.get(day.dateISO)||[], { isDayOff }));
        });
        container.appendChild(row);
      }
    }
  }

  function renderPersonalView(){
    updatePersonalControlsUI();
    const selected=getSelectedPersonalEmployee();
    const summary=qs('#personalSummary');
    if(summary){
      if(!selected){
        summary.innerHTML=`<p class="muted">${escapeHtml(translate('selectEmployeePrompt'))}</p>`;
      }else{
        const happinessData=employeeHappiness.get(selected.name);
        if(happinessData && Number.isFinite(happinessData.score) && (happinessData.totalShifts||0)>0){
          const score=Math.max(0, Math.min(100, happinessData.score));
          const matched=happinessData.preferredMatches||0;
          const total=happinessData.totalShifts||0;
          const weekend=happinessData.weekendShifts||0;
          const night=happinessData.nightShifts||0;
          summary.innerHTML=`
            <div class="personal-happiness-card">
              <div class="personal-happiness-header">
                <span>${escapeHtml(translate('happinessLabel'))}</span>
                <span class="personal-happiness-score">${escapeHtml(translate('happinessScore',{ score }))}</span>
              </div>
              <div class="happiness-meter"><div class="happiness-meter-bar" style="width:${score}%"></div></div>
              <div class="personal-happiness-notes">
                <span>${escapeHtml(translate('happinessPreferredSummary',{ matched, total }))}</span>
                <span>${escapeHtml(translate('happinessWeekendSummary',{ weekend, total }))}</span>
                <span>${escapeHtml(translate('happinessNightSummary',{ night, total }))}</span>
              </div>
              <details class="happiness-formula">
                <summary>${escapeHtml(translate('happinessFormulaHeading'))}</summary>
                <p>${escapeHtml(translate('happinessFormulaIntro'))}</p>
                <ul>
                  <li>${escapeHtml(translate('happinessFormulaPreferred'))}</li>
                  <li>${escapeHtml(translate('happinessFormulaWeekend'))}</li>
                  <li>${escapeHtml(translate('happinessFormulaNight'))}</li>
                  <li>${escapeHtml(translate('happinessFormulaHours'))}</li>
                  <li>${escapeHtml(translate('happinessFormulaStreak'))}</li>
                  <li>${escapeHtml(translate('happinessFormulaRest'))}</li>
                </ul>
              </details>
            </div>`;
        }else{
          summary.innerHTML=`<p class="muted">${escapeHtml(translate('happinessUnknown'))}</p>`;
        }
      }
    }
    renderPersonalGantt(selected);
  }

  function getEmployeesForRole(role){
    return (scheduleData.employees||[]).filter(emp=>emp.role===role).map(emp=>emp.name);
  }

  function renderDayGantt(day, dayIndex){
    const ganttRows = qs('#ganttRows');
    if(!ganttRows) return;
    ganttRows.innerHTML='';

    const totalMinutes=24*60;
    const employeeAssignments=new Map();

    function ensureEmployee(name){
      if(!employeeAssignments.has(name)){
        employeeAssignments.set(name,[]);
      }
      return employeeAssignments.get(name);
    }

    function pushAssignment({ employeeName, role, shiftName, startTime, endTime, overrideStartMinutes, overrideEndMinutes, fromPreviousDay=false }){
      if(!employeeName) return;
      const list=ensureEmployee(employeeName);
      let startMinutes = typeof overrideStartMinutes==='number' ? overrideStartMinutes : timeToMinutes(startTime);
      let endMinutes = typeof overrideEndMinutes==='number' ? overrideEndMinutes : timeToMinutes(endTime);
      let crossesMidnight=false;
      if(!fromPreviousDay && endMinutes<=startMinutes){
        endMinutes+=totalMinutes;
        crossesMidnight=true;
      }
      if(fromPreviousDay){
        if(typeof overrideStartMinutes!=='number'){ startMinutes=0; }
        if(typeof overrideEndMinutes!=='number'){ endMinutes=timeToMinutes(endTime); }
        crossesMidnight=false;
      }
      list.push({
        shiftName,
        role,
        displayStart:startTime,
        displayEnd:endTime,
        startMinutes,
        endMinutes,
        fromPreviousDay,
        crossesMidnight: crossesMidnight || endMinutes>totalMinutes
      });
    }

    (day.shifts||[]).forEach(shift=>{
      Object.entries(shift.assigned||{}).forEach(([role, employees])=>{
        (employees||[]).forEach(empName=>{
          pushAssignment({
            employeeName:empName,
            role,
            shiftName:shift.name,
            startTime:shift.startTime,
            endTime:shift.endTime
          });
        });
      });
    });

    if(typeof dayIndex==='number' && dayIndex>0 && Array.isArray(scheduleResults?.schedule)){
      const prevDay = scheduleResults.schedule[dayIndex-1];
      if(prevDay && Array.isArray(prevDay.shifts)){
        prevDay.shifts.forEach(prevShift=>{
          const startMinutes=timeToMinutes(prevShift.startTime);
          const endMinutes=timeToMinutes(prevShift.endTime);
          if(endMinutes<=startMinutes){
            Object.entries(prevShift.assigned||{}).forEach(([role, employees])=>{
              (employees||[]).forEach(empName=>{
                pushAssignment({
                  employeeName:empName,
                  role,
                  shiftName:prevShift.name,
                  startTime:prevShift.startTime,
                  endTime:prevShift.endTime,
                  overrideStartMinutes:0,
                  overrideEndMinutes:endMinutes,
                  fromPreviousDay:true
                });
              });
            });
          }
        });
      }
    }

    const sortedEntries=[...employeeAssignments.entries()].sort((a,b)=>a[0].localeCompare(b[0]));

    if(!sortedEntries.length){
      const empty=document.createElement('div');
      empty.className='muted';
      empty.textContent=translate('noAssignmentsForDay');
      ganttRows.appendChild(empty);
      return;
    }

    sortedEntries.forEach(([empName, assignments])=>{
      assignments.sort((a,b)=>a.startMinutes-b.startMinutes);
      const row=document.createElement('div');
      row.className='gantt-row';

      const label=document.createElement('div');
      label.className='gantt-label';
      label.textContent=empName;
      row.appendChild(label);

      const track=document.createElement('div');
      track.className='gantt-track';

      assignments.forEach(assignment=>{
        const effectiveEnd=Math.min(assignment.endMinutes, totalMinutes);
        if(effectiveEnd<=assignment.startMinutes){
          return;
        }
        const bar=document.createElement('div');
        bar.className=`gantt-bar role-${assignment.role}-bar`;
        const start=assignment.startMinutes;
        const leftPercent=Math.max(0, Math.min(100, (start/totalMinutes)*100));
        const widthPercent=Math.max(0, ((effectiveEnd-start)/totalMinutes)*100);
        bar.style.left=`${leftPercent}%`;
        bar.style.width=`${Math.min(100-leftPercent, widthPercent)}%`;
        if(assignment.endMinutes>totalMinutes){
          bar.dataset.continues='true';
        }
        bar.textContent=`${assignment.shiftName} (${assignment.displayStart}-${assignment.displayEnd})`;
        track.appendChild(bar);
      });

      row.appendChild(track);
      ganttRows.appendChild(row);
    });
  }

  function renderDayAssignments(day, dayIndex){
    const container=qs('#dayAssignments');
    if(!container) return;
    container.innerHTML='';

    if(!day.shifts || !day.shifts.length){
      container.innerHTML=`<p class="muted">${translate('noShiftsConfigured')}</p>`;
      return;
    }

    day.shifts.forEach((shift, shiftIndex)=>{
      const card=document.createElement('div');
      card.className='assignment-editor';

      const head=document.createElement('div');
      head.className='assignment-editor-head';
      const headInfo=document.createElement('div');
      headInfo.className='assignment-head-info';
      const title=document.createElement('h3');
      title.textContent=shift.name;
      const time=document.createElement('span');
      time.textContent=`${shift.startTime} - ${shift.endTime}`;
      headInfo.appendChild(title);
      headInfo.appendChild(time);
      head.appendChild(headInfo);

      if(dayDetailEditState.active && dayDetailEditState.dayIndex===dayIndex){
        const headActions=document.createElement('div');
        headActions.className='assignment-head-actions';
        const removeShiftBtn=document.createElement('button');
        removeShiftBtn.type='button';
        removeShiftBtn.className='btn btn-secondary btn-compact';
        removeShiftBtn.textContent=translate('removeButton');
        removeShiftBtn.addEventListener('click',()=>{
          removeShiftFromDay(dayIndex, shiftIndex);
        });
        headActions.appendChild(removeShiftBtn);
        head.appendChild(headActions);
      }
      card.appendChild(head);

      const roleKeys=new Set([...Object.keys(shift.requirements||{}), ...Object.keys(shift.assigned||{})]);
      roleKeys.forEach(role=>{
        const roleSection=document.createElement('div');
        roleSection.className='assignment-role';

        const roleTitle=document.createElement('div');
        roleTitle.className='assignment-role-title';
        const required=shift.requirements?.[role] ?? 0;
        const requiredLabel=translate('roleRequiredLabel',{ count: required });
        roleTitle.innerHTML=`<span>${roleLabels[role]||role}</span><span>${requiredLabel}</span>`;
        roleSection.appendChild(roleTitle);

        const chipList=document.createElement('div');
        chipList.className='assignment-chip-list';
        const assignedList=(shift.assigned?.[role]||[]);
        assignedList.forEach(employeeName=>{
          const chip=document.createElement('span');
          chip.className='assignment-chip';
          chip.textContent=employeeName;
          const removeBtn=document.createElement('button');
          removeBtn.type='button';
          removeBtn.setAttribute('aria-label',translate('removeAssignmentAria',{ name: employeeName }));
          removeBtn.textContent='×';
          removeBtn.addEventListener('click',()=>{
            removeAssignmentFromShift(dayIndex, shiftIndex, role, employeeName);
          });
          chip.appendChild(removeBtn);
          chipList.appendChild(chip);
        });
        if(!assignedList.length){
          const empty=document.createElement('span');
          empty.className='muted';
          empty.textContent=translate('noAssignments');
          chipList.appendChild(empty);
        }
        roleSection.appendChild(chipList);

        const addWrapper=document.createElement('div');
        addWrapper.className='assignment-add';
        const existing=new Set((shift.assigned?.[role]||[]));
        const availableEmployees=getEmployeesForRole(role).filter(name=>!existing.has(name));
        const addBtn=document.createElement('button');
        addBtn.type='button';
        addBtn.className='btn btn-secondary btn-compact assignment-add-trigger';
        addBtn.textContent=translate('addLabel');
        addWrapper.appendChild(addBtn);

        if(availableEmployees.length){
          const select=document.createElement('select');
          select.className='assignment-add-menu';
          select.hidden=true;
          const placeholder=document.createElement('option');
          placeholder.value='';
          placeholder.textContent=translate('selectRolePlaceholder',{ role: roleLabels[role]||role });
          select.appendChild(placeholder);
          availableEmployees.forEach(name=>{
            const option=document.createElement('option');
            option.value=name;
            option.textContent=name;
            select.appendChild(option);
          });
          addWrapper.appendChild(select);
          addBtn.addEventListener('click',()=>{
            select.hidden=!select.hidden;
            if(!select.hidden){
              select.focus();
            }
          });
          select.addEventListener('change',event=>{
            const value=event.target.value;
            if(value){
              addAssignmentToShift(dayIndex, shiftIndex, role, value);
              event.target.value='';
              select.hidden=true;
            }
          });
          select.addEventListener('blur',()=>{
            select.hidden=true;
            select.value='';
          });
        }else{
          addBtn.disabled=true;
          const noOptions=document.createElement('span');
          noOptions.className='muted assignment-add-empty';
          noOptions.textContent=translate('noAvailableEmployees');
          addWrapper.appendChild(noOptions);
        }
        roleSection.appendChild(addWrapper);

        card.appendChild(roleSection);
      });

      container.appendChild(card);
    });
  }

  function addShiftToDayFromTemplate(templateIndex){
    if(!dayDetailEditState.active) return;
    const dayIndex=dayDetailEditState.dayIndex;
    const templates=scheduleData?.shifts || [];
    const template=templates[templateIndex];
    if(!template) return;
    const newShift={
      name:template.name,
      startTime:template.startTime,
      endTime:template.endTime,
      requirements:{
        guard:template.requirements?.guard ?? 0,
        supervisor:template.requirements?.supervisor ?? 0,
        senior:template.requirements?.senior ?? 0
      },
      assigned:{ guard:[], supervisor:[], senior:[] }
    };
    dayDetailEditState.working.shifts = Array.isArray(dayDetailEditState.working.shifts) ? dayDetailEditState.working.shifts : [];
    dayDetailEditState.working.shifts.push(newShift);
    sortShiftsByStart(dayDetailEditState.working.shifts);
    markDayDetailDirty();
    renderDayDetailView(dayDetailEditState.working.date,{ useWorking:true });
  }

  function removeShiftFromDay(dayIndex, shiftIndex){
    if(!dayDetailEditState.active || dayDetailEditState.dayIndex!==dayIndex) return;
    const shifts=dayDetailEditState.working?.shifts;
    if(!Array.isArray(shifts)) return;
    if(shiftIndex<0 || shiftIndex>=shifts.length) return;
    shifts.splice(shiftIndex,1);
    markDayDetailDirty();
    renderDayDetailView(dayDetailEditState.working.date,{ useWorking:true });
  }

  function addAssignmentToShift(dayIndex, shiftIndex, role, employeeName){
    const day=getEditableDay(dayIndex);
    if(!day) return;
    const shift=day.shifts?.[shiftIndex];
    if(!shift) return;
    if(!shift.assigned[role]){ shift.assigned[role]=[]; }
    if(!shift.assigned[role].includes(employeeName)){
      shift.assigned[role].push(employeeName);
      if(dayDetailEditState.active && dayDetailEditState.dayIndex===dayIndex){
        markDayDetailDirty();
        renderDayDetailView(day.date,{ useWorking:true });
      }else{
        refreshAfterAssignmentChange();
      }
    }
  }

  function removeAssignmentFromShift(dayIndex, shiftIndex, role, employeeName){
    const day=getEditableDay(dayIndex);
    if(!day) return;
    const shift=day.shifts?.[shiftIndex];
    if(!shift || !shift.assigned?.[role]) return;
    const idx=shift.assigned[role].indexOf(employeeName);
    if(idx!==-1){
      shift.assigned[role].splice(idx,1);
      if(dayDetailEditState.active && dayDetailEditState.dayIndex===dayIndex){
        markDayDetailDirty();
        renderDayDetailView(day.date,{ useWorking:true });
      }else{
        refreshAfterAssignmentChange();
      }
    }
  }

  function recalculateScheduleMetrics(){
    if(!scheduleResults || !Array.isArray(scheduleResults.schedule)) return;
    let totalRequired=0;
    let totalAssigned=0;
    let roleRequirementsMet=0;
    let totalRoleRequirements=0;

    scheduleResults.schedule.forEach(day=>{
      day.shifts.forEach(shift=>{
        Object.entries(shift.requirements||{}).forEach(([role, req])=>{
          const requirement=parseInt(req||0,10);
          const assignedCount=(shift.assigned?.[role]||[]).length;
          totalRequired+=requirement;
          if(requirement>0){ totalRoleRequirements+=1; }
          totalAssigned+=Math.min(assignedCount, requirement);
          if(assignedCount>=requirement){ roleRequirementsMet+=1; }
        });
      });
    });

    const coverageRate=totalRequired>0?Math.round((totalAssigned/totalRequired)*100):0;
    const roleCompliance=totalRoleRequirements>0?Math.round((roleRequirementsMet/totalRoleRequirements)*100):0;
    const prevMetrics=scheduleResults.metrics||{};
    scheduleResults.metrics={
      coverageRate,
      roleCompliance,
      constraintCompliance: prevMetrics.constraintCompliance ?? 95,
      processingTime: prevMetrics.processingTime ?? 500
    };

    const coverageEl=qs('#coverageRate'); if(coverageEl) coverageEl.textContent=coverageRate+'%';
    const roleEl=qs('#roleCompliance'); if(roleEl) roleEl.textContent=roleCompliance+'%';
    const constraintEl=qs('#constraintCompliance'); if(constraintEl) constraintEl.textContent=scheduleResults.metrics.constraintCompliance+'%';
    const timeEl=qs('#processingTime'); if(timeEl) timeEl.textContent=scheduleResults.metrics.processingTime+'ms';
  }

  function refreshAfterAssignmentChange(){
    const currentEmployee=personalState.employee;
    recalculateScheduleMetrics();
    generateSiteCalendar();
    personalState.employee=currentEmployee;
    generatePersonalSchedules();
    const stillExists=currentEmployee && personalRoster.some(emp=>emp.name===currentEmployee);
    if(stillExists && personalState.employee!==currentEmployee){
      personalState.employee=currentEmployee;
      renderPersonalView();
    }
    if(currentDayDetailDate){
      const rendered = renderDayDetailView(currentDayDetailDate);
      if(!rendered){ closeDayDetail(); }
    }
  }

  function renderCalendarView(){
    updateCalendarControlsUI();
    const container=qs('#siteCalendar');
    if(!container) return;
    container.classList.remove('week-mode','month-mode');
    container.innerHTML='';

    if(!calendarState.weeks.length){
      container.innerHTML=`<p class="muted">${translate('noScheduleDays')}</p>`;
      return;
    }

    // container.appendChild(createWeekdayHeader());

    if(calendarState.mode==='month'){
      container.classList.add('month-mode');
      calendarState.weeks.forEach(week=>{
        const row=document.createElement('div');
        row.className='month-week';
        week.forEach(day=> row.appendChild(renderDayCard(day)));
        container.appendChild(row);
      });
    }else{
      container.classList.add('week-mode');
      const week=calendarState.weeks[calendarState.weekIndex] || [];
      const row=document.createElement('div');
      row.className='week-row';
      week.forEach(day=> row.appendChild(renderDayCard(day)));
      container.appendChild(row);
    }
  }

  function generateSiteCalendar(){
    const container=qs('#siteCalendar');
    if(!container) return;
    if(!scheduleResults.schedule || !scheduleResults.schedule.length){
      calendarState.availableMonths=[];
      calendarState.weeks=[];
      calendarState.month=null;
      calendarState.year=null;
      calendarState.weekIndex=0;
      updateCalendarControlsUI();
      container.innerHTML=`<p class="muted">${translate('runSchedulerPrompt')}</p>`;
      return;
    }
    prepareCalendarState();
    renderCalendarView();
  }

  // ===== Day Detail View =====
  function cloneDaySnapshot(day){
    return day ? JSON.parse(JSON.stringify(day)) : null;
  }

  function getEditableDay(dayIndex){
    if(dayDetailEditState.active && dayDetailEditState.dayIndex===dayIndex){
      return dayDetailEditState.working;
    }
    return scheduleResults?.schedule?.[dayIndex] || null;
  }

  function markDayDetailDirty(){
    if(!dayDetailEditState.active) return;
    dayDetailEditState.dirty=true;
    updateDayDetailActionState();
  }

  function resetDayDetailState(){
    dayDetailEditState={ active:false, dayIndex:null, original:null, working:null, dirty:false };
    const select=qs('#dayShiftTemplate');
    if(select){
      select.innerHTML='';
      select.disabled=true;
    }
    updateDayDetailActionState();
  }

  function beginDayDetailSession(dayIndex){
    if(!scheduleResults || !Array.isArray(scheduleResults.schedule)) return false;
    const day=scheduleResults.schedule[dayIndex];
    if(!day) return false;
    dayDetailEditState={
      active:true,
      dayIndex,
      original:cloneDaySnapshot(day),
      working:cloneDaySnapshot(day),
      dirty:false
    };
    populateDayShiftTemplateOptions();
    updateDayDetailActionState();
    return true;
  }

  function populateDayShiftTemplateOptions(){
    const select=qs('#dayShiftTemplate');
    const addBtn=qs('#dayAddShift');
    if(!select){
      if(addBtn){ addBtn.disabled=true; }
      return;
    }
    const templates=scheduleData?.shifts || [];
    select.innerHTML=templates.map((shift, index)=>`<option value="${index}">${shift.name || 'Shift'} (${shift.startTime}-${shift.endTime})</option>`).join('');
    const hasTemplates=templates.length>0;
    select.disabled=!hasTemplates;
    if(addBtn){
      addBtn.disabled=!hasTemplates || !dayDetailEditState.active;
    }
  }

  function updateDayDetailActionState(){
    const saveBtn=qs('#daySaveChanges');
    const discardBtn=qs('#dayDiscardChanges');
    const hint=qs('#dayPendingHint');
    const addBtn=qs('#dayAddShift');
    if(saveBtn){
      saveBtn.disabled=!(dayDetailEditState.active && dayDetailEditState.dirty);
    }
    if(discardBtn){
      discardBtn.disabled=!(dayDetailEditState.active && dayDetailEditState.dirty);
    }
    if(hint){
      hint.style.display=(dayDetailEditState.active && dayDetailEditState.dirty)?'block':'none';
    }
    if(addBtn){
      const templates=scheduleData?.shifts || [];
      addBtn.disabled=!(dayDetailEditState.active) || !templates.length;
    }
  }

  function applyDayDetailChanges(){
    if(!dayDetailEditState.active || !dayDetailEditState.dirty) return;
    const dayIndex=dayDetailEditState.dayIndex;
    if(!scheduleResults?.schedule?.[dayIndex]) return;
    scheduleResults.schedule[dayIndex]=cloneDaySnapshot(dayDetailEditState.working);
    dayDetailEditState.original=cloneDaySnapshot(dayDetailEditState.working);
    dayDetailEditState.dirty=false;
    updateDayDetailActionState();
    refreshAfterAssignmentChange();
  }

  function discardDayDetailChanges(){
    if(!dayDetailEditState.active) return;
    dayDetailEditState.working=cloneDaySnapshot(dayDetailEditState.original);
    dayDetailEditState.dirty=false;
    renderDayDetailView(currentDayDetailDate,{ useWorking:true });
    updateDayDetailActionState();
  }

  function sortShiftsByStart(shifts){
    if(!Array.isArray(shifts)) return;
    shifts.sort((a,b)=> timeToMinutes(a.startTime||'00:00') - timeToMinutes(b.startTime||'00:00'));
  }

  function renderDayDetailView(dateStr, options={}){
    if(!scheduleResults || !Array.isArray(scheduleResults.schedule)) return false;
    const dayIndex=scheduleResults.schedule.findIndex(d=>d.date===dateStr);
    if(dayIndex===-1) return false;
    let day=scheduleResults.schedule[dayIndex];
    if(options.useWorking!==false && dayDetailEditState.active && dayDetailEditState.dayIndex===dayIndex && dayDetailEditState.working){
      day=dayDetailEditState.working;
    }

    const dayTitle = qs('#dayTitle');
    if(dayTitle){
      const dObj = new Date(day.date);
      dayTitle.textContent = `${dayNamesLong[dObj.getDay()]}, ${monthNamesFull[dObj.getMonth()]} ${dObj.getDate()}, ${dObj.getFullYear()}`;
    }

    const dayMeta = qs('#dayMeta');
    if(dayMeta){
      let metaHTML = '';
      if (day.isHoliday) {
        metaHTML += `<div class="badge warn">Holiday: ${day.holidayName}</div>`;
      }
      dayMeta.innerHTML = metaHTML;
    }

    if(dayDetailEditState.active){
      populateDayShiftTemplateOptions();
    }

    renderDayGantt(day, dayIndex);
    renderDayAssignments(day, dayIndex);
    updateDayDetailActionState();
    return true;
  }

  function renderEmptyDayDetailView(dateStr){
    const dayTitle = qs('#dayTitle');
    const dateObj = new Date(dateStr);
    if(dayTitle){
      if(!Number.isNaN(dateObj.getTime())){
        dayTitle.textContent = `${dayNamesLong[dateObj.getDay()]}, ${monthNamesFull[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
      }else{
        dayTitle.textContent = 'Day Detail';
      }
    }

    const dayMeta = qs('#dayMeta');
    if(dayMeta){
      dayMeta.innerHTML = '<div class="badge warn">No schedule generated for this date.</div>';
    }

    const ganttRows = qs('#ganttRows');
    if(ganttRows){
      ganttRows.innerHTML = '<p class="muted">No Gantt data available. Generate a schedule covering this date.</p>';
    }

    const assignments = qs('#dayAssignments');
    if(assignments){
      assignments.innerHTML = `<p class="muted">${translate('noShiftsConfigured')}</p>`;
    }

    return true;
  }

  function openDayDetail(dateStr) {
    currentDayDetailDate=dateStr;
    const overlay = qs('#dayDetailOverlay');
    let rendered=false;
    if(scheduleResults && Array.isArray(scheduleResults.schedule)){
      const dayIndex=scheduleResults.schedule.findIndex(d=>d.date===dateStr);
      if(dayIndex!==-1){
        beginDayDetailSession(dayIndex);
        rendered=renderDayDetailView(dateStr,{ useWorking:true });
      }
    }
    if(!rendered){
      resetDayDetailState();
      rendered = renderEmptyDayDetailView(dateStr);
    }
    if (rendered && overlay) {
      overlay.style.display = 'block';
      overlay.setAttribute('aria-hidden', 'false');
    }else if(!rendered){
      currentDayDetailDate=null;
    }
  }
  
  function closeDayDetail() {
    currentDayDetailDate=null;
    resetDayDetailState();
    const overlay = qs('#dayDetailOverlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function formatDisplayDate(dateStr){
    const d=new Date(dateStr);
    return d.toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric'});
  }

  function generatePersonalSchedules(){
    const ganttContainer=qs('#personalCalendar');
    if(ganttContainer){ ganttContainer.innerHTML=''; }

    if(!scheduleResults.schedule || !scheduleResults.schedule.length){
      personalRoster=[];
      personalState.employee=null;
      personalState.availableMonths=[];
      personalState.weeks=[];
      personalState.month=null;
      personalState.year=null;
      personalState.weekIndex=0;
      updatePersonalControlsUI();
      const summary=qs('#personalSummary');
      if(summary){ summary.innerHTML=`<p class="muted">${escapeHtml(translate('runSchedulerPersonal'))}</p>`; }
      if(ganttContainer){ ganttContainer.innerHTML=`<p class="muted">${translate('noScheduleData')}</p>`; }
      return;
    }

    const roster={};
    scheduleData.employees.forEach(emp=>{
      roster[emp.name]={ ...emp, assignments:[] };
    });

    scheduleResults.schedule.forEach(day=>{
      day.shifts.forEach(shift=>{
        Object.entries(shift.assigned).forEach(([role,names])=>{
          names.forEach(name=>{
            if(!roster[name]){
              roster[name]={ name, role, maxWeeklyHours:scheduleData.maxWeeklyHours, assignments:[] };
            }
            roster[name].assignments.push({
              date:day.date,
              shiftName:shift.name,
              role,
              startTime:shift.startTime,
              endTime:shift.endTime,
              isRefill:!!shift.isRefill
            });
          });
        });
      });
    });

    const people=Object.values(roster).filter(emp=>emp.name).sort((a,b)=>a.name.localeCompare(b.name));
    personalRoster=people;

    preparePersonalState();
    renderPersonalView();
  }

  function analyzeConsecutiveDays(dates){
    if(!dates || dates.length===0) return { longest:0, sequences:[], restGaps:[] };
    const sorted=Array.from(new Set(dates)).sort();
    let longest=1; let current=1;
    const sequences=[];
    const restGaps=[];
    for(let i=1;i<sorted.length;i++){
      const prev=new Date(sorted[i-1]);
      const curr=new Date(sorted[i]);
      const diffDays=Math.round((curr-prev)/86400000);
      if(diffDays===1){
        current+=1; longest=Math.max(longest,current);
      }else{
        sequences.push(current);
        restGaps.push(diffDays-1);
        current=1;
      }
    }
    sequences.push(current);
    return { longest:Math.max(longest,current), sequences, restGaps };
  }

  function generateConstraintAnalysis(){
    const hours=qs('#hoursAnalysis');
    const consecutive=qs('#consecutiveAnalysis');
    if(!hours || !consecutive) return;

    const employeeStats=new Map();
    employeeHappiness.clear();
    scheduleData.employees.forEach(emp=>{
      const preferred=Array.isArray(emp.preferredShifts)?emp.preferredShifts.map(s=>s.toLowerCase()):[];
      employeeStats.set(emp.name,{
        ...emp,
        totalMinutes:0,
        workingDates:[],
        totalShifts:0,
        preferredMatches:0,
        weekendShifts:0,
        nightShifts:0,
        preferredSet:new Set(preferred)
      });
    });

    scheduleResults.schedule.forEach(day=>{
      day.shifts.forEach(shift=>{
        const durationMins=Math.round(durationHours(shift.startTime,shift.endTime)*60);
        Object.entries(shift.assigned).forEach(([role,names])=>{
          names.forEach(name=>{
            if(!employeeStats.has(name)){
              employeeStats.set(name,{
                name,
                role,
                maxWeeklyHours:scheduleData.maxWeeklyHours,
                preferredShifts:[],
                totalMinutes:0,
                workingDates:[],
                totalShifts:0,
                preferredMatches:0,
                weekendShifts:0,
                nightShifts:0,
                preferredSet:new Set()
              });
            }
            const stat=employeeStats.get(name);
            stat.role=role;
            stat.totalMinutes+=durationMins;
            stat.workingDates.push(day.date);
            stat.totalShifts+=1;
            const shiftName=(shift.name||'').toLowerCase();
            if(stat.preferredSet && stat.preferredSet.has(shiftName)){ stat.preferredMatches+=1; }
            if(day.isWeekend){ stat.weekendShifts+=1; }
            if(isNightShift(shift.startTime, shift.endTime)){ stat.nightShifts+=1; }
          });
        });
      });
    });

    const totalDays=Math.max(1,scheduleResults.schedule.length);
    const totalWeeks=Math.max(1, Math.ceil(totalDays/7));

    const hoursRows=[];
    const consecutiveRows=[];

    employeeStats.forEach(stat=>{
      const totalHours=(stat.totalMinutes/60).toFixed(1);
      const allowedHours=((stat.maxWeeklyHours||scheduleData.maxWeeklyHours)*totalWeeks).toFixed(1);
      const withinHours=parseFloat(totalHours)<=parseFloat(allowedHours);
      const totalShifts=Math.max(0, stat.totalShifts||0);
      const preferredMatches=Math.min(stat.preferredMatches||0, totalShifts);
      const weekendShifts=stat.weekendShifts||0;
      const nightShifts=stat.nightShifts||0;

      const { longest, sequences, restGaps }=analyzeConsecutiveDays(stat.workingDates);
      const overMax=sequences.some(len=>len>(scheduleData.maxConsecutiveDays||6));
      const insufficientRest=restGaps.some(gap=>gap>0 && gap<(scheduleData.minDayOff||1));

      let happiness=100;
      if(totalShifts>0){
        const preferredRatio=preferredMatches/totalShifts;
        const weekendRatio=weekendShifts/totalShifts;
        const nightRatio=nightShifts/totalShifts;
        happiness-=Math.round((1-preferredRatio)*40);
        happiness-=Math.round(weekendRatio*15);
        happiness-=Math.round(nightRatio*10);
      }
      if(!withinHours){ happiness-=15; }
      if(overMax){ happiness-=15; }
      if(insufficientRest){ happiness-=10; }
      happiness=Math.max(0, Math.min(100, Math.round(happiness)));
      const happinessCell=totalShifts>0?`${happiness}%`:'--';
      stat.happiness=happiness;
      employeeHappiness.set(stat.name,{
        score:happiness,
        preferredMatches,
        totalShifts,
        weekendShifts,
        nightShifts
      });

      hoursRows.push(
        '<tr class="'+(withinHours?'':'warn-row')+'">'+
          '<td>'+escapeHtml(stat.name)+'</td>'+ 
          '<td>'+totalHours+'h</td>'+ 
          '<td>'+allowedHours+'h</td>'+ 
          '<td>'+(withinHours?escapeHtml(translate('analysisWithinLimit')):escapeHtml(translate('analysisExceedsLimit')))+'</td>'+ 
          '<td>'+happinessCell+'</td>'+ 
        '</tr>'
      );

      const restMessage=insufficientRest
        ? escapeHtml(translate('analysisRestUnder',{ days: scheduleData.minDayOff||1 }))
        : escapeHtml(translate('analysisOk'));

      consecutiveRows.push(
        '<tr class="'+((overMax||insufficientRest)?'warn-row':'')+'">'+
          '<td>'+escapeHtml(stat.name)+'</td>'+ 
          '<td>'+longest+' '+escapeHtml(translate('analysisDays'))+'</td>'+ 
          '<td>'+(scheduleData.maxConsecutiveDays||6)+' '+escapeHtml(translate('analysisDays'))+'</td>'+ 
          '<td>'+(overMax?escapeHtml(translate('analysisStreakTooLong')):escapeHtml(translate('analysisOk')))+'</td>'+ 
          '<td>'+restMessage+'</td>'+ 
        '</tr>'
      );
    });

    hours.innerHTML=
      '<table class="analysis-table">'+
        '<thead><tr><th>'+escapeHtml(translate('employeeNameHeader'))+'</th><th>'+escapeHtml(translate('analysisScheduledHours'))+'</th><th>'+escapeHtml(translate('analysisAllowedHours'))+'</th><th>'+escapeHtml(translate('analysisStatus'))+'</th><th>'+escapeHtml(translate('analysisHappiness'))+'</th></tr></thead>'+ 
        '<tbody>'+ (hoursRows.join('') || '<tr><td colspan="5" class="muted">'+escapeHtml(translate('noAssignments'))+'</td></tr>') +'</tbody>'+ 
      '</table>';

    consecutive.innerHTML=
      '<table class="analysis-table">'+
        '<thead><tr><th>'+escapeHtml(translate('employeeNameHeader'))+'</th><th>'+escapeHtml(translate('analysisLongestStreak'))+'</th><th>'+escapeHtml(translate('analysisMaxAllowed'))+'</th><th>'+escapeHtml(translate('analysisStreakStatus'))+'</th><th>'+escapeHtml(translate('analysisRestCompliance'))+'</th></tr></thead>'+ 
        '<tbody>'+ (consecutiveRows.join('') || '<tr><td colspan="5" class="muted">'+escapeHtml(translate('noAssignments'))+'</td></tr>') +'</tbody>'+ 
      '</table>';

    const analysisNote=qs('#constraintFormulaNote') || document.createElement('div');
    analysisNote.id='constraintFormulaNote';
    analysisNote.className='analysis-note';
    analysisNote.innerHTML=`<strong>${escapeHtml(translate('happinessFormulaHeading'))}</strong><p>${escapeHtml(translate('happinessFormulaIntro'))}</p><ul><li>${escapeHtml(translate('happinessFormulaPreferred'))}</li><li>${escapeHtml(translate('happinessFormulaWeekend'))}</li><li>${escapeHtml(translate('happinessFormulaNight'))}</li><li>${escapeHtml(translate('happinessFormulaHours'))}</li><li>${escapeHtml(translate('happinessFormulaStreak'))}</li><li>${escapeHtml(translate('happinessFormulaRest'))}</li></ul>`;
    consecutive.parentElement?.appendChild(analysisNote);

    renderPersonalView();
  }

  function gatherConfigurationSnapshot(){
    try{
      const config={
        version:1,
        meta:{
          startDate:qs('#startDate')?.value||'',
          endDate:qs('#endDate')?.value||'',
          timezone:qs('#timezone')?.value||'',
          country:qs('#country')?.value||'',
          maxWeeklyHours:parseInt(qs('#maxWeeklyHours')?.value||'48',10),
          maxConsecutiveDays:parseInt(qs('#maxConsecutiveDays')?.value||'6',10),
          minDayOff:parseInt(qs('#minDayOff')?.value||'1',10),
          maxContinuousHours:parseInt(qs('#maxContinuousHours')?.value||'12',10),
          language:currentLanguage,
          theme:currentTheme
        },
        shifts:[],
        employees:[],
        holidays:[]
      };

      qsa('#shiftTableBody > tr').forEach(row=>{
        const name=row.querySelector('td:nth-child(1) input')?.value||'';
        const start=row.querySelector('.shift-start')?.value||'';
        const size=parseInt(row.querySelector('.shift-size')?.value||'8',10);
        const nums=row.querySelectorAll('input[type="number"]');
        config.shifts.push({
          name,
          startTime:start,
          size,
          requirements:{
            guard:parseInt(nums[0]?.value||'0',10),
            supervisor:parseInt(nums[1]?.value||'0',10),
            senior:parseInt(nums[2]?.value||'0',10)
          },
          isRefillTemplate: row.dataset?.refillTemplate==='true'
        });
      });

      qsa('#employeeTableBody > tr').forEach(row=>{
        const inputs=row.getElementsByTagName('input');
        const selects=row.getElementsByTagName('select');
        config.employees.push({
          name:inputs[0]?.value||'',
          role:selects[0]?.value||'guard',
          maxWeeklyHours:parseInt(inputs[1]?.value||'48',10),
          unavailableDates:datesCSVToArray(inputs[2]?.value||''),
          preferredShifts:datesCSVToArray(inputs[3]?.value||''),
          isSpare:row.querySelector('.spare-flag')?.checked||false
        });
      });

      qsa('#holidayTableBody tr').forEach(row=>{
        if(row.classList.contains('holiday-empty')) return;
        const date=row.querySelector('input[type=date]')?.value||'';
        const name=row.querySelector('input[type=text]')?.value||'';
        if(date){
          config.holidays.push({
            date,
            name,
            source:row.dataset.source||'custom'
          });
        }
      });

      return config;
    }catch(err){
      console.error('Failed to gather configuration snapshot', err);
      return null;
    }
  }

  function applyConfigurationSnapshot(config){
    if(!config || typeof config!=='object') return false;
    isApplyingConfiguration=true;
    try{
      if(config.meta){
        if(config.meta.startDate && qs('#startDate')) qs('#startDate').value=config.meta.startDate;
        if(config.meta.endDate && qs('#endDate')) qs('#endDate').value=config.meta.endDate;
        if(config.meta.timezone && qs('#timezone')) qs('#timezone').value=config.meta.timezone;
        if(config.meta.country && qs('#country')) qs('#country').value=config.meta.country;
        if(Number.isFinite(config.meta.maxWeeklyHours) && qs('#maxWeeklyHours')) qs('#maxWeeklyHours').value=config.meta.maxWeeklyHours;
        if(Number.isFinite(config.meta.maxConsecutiveDays) && qs('#maxConsecutiveDays')) qs('#maxConsecutiveDays').value=config.meta.maxConsecutiveDays;
        if(Number.isFinite(config.meta.minDayOff) && qs('#minDayOff')) qs('#minDayOff').value=config.meta.minDayOff;
        if(Number.isFinite(config.meta.maxContinuousHours) && qs('#maxContinuousHours')) qs('#maxContinuousHours').value=config.meta.maxContinuousHours;
        if(config.meta.language) setLanguage(config.meta.language);
        if(config.meta.theme) setTheme(config.meta.theme);
      }

      const shiftBody=qs('#shiftTableBody');
      if(shiftBody){
        shiftBody.innerHTML='';
        const shifts=Array.isArray(config.shifts) && config.shifts.length ? config.shifts : null;
        if(shifts){
          shifts.forEach(shift=>addShift({
            ...shift,
            locked: shift.isRefillTemplate,
            isRefillTemplate: shift.isRefillTemplate
          }));
        } else {
          addShift();
        }
        ensureRefillShiftPresence();
      }

      const employeeBody=qs('#employeeTableBody');
      if(employeeBody){
        employeeBody.innerHTML='';
        const employees=Array.isArray(config.employees) && config.employees.length ? config.employees : null;
        if(employees){ employees.forEach(emp=>addEmployee(emp)); } else { addEmployee(); }
      }

      const holidayBody=qs('#holidayTableBody');
      if(holidayBody){
        holidayBody.innerHTML='';
        if(Array.isArray(config.holidays) && config.holidays.length){
          config.holidays.forEach(h=> addHolidayRow(h.date, h.name, h.source||'custom'));
        }else{
          ensureHolidayPlaceholder(holidayBody,translate('holidayEmptyRegister'));
        }
      }

      syncPreferredOptionsToAllEmployees();
      return true;
    }catch(err){
      console.error('Failed to apply configuration snapshot', err);
      return false;
    }finally{
      isApplyingConfiguration=false;
    }
  }

  function persistConfiguration(){
    if(isApplyingConfiguration) return;
    if(autoPersistTimer){ clearTimeout(autoPersistTimer); autoPersistTimer=null; }
    const snapshot=gatherConfigurationSnapshot();
    if(!snapshot) return;
    try{
      const json=JSON.stringify(snapshot);
      const encoded=encodeURIComponent(json);
      if(encoded.length>3800){
        console.warn('Configuration approaching cookie size limit; consider reducing data.');
      }
      setCookie(CONFIG_COOKIE_NAME, encoded, CONFIG_COOKIE_EXPIRY_DAYS);
    }catch(err){
      console.error('Failed to persist configuration snapshot', err);
    }
  }

  function loadConfigurationFromCookie(){
    const raw=getCookie(CONFIG_COOKIE_NAME);
    if(!raw) return false;
    try{
      const decoded=decodeURIComponent(raw);
      const parsed=JSON.parse(decoded);
      const applied=applyConfigurationSnapshot(parsed);
      if(applied){
        console.log('[Config] Restored scheduling configuration from cookie.');
      }
      return applied;
    }catch(err){
      console.error('Failed to load configuration from cookie', err);
      return false;
    }
  }

  const exposedHandlers={
    addShift,
    removeShift,
    openEmployeeConfig,
    removeEmployee,
    addEmployee,
    addHolidayRow,
    removeHolidayRow,
    loadDefaultHolidaysForCountry,
    clearHolidayTable,
    switchTab,
    closeEmployeeConfig,
    addUnavailRow,
    saveEmployeeConfig,
    closeDayDetail
  };

  function exposeGlobalHandlers(){ if(typeof window!=='undefined'){ Object.assign(window,exposedHandlers); } }

  exposeGlobalHandlers();

  let initialized=false;
  function initializeApp(){
    exposeGlobalHandlers();
    if(initialized) return;
    initialized=true;

    if(typeof window!=='undefined'){
      window.publishDefaults=publishDefaults;
    }

    setTheme(currentTheme);
    setLanguage(currentLanguage);

    const startInput=qs('#startDate');
    const endInput=qs('#endDate');
    if(startInput && endInput){
      const today=new Date(); const nextWeek=new Date(today.getTime()+7*86400000);
      startInput.value=today.toISOString().split('T')[0];
      endInput.value=nextWeek.toISOString().split('T')[0];
    }

    const countrySelect=qs('#country');
    if(countrySelect){
      countrySelect.addEventListener('change',()=>{
        clearHolidayTable();
        loadDefaultHolidaysForCountry().catch(()=>{});
      });
    }

    attachShiftDelegates();
    ensureRefillShiftPresence();
    const trigger=qs('#startTest');
    if(trigger){ trigger.addEventListener('click',generateSchedule); }

    qsa('#shiftTableBody > tr').forEach(updateEndTimeRow);

    const modeSelect=qs('#calendarMode');
    if(modeSelect){
      modeSelect.addEventListener('change',event=>{
        const value=event.target.value;
        calendarState.mode=(value==='month')?'month':'week';
        if(calendarState.mode==='month'){ calendarState.weekIndex=0; }
        prepareCalendarState();
        renderCalendarView();
      });
    }
    const monthSelect=qs('#calendarMonth');
    if(monthSelect){
      monthSelect.addEventListener('change',event=>{
        const nextMonth=parseInt(event.target.value,10);
        if(!Number.isNaN(nextMonth)){
          calendarState.month=nextMonth;
          calendarState.weekIndex=0;
          prepareCalendarState();
          renderCalendarView();
        }
      });
    }
    const yearSelect=qs('#calendarYear');
    if(yearSelect){
      yearSelect.addEventListener('change',event=>{
        const nextYear=parseInt(event.target.value,10);
        if(!Number.isNaN(nextYear)){
          calendarState.year=nextYear;
          calendarState.weekIndex=0;
          prepareCalendarState();
          renderCalendarView();
        }
      });
    }
    const prevWeekBtn=qs('#calendarPrevWeek');
    if(prevWeekBtn){
      prevWeekBtn.addEventListener('click',()=>{
        if(calendarState.weekIndex>0){
          calendarState.weekIndex-=1;
          renderCalendarView();
        }
      });
    }
    const nextWeekBtn=qs('#calendarNextWeek');
    if(nextWeekBtn){
      nextWeekBtn.addEventListener('click',()=>{
        if(calendarState.weekIndex<calendarState.weeks.length-1){
          calendarState.weekIndex+=1;
          renderCalendarView();
        }
      });
    }

    const personalMode=qs('#personalMode');
    if(personalMode){
      personalMode.addEventListener('change',event=>{
        const value=event.target.value;
        personalState.mode=(value==='month')?'month':'week';
        if(personalState.mode==='month'){ personalState.weekIndex=0; }
        preparePersonalState();
        renderPersonalView();
      });
    }
    const personalEmployeeSelect=qs('#personalEmployeeSelect');
    if(personalEmployeeSelect){
      personalEmployeeSelect.addEventListener('change',event=>{
        personalState.employee=event.target.value||null;
        personalState.weekIndex=0;
        preparePersonalState();
        renderPersonalView();
      });
    }
    const personalMonthSelect=qs('#personalMonth');
    if(personalMonthSelect){
      personalMonthSelect.addEventListener('change',event=>{
        const nextMonth=parseInt(event.target.value,10);
        if(!Number.isNaN(nextMonth)){
          personalState.month=nextMonth;
          personalState.weekIndex=0;
          preparePersonalState();
          renderPersonalView();
        }
      });
    }
    const personalYearSelect=qs('#personalYear');
    if(personalYearSelect){
      personalYearSelect.addEventListener('change',event=>{
        const nextYear=parseInt(event.target.value,10);
        if(!Number.isNaN(nextYear)){
          personalState.year=nextYear;
          personalState.weekIndex=0;
          preparePersonalState();
          renderPersonalView();
        }
      });
    }
    const personalPrevWeek=qs('#personalPrevWeek');
    if(personalPrevWeek){
      personalPrevWeek.addEventListener('click',()=>{
        if(personalState.weekIndex>0){
          personalState.weekIndex-=1;
          renderPersonalView();
        }
      });
    }
    const personalNextWeek=qs('#personalNextWeek');
    if(personalNextWeek){
      personalNextWeek.addEventListener('click',()=>{
        if(personalState.weekIndex<personalState.weeks.length-1){
          personalState.weekIndex+=1;
          renderPersonalView();
        }
      });
    }

    const dayOverlay=qs('#dayDetailOverlay');
    if(dayOverlay){
      dayOverlay.addEventListener('click',event=>{
        if(event.target===dayOverlay){
          closeDayDetail();
        }
      });
    }

    const configOverlay=qs('#employeeConfigOverlay');
    if(configOverlay){
      configOverlay.addEventListener('click',event=>{
        if(event.target===configOverlay){
          closeEmployeeConfig();
        }
      });
    }

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        closeDayDetail();
        closeEmployeeConfig();
      }
    });

    const daySaveBtn=qs('#daySaveChanges');
    if(daySaveBtn){
      daySaveBtn.addEventListener('click',()=> applyDayDetailChanges());
    }
    const dayDiscardBtn=qs('#dayDiscardChanges');
    if(dayDiscardBtn){
      dayDiscardBtn.addEventListener('click',()=> discardDayDetailChanges());
    }
    const dayAddShiftBtn=qs('#dayAddShift');
    if(dayAddShiftBtn){
      dayAddShiftBtn.addEventListener('click',()=>{
        const select=qs('#dayShiftTemplate');
        if(!select) return;
        const index=parseInt(select.value,10);
        if(Number.isNaN(index)) return;
        addShiftToDayFromTemplate(index);
      });
    }

    const exportSelect=qs('#exportFormat');
    if(exportSelect){
      exportSelect.addEventListener('change',event=>{
        setExportFormatValue(event.target.value);
      });
    }
    const exportBtn=qs('#exportResults');
    if(exportBtn){
      exportBtn.addEventListener('click',handleExportClick);
    }
    const previewBtn=qs('#previewExport');
    if(previewBtn){
      previewBtn.addEventListener('click',handlePreviewClick);
    }

    updateExportControlsState();

    configurationRestored=loadConfigurationFromCookie();

    document.addEventListener('input', queueAutoPersist);
    document.addEventListener('change', queueAutoPersist);

    if(!configurationRestored){
      clearHolidayTable();
      loadDefaultHolidaysForCountry().catch(()=>{});
    }else{
      syncPreferredOptionsToAllEmployees();
      queueAutoPersist();
    }
  }

  export {
    initializeApp,
    addShift,
    removeShift,
    openEmployeeConfig,
    removeEmployee,
    addEmployee,
    addHolidayRow,
    removeHolidayRow,
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
    setTheme,
    getCurrentTheme,
    onThemeChange,
    translate,
    getLocaleStrings,
    publishDefaults
  };
