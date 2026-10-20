import { PortalData } from './member-api';
/** Explicitly opt-in, read-only product preview. Never used as an API error fallback. */
export function memberPreview():PortalData {
 const now=new Date();const date=now.toISOString().slice(0,10);const later=new Date(now.getTime()+86400000).toISOString();
 const reward={id:'sample-reward',title:'The consistent one',description:'Make movement part of your week.',rewardType:'BADGE',triggerType:'STREAK_MILESTONE',triggerThreshold:7,pointsCost:0};
 return {
 member:{id:'preview',firstName:'Ayesha',lastName:'Khan',memberCode:'IH-1024',phone:'+92 300 1234567',status:'ACTIVE'},gym:{name:'Iron House Gym',timezone:'Asia/Karachi',capacity:100,insideNow:32},
 profile:{goal:'Build strength, one week at a time',weeklyTarget:4,onboarded:true,notifications:true,mealChecklist:{}},streak:{currentStreak:7,longestStreak:12,streakFreezeAvailable:1},weeklyVisits:3,totalVisits:42,points:420,today:date,
 attendanceWeeks:[2,3,2,4,3,4,4,3].map((visits,i)=>({label:`Week ${i+1}`,visits})),
 membership:{id:'preview',planName:'Monthly Gold',planType:'MONTHLY',status:'ACTIVE',price:500000,currency:'PKR',endDate:new Date(now.getTime()+18*86400000).toISOString()},
 rewards:[{id:'preview',rewardId:reward.id,status:'UNLOCKED',reward}],rewardRules:[reward,{...reward,id:'sample-2',title:'The 50-visit club',triggerType:'TOTAL_CHECKINS',triggerThreshold:50,pointsCost:100}],
 classes:[{id:'sample-class',title:'Strength & conditioning',coach:'Coach Sara',startsAt:later,duration:50,capacity:16,spotsLeft:4,booking:'BOOKED'},{id:'sample-class-2',title:'Mobility & reset',coach:'Coach Usman',startsAt:new Date(now.getTime()+2*86400000).toISOString(),duration:45,capacity:12,spotsLeft:8,booking:null}],bookings:[],
 diet:{id:'sample-diet',title:'Fuel your strength',goal:'MUSCLE_GAIN',notes:'Keep it simple. Stay hydrated throughout the day.',meals:[{id:'meal1',mealType:'BREAKFAST',description:'Oats, milk, banana and two eggs',calories:520,proteinG:28,carbsG:62,fatG:18},{id:'meal2',mealType:'LUNCH',description:'Grilled chicken, rice and seasonal vegetables',calories:650,proteinG:45,carbsG:70,fatG:20},{id:'meal3',mealType:'DINNER',description:'Daal, whole-wheat roti and fresh salad',calories:560,proteinG:25,carbsG:75,fatG:15}]},
 workouts:[{id:'sample-workout',title:'Upper body strength',minutes:45,notes:'Felt stronger on the final set.',loggedAt:now.toISOString()}],records:[{id:'sample-record',exercise:'Deadlift',weightKg:80,reps:5,loggedAt:now.toISOString()}],measurements:[{id:'sample-measurement',weightKg:64,waistCm:73,loggedAt:now.toISOString()}],requests:[],
 announcements:[{id:'sample-notice',title:'A little more room to move',body:'Our new mobility area is open. Ask your coach for a quick introduction.',createdAt:now.toISOString()}],trainer:{id:'sample-trainer',name:'Sara Ahmed',specialties:['Strength','Mobility'],bio:'Small steps. Strong foundations.'},payments:[{id:'sample-payment',amount:500000,currency:'PKR',status:'COMPLETED',provider:'JAZZCASH',createdAt:now.toISOString(),providerReference:'PREVIEW-INVOICE'}],onlinePaymentsAvailable:false,
 };
}
