import { firstValueFrom } from 'rxjs';
import { PortalEventsService } from '../src/modules/member/portal-events.service';
import { StaffPortalController } from '../src/modules/member/staff-portal.controller';
const gymId='11111111-1111-1111-1111-111111111111';
describe('Member staff synchronization',()=>{
 it('starts at the current event cursor without serializing BigInt into JSON',async()=>{
  const findMany=jest.fn(async()=>[{id:42n,kind:'workout_logs'}]);const run=(_identity,fn)=>fn({portalEvent:{findMany}});const service=new PortalEventsService({run} as any,{runWithTenantRLS:run} as any);
  const event=await firstValueFrom(service.stream({gymId}));expect(event.id).toBe('42');expect((event.data as any).changed).toBe(false);expect(()=>JSON.stringify(event)).not.toThrow();
 });
 it('replays changes after a reconnect cursor within the verified gym',async()=>{
  const findMany=jest.fn(async()=>[{id:43n,kind:'diet_plans'}]);const run=(_identity,fn)=>fn({portalEvent:{findMany}});const service=new PortalEventsService({run} as any,{runWithTenantRLS:run} as any);
  const event=await firstValueFrom(service.stream({gymId},'42'));expect((event.data as any).changed).toBe(true);expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:{gymId,id:{gt:42n}}}));
 });
 it('rejects a trainer attempting to message a member assigned to another trainer',async()=>{
  const create=jest.fn();const tx={member:{findFirst:async()=>({id:'member'})},trainerAssignment:{findFirst:async()=>({trainerId:'other',trainer:{staffId:'another-staff'}})},trainerMessage:{create}};
  const controller=new StaffPortalController({runWithTenantRLS:(_gym,fn)=>fn(tx)} as any,{} as any,{} as any);
  await expect(controller.message(gymId,'member',{user:{role:'TRAINER',sub:'trainer-staff'}},{content:'hello'})).rejects.toThrow('not assigned to you');expect(create).not.toHaveBeenCalled();
 });
});
