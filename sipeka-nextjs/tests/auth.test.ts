import { test } from "node:test";
import assert from "node:assert/strict";
import { authenticateDemo, restoreDemoSession, roleHome } from "../src/services/demo-auth";

test("static accounts resolve to their designated role without exposing passwords in session",()=>{
  for(const [username,password,role,path] of [["pekerja","Pekerja123!","worker","/pekerja/"],["perusahaan","Perusahaan123!","company","/perusahaan/"],["petugas","Petugas123!","bpjs","/bpjs/"]]){
    const session=authenticateDemo(username,password);assert(session);assert.equal(session.role,role);assert.equal(roleHome(session.role),path);assert.equal("password" in session,false);assert.deepEqual(restoreDemoSession(username),session);
  }
});
test("incorrect credentials and unknown restored identities are rejected",()=>{
  assert.equal(authenticateDemo("pekerja","Perusahaan123!"),null);assert.equal(authenticateDemo("unknown","Pekerja123!"),null);assert.equal(authenticateDemo("pekerja",""),null);assert.equal(restoreDemoSession("unknown"),null);assert.equal(authenticateDemo(" PEKERJA ","Pekerja123!")?.role,"worker");
});
