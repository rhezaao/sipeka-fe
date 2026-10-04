import accounts from "@/data/demo-accounts.json";
import { z } from "zod";
import { roleSchema, type Role } from "@/domain/schemas";

const accountSchema = z.object({username:z.string(),password:z.string(),role:roleSchema,name:z.string(),workerId:z.string().nullable()});
const demoAccounts = z.array(accountSchema).parse(accounts);
export type DemoSession = Omit<z.infer<typeof accountSchema>, "password">;
function publicSession(account:z.infer<typeof accountSchema>):DemoSession {
  const {password: _password,...session}=account;
  return session;
}
/** Public fixture credentials for a static prototype, not a production authentication service. */
export function authenticateDemo(username:string,password:string):DemoSession|null {
  const account=demoAccounts.find(a=>a.username===username.trim().toLowerCase()&&a.password===password);
  return account?publicSession(account):null;
}
export function restoreDemoSession(username:string):DemoSession|null {
  const account=demoAccounts.find(a=>a.username===username);
  return account?publicSession(account):null;
}
export const roleHome = (role:Role) => role==="worker"?"/pekerja/":role==="company"?"/perusahaan/":"/bpjs/";
