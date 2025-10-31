export const DEFAULT_CONFIG_TEMPLATE={
  meta:{
    startDate:null,
    endDate:null,
    timezone:'Asia/Bangkok',
    country:'TH',
    maxWeeklyHours:48,
    maxConsecutiveDays:6,
    minDayOff:1,
    maxContinuousHours:12,
    language:'th',
    theme:'light'
  },
  shifts:[
    { name:'Morning', startTime:'06:00', size:8, requirements:{ guard:3, supervisor:1, senior:0 } },
    { name:'Afternoon', startTime:'14:00', size:8, requirements:{ guard:2, supervisor:0, senior:1 } },
    { name:'Night', startTime:'22:00', size:8, requirements:{ guard:2, supervisor:1, senior:0 } }
  ],
  employees:[
    { name:'นรินทร์ ป้อมปราการ', role:'supervisor', maxWeeklyHours:48, preferredShifts:['Morning'], isSpare:false },
    { name:'สุรีย์พร วัฒนะ', role:'guard', maxWeeklyHours:40, preferredShifts:['Afternoon'], isSpare:false },
    { name:'ชัชพงศ์ อินทร์ทอง', role:'guard', maxWeeklyHours:44, preferredShifts:['Night'], isSpare:false },
    { name:'วิภา จิตติ', role:'senior', maxWeeklyHours:42, preferredShifts:['Morning'], isSpare:false },
    { name:'อดิเทพ รัตนกุล', role:'guard', maxWeeklyHours:36, preferredShifts:['Afternoon'], isSpare:true }
  ],
  holidays:[]
};
