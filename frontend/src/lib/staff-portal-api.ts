export async function staffPortalRequest<T>(path:string,options:RequestInit={}):Promise<T> {
 const token=localStorage.getItem('gymretain_token');if(!token)throw new Error('Sign in to your gym workspace to use the member inbox.');
 const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000/api/v1'}${path}`,{...options,cache:'no-store',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...options.headers}});
 const result=await response.json();if(!response.ok)throw new Error(Array.isArray(result.message)?result.message.join('. '):result.message||'Could not complete this action');return result.data??result;
}
