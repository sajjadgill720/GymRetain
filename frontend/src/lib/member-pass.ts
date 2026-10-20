/** Parse scanner input without trusting it. The backend verifies the signature twice. */
export function scannedMemberPass(value:string):string|null {
 if(value.startsWith('grm.'))return value;
 if(value.startsWith('{')) {try{const parsed=JSON.parse(value);if(parsed.type==='MEMBER_PASS'&&typeof parsed.token==='string')return parsed.token;}catch{ /* Let the server reject other malformed identifiers. */ }}
 return null;
}
