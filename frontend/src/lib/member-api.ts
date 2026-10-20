export const MEMBER_TOKEN_KEY='gymretain_member_token';
const base=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api/v1';
let personalHandler:((path:string,options?:RequestInit)=>Promise<unknown>)|null=null;
export function setPersonalMemberHandler(handler:typeof personalHandler) {personalHandler=handler;}
export async function memberRequest<T>(path:string,options:RequestInit={}):Promise<T> {
  if(personalHandler&&path.startsWith('/member/'))return personalHandler(path,options) as Promise<T>;
  const token=typeof window!=='undefined'?localStorage.getItem(MEMBER_TOKEN_KEY):null;
  const response=await fetch(`${base}${path}`,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...options.headers}});
  const body=await response.json().catch(()=>({message:'Could not read the response'}));
  if(!response.ok) {
    if(response.status===401&&token) {localStorage.removeItem(MEMBER_TOKEN_KEY);window.dispatchEvent(new Event('member-session-ended'));}
    throw new Error(Array.isArray(body.message)?body.message.join('. '):body.message||'Request failed. Please try again.');
  }
  return body.data??body;
}
export const memberPost=<T>(path:string,data?:unknown)=>memberRequest<T>(path,{method:'POST',body:JSON.stringify(data||{})});
export interface PortalData {
 member:{id:string;firstName:string;lastName:string;memberCode:string;phone:string;email?:string;status:string};
 gym:{name:string;timezone:string;capacity:number;insideNow:number};
 profile:{goal:string;weeklyTarget:number;onboarded:boolean;notifications:boolean;mealChecklist:{date?:string;checked?:Record<string,boolean>}};
 streak:{currentStreak:number;longestStreak:number;streakFreezeAvailable:number}|null;
 weeklyVisits:number;totalVisits:number;points:number;today:string;
 attendanceWeeks:{label:string;visits:number}[];
 membership:{id:string;planName:string;planType:string;status:string;price:number;currency:string;endDate:string}|null;
 rewards:{id:string;rewardId:string;status:string;reward:PortalReward}[];rewardRules:PortalReward[];
 classes:{id:string;title:string;coach:string;startsAt:string;duration:number;capacity:number;spotsLeft:number;booking:string|null}[];
 bookings:{sessionId:string;status:string}[];
 diet:{id:string;title:string;goal:string;notes:string|null;meals:PortalMeal[]}|null;
 workouts:{id:string;title:string;minutes:number;notes?:string;loggedAt:string}[];
 records:{id:string;exercise:string;weightKg:number;reps:number;loggedAt:string}[];
 measurements:{id:string;weightKg:number;waistCm?:number;loggedAt:string}[];
 requests:{id:string;kind:string;message:string;status:string;createdAt:string}[];
 announcements:{id:string;title:string;body:string;createdAt:string}[];
 trainer:{id:string;name:string;specialties:string[];bio?:string}|null;
 payments:{id:string;amount:number;currency:string;status:string;provider:string;createdAt:string;providerReference?:string}[];
 onlinePaymentsAvailable?:boolean;
}
export interface PortalReward {id:string;title:string;description?:string;rewardType:string;triggerType:string;triggerThreshold:number;pointsCost:number;}
export interface PortalMeal {id:string;mealType:string;description:string;calories:number|null;proteinG:number|null;carbsG:number|null;fatG:number|null;}
export interface TrainerMessage {id:string;sender:'MEMBER'|'TRAINER';content:string;createdAt:string;}
export const portalMoney=(amount:number,currency='PKR')=>new Intl.NumberFormat('en-PK',{style:'currency',currency,maximumFractionDigits:2}).format(amount/100);
