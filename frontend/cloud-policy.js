// Shared by the browser demo and server. All published content remains plain text.
export const CLOUD_TEXT_LIMIT=160;
const links=/(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|io|gg|me|co|edu|gov)\b)/i;
export function cloudTextError(value){
 if(typeof value!=='string'||!value.trim())return 'Write a thought before releasing a copy.';
 if(links.test(value))return 'Links cannot drift into the clouds.';
 if(Array.from(value.trim()).length>CLOUD_TEXT_LIMIT)return 'Cloud copies need 160 characters or fewer.';
 return '';
}
export function validateCloudText(value){const error=cloudTextError(value);if(error)throw new Error(error);return value.trim()}
