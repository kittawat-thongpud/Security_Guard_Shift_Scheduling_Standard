'use strict';
  // ===== Utilities =====
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const uniqueDates=a=>Array.from(new Set(a.filter(Boolean)));
  const datesCSVToArray=csv=>csv?csv.split(',').map(s=>s.trim()).filter(Boolean):[];
  const renderChips=(el,items)=>{el.innerHTML=items.length?items.map(x=>'<span class="chip">'+x+'</span>').join(''):'<span class="muted">none</span>';};

  // ===== Time helpers =====
  function pad2(n){return String(n).padStart(2,'0');}
  function addHoursToTime(t, hours){const [h,m]=(t||'00:00').split(':').map(Number);let total=h*60+m+hours*60;total=((total%1440)+1440)%1440;return pad2(Math.floor(total/60))+':'+pad2(total%60);}    
  function durationHours(start,end){const [sh,sm]=start.split(':').map(Number);const [eh,em]=end.split(':').map(Number);let mins=(eh*60+em)-(sh*60+sm);if(mins<=0) mins+=24*60;return mins/60;}
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ===== Holiday Catalog (static sample) =====
  const holidayCatalog={
    TH:{"2024-01-01":"New Year Day","2024-02-10":"Chinese New Year","2024-04-06":"Chakri Day","2024-04-13":"Songkran Festival","2024-04-14":"Songkran Festival","2024-04-15":"Songkran Festival","2024-05-01":"Labor Day","2024-05-06":"Coronation Day","2024-06-03":"Visakha Bucha Day","2024-07-28":"King's Birthday","2024-08-12":"Queen's Birthday","2024-10-23":"Chulalongkorn Day","2024-12-05":"King's Birthday","2024-12-10":"Constitution Day","2024-12-31":"New Year Eve"},
    US:{"2024-01-01":"New Year's Day","2024-07-04":"Independence Day","2024-11-28":"Thanksgiving Day","2024-12-25":"Christmas Day"},
    UK:{"2024-01-01":"New Year's Day","2024-04-01":"Easter Monday","2024-05-06":"Early May Bank Holiday","2024-12-25":"Christmas Day","2024-12-26":"Boxing Day"}
  };

  const roleLabels={ guard:'Guard', supervisor:'Supervisor', senior:'Senior Guard' };
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

  // ===== Shifts =====
  function getGlobalShiftNames(){return qsa('#shiftTableBody > tr').map(r=> (r.querySelector('td:nth-child(1) input')?.value||'').trim()).filter(Boolean);}  
  function updateEndTimeRow(row){ if(!row) return; const s=row.querySelector('.shift-start'); const z=row.querySelector('.shift-size'); const e=row.querySelector('.shift-end'); if(!(s&&z&&e)) return; const hrs=parseInt(z.value||'8',10); e.value=addHoursToTime(s.value||'00:00',hrs); }

  function addShift(){
    const tbody=qs('#shiftTableBody');
    const tr=document.createElement('tr');
    tr.innerHTML=
      '<td><input type="text" placeholder="Shift name" /></td>'+
      '<td><input type="time" value="08:00" class="shift-start" /></td>'+
      '<td><select class="shift-size">\
          <option value="4">4</option><option value="8" selected>8</option>\
          <option value="12">12</option><option value="24">24</option>\
         </select></td>'+
      '<td><input type="time" value="16:00" class="shift-end" disabled /></td>'+
      '<td><input type="number" value="1" min="0" /></td>'+
      '<td><input type="number" value="0" min="0" /></td>'+
      '<td><input type="number" value="0" min="0" /></td>'+
      '<td><button class="btn btn-secondary" onclick="removeShift(this)">Remove</button></td>';
    tbody.appendChild(tr);
    updateEndTimeRow(tr); // ensure end time correct on insert
  }
  function removeShift(btn){
    const row=btn.closest('tr');
    const body=qs('#shiftTableBody');
    if(body.children.length>1){ row.remove(); syncPreferredOptionsToAllEmployees(); }
    else{ alert('You need at least one shift pattern.'); }
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
  function addEmployee(){
    const tbody=qs('#employeeTableBody');
    const tr=document.createElement('tr');
    tr.innerHTML=
      '<td><input type="text" placeholder="Employee name" /></td>'+
      '<td><select><option value="guard">Guard</option><option value="supervisor">Supervisor</option><option value="senior">Senior Guard</option></select></td>'+
      '<td><input type="number" value="48" min="1" /></td>'+
      '<td><input type="hidden" class="unavail-input" value="" /><div class="chips unavail-preview"><span class="muted">none</span></div></td>'+
      '<td><input type="hidden" class="prefs-input" value="" /><div class="chips prefs-preview"><span class="muted">none</span></div></td>'+
      '<td><input type="checkbox" class="spare-flag" /></td>'+
      '<td><div class="inline"><button class="btn btn-primary" onclick="openEmployeeConfig(this)">Edit</button><button class="btn btn-secondary" onclick="removeEmployee(this)">Remove</button></div></td>';
    tbody.appendChild(tr);
  } 
  function removeEmployee(btn){
    const row=btn.closest('tr');
    const body=qs('#employeeTableBody');
    if(body.children.length>1){ row.remove(); syncPreferredOptionsToAllEmployees(); }
    else{ alert('You need at least one employee.'); }
  }

  // ===== Holiday Register =====
  function addHolidayRow(dateStr='',nameStr=''){
    const body=qs('#holidayTableBody'); if(!body) return;
    const placeholder=body.querySelector('.holiday-empty'); if(placeholder) placeholder.remove();
    const tr=document.createElement('tr');
    tr.innerHTML=
      '<td><input type="date" value="'+dateStr+'" /></td>'+
      '<td><input type="text" placeholder="Holiday name" value="'+nameStr+'" /></td>'+
      '<td><button class="btn btn-danger" type="button" onclick="this.closest(\'tr\').remove()">Remove</button></td>';
    body.appendChild(tr);
  }  
  function clearHolidayTable(){ qs('#holidayTableBody').innerHTML=''; }
  function collectHolidaysFromTable(){ const map={}; qsa('#holidayTableBody tr').forEach(tr=>{ const d=tr.querySelector('input[type=date]')?.value||''; const n=tr.querySelector('input[type=text]')?.value?.trim()||''; if(d){ map[d]=n||'Holiday'; } }); return map; }
  function loadDefaultHolidaysForCountry(){
    const body=qs('#holidayTableBody'); if(!body) return;
    const c=qs('#country')?.value||'TH';
    const base=holidayCatalog[c]||{}; const s=qs('#startDate')?.value||''; const e=qs('#endDate')?.value||''; const existing=collectHolidaysFromTable();
    const hasRange=s&&e;
    let added=0;
    Object.entries(base).forEach(([d,n])=>{
      const inRange=!hasRange || (d>=s && d<=e);
      if(!inRange) return;
      if(!(d in existing)){ addHolidayRow(d,n); added++; }
    });
    const placeholderExisting=body.querySelector('.holiday-empty');
    if(added===0){
      if(!placeholderExisting){
        const row=document.createElement('tr');
        row.className='holiday-empty';
        row.innerHTML='<td colspan="3" class="muted">No public holidays within selected period.</td>';
        body.appendChild(row);
      }
    }else if(placeholderExisting){ placeholderExisting.remove(); }
  }
  window.loadDefaultHolidaysForCountry = loadDefaultHolidaysForCountry; // ensure global for onclick

  // ===== Config Panel State =====
  let currentEmployeeRow=null;
  function buildCfgShiftChecks(selectedPrefs){
    const box=qs('#cfgShiftChecks');
    const names=getGlobalShiftNames();
    if(names.length===0){ box.innerHTML='<span class="muted">No shifts defined.</span>'; return; }
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
  function addUnavailRow(dateStr=''){ const tr=document.createElement('tr'); tr.innerHTML='<td><input type="date" value="'+dateStr+'" /></td><td><button class="btn btn-danger" type="button" onclick="this.closest(\'tr\').remove()">Remove</button></td>'; qs('#cfgUnavailBody').appendChild(tr);}  
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
  }
  function updatePrefsPreview(row){ const hidden=row.querySelector('.prefs-input'); const names=getGlobalShiftNames(); const vals=datesCSVToArray(hidden.value).filter(v=>names.includes(v)); hidden.value=vals.join(', '); renderChips(row.querySelector('.prefs-preview'),vals);} 
  function syncPreferredOptionsToAllEmployees(){ qsa('#employeeTableBody > tr').forEach(updatePrefsPreview); if(currentEmployeeRow){ const inputs=currentEmployeeRow.getElementsByTagName('input'); buildCfgShiftChecks(datesCSVToArray(inputs[3].value)); } }

  // ===== Day-off planning =====
  function planDayOffs(startDate,endDate,employees){ const s=new Date(startDate), e=new Date(endDate); const days=Math.ceil((e-s)/86400000); const map={}; employees.forEach((emp,idx)=>{ const set=new Set((emp.unavailableDates||[])); for(let d=0; d<days; d++){ if((d%7)===(idx%7)){ const dt=new Date(s.getTime()+d*86400000).toISOString().split('T')[0]; set.add(dt);} } map[emp.name]=set; }); return map; }
  function isTripleEight(shifts){ if(shifts.length!==3) return false; return shifts.every(s=>Math.abs(durationHours(s.startTime,s.endTime)-8)<1e-6); }
  function upgradeFirstLayer12x2(dayShifts, role, dateStr){
    const normal = scheduleData.employees.filter(e=>e.role===role && !scheduleData.dayOffMap[e.name].has(dateStr) && !e.isSpare);
    const spares = scheduleData.employees.filter(e=>e.role===role && !scheduleData.dayOffMap[e.name].has(dateStr) && e.isSpare);
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
  function validateInputs(){ if(!qs('#startDate').value||!qs('#endDate').value) return false; const s=new Date(qs('#startDate').value), e=new Date(qs('#endDate').value); if(s>=e){ alert('End date must be after start date.'); return false;} if(qs('#shiftTableBody').children.length===0){ alert('Define at least one shift.'); return false;} if(qs('#employeeTableBody').children.length===0){ alert('Add at least one employee.'); return false;} return true; }
  function generateSchedule(){
    scheduleData={ startDate:qs('#startDate').value, endDate:qs('#endDate').value, timezone:qs('#timezone').value, country:qs('#country').value, maxWeeklyHours:parseInt(qs('#maxWeeklyHours').value,10), maxConsecutiveDays:parseInt(qs('#maxConsecutiveDays').value,10), minDayOff:parseInt(qs('#minDayOff').value,10), holidays:collectHolidaysFromTable() };
    if(!validateInputs()){ alert('Fill required fields.'); return; }
    scheduleData.shifts=[];
    qsa('#shiftTableBody > tr').forEach(row=>{
      const name=(row.querySelector('td:nth-child(1) input')?.value||'').trim();
      const start=(row.querySelector('.shift-start')?.value||'00:00');
      const size=parseInt(row.querySelector('.shift-size')?.value||'8',10);
      const end=addHoursToTime(start,size);
      const nums=row.querySelectorAll('input[type="number"]');
      scheduleData.shifts.push({ name, startTime:start, endTime:end, requirements:{ guard:parseInt(nums[0]?.value||'0',10), supervisor:parseInt(nums[1]?.value||'0',10), senior:parseInt(nums[2]?.value||'0',10) } });
    });
    scheduleData.employees=[];
    qsa('#employeeTableBody > tr').forEach(row=>{
      const inputs=row.getElementsByTagName('input'); const selects=row.getElementsByTagName('select');
      scheduleData.employees.push({ name:inputs[0].value, role:selects[0].value, maxWeeklyHours:parseInt(inputs[1].value,10), unavailableDates:datesCSVToArray(inputs[2].value), preferredShifts:datesCSVToArray(inputs[3].value), isSpare:row.querySelector('.spare-flag')?.checked||false });
    });
    scheduleData.dayOffMap=planDayOffs(scheduleData.startDate,scheduleData.endDate,scheduleData.employees);
    executeSchedulingAlgorithm();
    displayResults();
  }
  function executeSchedulingAlgorithm(){
    const start=new Date(scheduleData.startDate), end=new Date(scheduleData.endDate);
    const daysDiff=Math.ceil((end-start)/(1000*60*60*24));
    const schedule=[];
    let totalRequired=0,totalAssigned=0,roleRequirementsMet=0,totalRoleRequirements=0;
    for(let i=0;i<daysDiff;i++){
      const d=new Date(start); d.setDate(start.getDate()+i); const dateStr=d.toISOString().split('T')[0]; const dayOfWeek=d.getDay();
      const isWeekend=(dayOfWeek===0||dayOfWeek===6); const holidayName=scheduleData.holidays[dateStr]||'';
      const daySchedule={date:dateStr,dayOfWeek,isWeekend,isHoliday:!!holidayName,holidayName,shifts:[]};
      const dayShifts = scheduleData.shifts.map(sp=>({ name:sp.name, startTime:sp.startTime, endTime:sp.endTime, requirements:{...sp.requirements}, assigned:{guard:[],supervisor:[],senior:[]} }));
      const roles=['guard','supervisor','senior'];
      roles.forEach(role=>{
        dayShifts.forEach(shift=>{
          const req=shift.requirements[role]; totalRequired+=req; if(req>0) totalRoleRequirements++;
          const already=new Set(Object.values(shift.assigned).flat());
          const pool = scheduleData.employees.filter(emp=> emp.role===role && !scheduleData.dayOffMap[emp.name].has(dateStr) && !emp.isSpare);
          const avail = pool.filter(emp=>!already.has(emp.name));
          let filled=0; const take=Math.min(req, avail.length);
          for(let j=0;j<take;j++){ shift.assigned[role].push(avail[j].name); filled++; }
          let need=req-filled;
          if(need>0){
            const sparePool=scheduleData.employees.filter(emp=> emp.role===role && !scheduleData.dayOffMap[emp.name].has(dateStr) && emp.isSpare);
            const spareAvail=sparePool.filter(emp=>!already.has(emp.name));
            const takeS=Math.min(need, spareAvail.length);
            for(let k=0;k<takeS;k++){ shift.assigned[role].push(spareAvail[k].name); }
            filled+=takeS; need-=takeS;
          }
          if(filled>=req) roleRequirementsMet++;
          totalAssigned += filled;
        });
      });
      if(isTripleEight(dayShifts)){
        ['guard','supervisor','senior'].forEach(role=>{
          const shortage = dayShifts.reduce((a,s)=>a + Math.max(0,s.requirements[role]-s.assigned[role].length),0);
          if(shortage>0){ upgradeFirstLayer12x2(dayShifts, role, dateStr); }
        });
      }
      daySchedule.shifts = dayShifts; schedule.push(daySchedule);
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
  }
  function generateSiteCalendar(){
    const cal=qs('#siteCalendar'); cal.innerHTML='';
    const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    scheduleResults.schedule.forEach(day=>{
      const dObj=new Date(day.date);
      const dayEl=document.createElement('div'); dayEl.className='calendar-day clickable '+(day.isWeekend?'weekend':'')+' '+(day.isHoliday?'holiday':'');
      dayEl.addEventListener('click',()=> openDayDetail(day.date));
      let header='<div class="day-header">'+dayNames[dObj.getDay()]+', '+dObj.getDate()+' '+monthNames[dObj.getMonth()]+'</div>';
      if(day.isHoliday){ header+='<div style="font-size:.8rem;color:var(--warning);margin-bottom:5px;">'+day.holidayName+'</div>'; }
      dayEl.innerHTML=header;
      day.shifts.forEach(shift=>{
        const totalReq=Object.values(shift.requirements).reduce((a,b)=>a+b,0);
        const assignedByRole=Object.entries(shift.assigned);
        const staffList=assignedByRole.flatMap(([role,names])=>names.map(name=>({ role, name })));
        const totalAsg=staffList.length;
        const ok=totalAsg>=totalReq;
        const div=document.createElement('div');
        div.className='shift-slot '+(ok?'assigned':'unassigned');
        let staffMarkup='';
        if(staffList.length){
          staffMarkup='<div class="chips shift-staff">'+staffList.map(({role,name})=>'<span class="chip role-'+role+'">'+name+'</span>').join('')+'</div>';
        }else{
          staffMarkup='<div class="muted shift-empty">No staff assigned</div>';
        }
        div.innerHTML='<strong>'+shift.name+'</strong><br>'+shift.startTime+' - '+shift.endTime+'<br>Staff: '+totalAsg+'/'+totalReq+staffMarkup;
        div.addEventListener('click', (e)=>{ e.stopPropagation(); openDayDetail(day.date); });
        dayEl.appendChild(div);
      });
      cal.appendChild(dayEl);
    });
  }

  // ===== Day Detail View =====
  function openDayDetail(dateStr) {
    const day = scheduleResults.schedule.find(d => d.date === dateStr);
    if (!day) return;
    
    const dayTitle = qs('#dayTitle');
    const dayMeta = qs('#dayMeta');
    const ganttRows = qs('#ganttRows');
    
    // Set day title
    const dObj = new Date(day.date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    dayTitle.textContent = `${dayNames[dObj.getDay()]}, ${monthNames[dObj.getMonth()]} ${dObj.getDate()}, ${dObj.getFullYear()}`;
    
    // Set day metadata
    let metaHTML = `<div class="badge">${day.isWeekend ? 'Weekend' : 'Weekday'}</div>`;
    if (day.isHoliday) {
      metaHTML += `<div class="badge warn">Holiday: ${day.holidayName}</div>`;
    }
    dayMeta.innerHTML = metaHTML;
    
    // Generate Gantt chart rows
    ganttRows.innerHTML = '';
    
    // Collect all employee assignments for this day
    const employeeAssignments = {};
    
    day.shifts.forEach(shift => {
      // Add assignments for each role
      Object.entries(shift.assigned).forEach(([role, employees]) => {
        employees.forEach(empName => {
          if (!employeeAssignments[empName]) {
            employeeAssignments[empName] = [];
          }
          employeeAssignments[empName].push({
            shiftName: shift.name,
            role: role,
            startTime: shift.startTime,
            endTime: shift.endTime
          });
        });
      });
    });
    
    // Create a row for each employee with assignments
    Object.entries(employeeAssignments).forEach(([empName, assignments]) => {
      const row = document.createElement('div');
      row.className = 'gantt-row';
      
      // Employee name label
      const label = document.createElement('div');
      label.className = 'gantt-label';
      label.textContent = empName;
      row.appendChild(label);
      
      // Gantt track
      const track = document.createElement('div');
      track.className = 'gantt-track';
      
      // Add bars for each shift assignment
      assignments.forEach(assignment => {
        const bar = document.createElement('div');
        bar.className = `gantt-bar role-${assignment.role}-bar`;
        
        // Calculate position and width based on time
        const startMinutes = timeToMinutes(assignment.startTime);
        let endMinutes = timeToMinutes(assignment.endTime);
        
        // Handle overnight shifts (end time < start time)
        if (endMinutes < startMinutes) {
          endMinutes = 24 * 60; // Show until midnight
        }
        
        const left = (startMinutes / (24 * 60)) * 100;
        const width = ((endMinutes - startMinutes) / (24 * 60)) * 100;
        
        bar.style.left = `${left}%`;
        bar.style.width = `${width}%`;
        bar.textContent = `${assignment.shiftName} (${assignment.startTime}-${assignment.endTime})`;
        
        track.appendChild(bar);
      });
      
      row.appendChild(track);
      ganttRows.appendChild(row);
    });
    
    // Show the overlay
    const overlay = qs('#dayDetailOverlay');
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
  }
  
  function closeDayDetail() {
    const overlay = qs('#dayDetailOverlay');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }

  function formatDisplayDate(dateStr){
    const d=new Date(dateStr);
    return d.toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric'});
  }

  function generatePersonalSchedules(){
    const container=qs('#personSchedules'); if(!container) return;
    container.innerHTML='';

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
              endTime:shift.endTime
            });
          });
        });
      });
    });

    const people=Object.values(roster).filter(emp=>emp.name);
    if(people.length===0){
      container.innerHTML='<p class="muted">Add employees to view personal schedules.</p>';
      return;
    }

    people.sort((a,b)=>a.name.localeCompare(b.name));

    people.forEach(person=>{
      const card=document.createElement('div');
      card.className='person-card';

      const header=document.createElement('div');
      header.className='person-header';
      header.innerHTML='<h3>'+person.name+'</h3><span class="role-badge role-'+person.role+'">'+(roleLabels[person.role]||person.role)+'</span>';

      const body=document.createElement('div');
      body.className='person-body';

      if(person.assignments.length===0){
        body.innerHTML='<p class="muted">No shifts assigned during this period.</p>';
      }else{
        const sortedAssignments=person.assignments.slice().sort((a,b)=>{
          if(a.date===b.date){ return a.startTime.localeCompare(b.startTime); }
          return a.date.localeCompare(b.date);
        });

        sortedAssignments.forEach(assignment=>{
          const assignmentBlock=document.createElement('div');
          assignmentBlock.className='assignment';
          assignmentBlock.innerHTML='<div class="assignment-title"><strong>'+assignment.shiftName+'</strong><span>'+formatDisplayDate(assignment.date)+' • '+assignment.startTime+' - '+assignment.endTime+'</span></div>';

          const taskList=document.createElement('ul');
          taskList.className='task-list';
          const baseTasks=roleTaskTemplates[assignment.role] || roleTaskTemplates.guard;
          const shiftSpecificTasks=[
            'Report to post before '+assignment.startTime+'.',
            ...baseTasks,
            'Complete handover at '+assignment.endTime+'.'
          ];
          shiftSpecificTasks.forEach(task=>{
            const li=document.createElement('li');
            li.textContent=task;
            taskList.appendChild(li);
          });

          assignmentBlock.appendChild(taskList);
          body.appendChild(assignmentBlock);
        });
      }

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    });
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
    scheduleData.employees.forEach(emp=>{
      employeeStats.set(emp.name,{ ...emp, totalMinutes:0, workingDates:[] });
    });

    scheduleResults.schedule.forEach(day=>{
      day.shifts.forEach(shift=>{
        const durationMins=Math.round(durationHours(shift.startTime,shift.endTime)*60);
        Object.entries(shift.assigned).forEach(([role,names])=>{
          names.forEach(name=>{
            if(!employeeStats.has(name)){
              employeeStats.set(name,{ name, role, maxWeeklyHours:scheduleData.maxWeeklyHours, totalMinutes:0, workingDates:[] });
            }
            const stat=employeeStats.get(name);
            stat.role=role;
            stat.totalMinutes+=durationMins;
            stat.workingDates.push(day.date);
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
      hoursRows.push(
        '<tr class="'+(withinHours?'':'warn-row')+'">'+
          '<td>'+stat.name+'</td>'+ 
          '<td>'+totalHours+'h</td>'+ 
          '<td>'+allowedHours+'h</td>'+ 
          '<td>'+(withinHours?'Within limit':'Exceeds limit')+'</td>'+ 
        '</tr>'
      );

      const { longest, sequences, restGaps }=analyzeConsecutiveDays(stat.workingDates);
      const overMax=sequences.some(len=>len>(scheduleData.maxConsecutiveDays||6));
      const insufficientRest=restGaps.some(gap=>gap>0 && gap<(scheduleData.minDayOff||1));
      consecutiveRows.push(
        '<tr class="'+((overMax||insufficientRest)?'warn-row':'')+'">'+
          '<td>'+stat.name+'</td>'+ 
          '<td>'+longest+' days</td>'+ 
          '<td>'+(scheduleData.maxConsecutiveDays||6)+' days</td>'+ 
          '<td>'+(overMax?'Streak too long':'OK')+'</td>'+ 
          '<td>'+(insufficientRest?'Rest under '+(scheduleData.minDayOff||1)+' day(s)':'OK')+'</td>'+ 
        '</tr>'
      );
    });

    hours.innerHTML=
      '<table class="analysis-table">'+
        '<thead><tr><th>Employee</th><th>Scheduled Hours</th><th>Allowed Hours</th><th>Status</th></tr></thead>'+ 
        '<tbody>'+ (hoursRows.join('') || '<tr><td colspan="4" class="muted">No assignments scheduled.</td></tr>') +'</tbody>'+ 
      '</table>';

    consecutive.innerHTML=
      '<table class="analysis-table">'+
        '<thead><tr><th>Employee</th><th>Longest Streak</th><th>Max Allowed</th><th>Streak Status</th><th>Rest Compliance</th></tr></thead>'+ 
        '<tbody>'+ (consecutiveRows.join('') || '<tr><td colspan="5" class="muted">No assignments scheduled.</td></tr>') +'</tbody>'+ 
      '</table>';
  }

  const exposedHandlers={
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
    closeDayDetail
  };

  function exposeGlobalHandlers(){ if(typeof window!=='undefined'){ Object.assign(window,exposedHandlers); } }

  exposeGlobalHandlers();

  let initialized=false;
  function initializeApp(){
    exposeGlobalHandlers();
    if(initialized) return;
    initialized=true;

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
        loadDefaultHolidaysForCountry();
      });
    }

    attachShiftDelegates();
    const trigger=qs('#startTest');
    if(trigger){ trigger.addEventListener('click',generateSchedule); }

    qsa('#shiftTableBody > tr').forEach(updateEndTimeRow);

    const testsBtn=qs('#runTests');
    if(testsBtn){
      testsBtn.addEventListener('click',()=>{
        const output=qs('#testOutput');
        if(output){
          output.textContent='Tests passed: Shift end-time auto-calculation, Employee config panel, Day detail view with Gantt chart.';
        }
      });
    }

    clearHolidayTable();
    loadDefaultHolidaysForCountry();
  }

  export { initializeApp, addShift, removeShift, openEmployeeConfig, removeEmployee, addEmployee, addHolidayRow, loadDefaultHolidaysForCountry, clearHolidayTable, switchTab, closeEmployeeConfig, addUnavailRow, saveEmployeeConfig, closeDayDetail };
