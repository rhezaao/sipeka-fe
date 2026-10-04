"use client";
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import type { Dataset } from "@/domain/schemas";
import type { SipekaRepository } from "@/services/contracts";
import { createRepository } from "@/services";

type Demo = {data:Dataset|null; workerId:string;setWorkerId:(id:string)=>void;period:string;setPeriod:(p:string)=>void;pending:boolean;error:string;message:string;run:<T>(action:(repo:SipekaRepository)=>Promise<T>,message?:string)=>Promise<T|undefined>;reset:()=>void};
const Context = createContext<Demo|null>(null);
export function DemoProvider({children}:{children:ReactNode}) {
  const repo = useRef<SipekaRepository|null>(null);
  const [data,setData] = useState<Dataset|null>(null);
  const [workerId,setWorkerId] = useState("PK-001"); const [period,setPeriod] = useState("2026-09");
  const [pending,setPending] = useState(false); const [error,setError] = useState(""); const [message,setMessage] = useState("");
  const busy = useRef(false);
  async function refresh(repository:SipekaRepository) {
    const [metadata,companies,workers,checks,tickets,employmentChanges] = await Promise.all([repository.getMetadata(),repository.listCompanies(),repository.listWorkers(),repository.listChecks(),repository.listTickets(),repository.listEmploymentChanges()]);
    setData({metadata,companies,workers,checks,tickets,employmentChanges});
  }
  useEffect(()=>{const repository=createRepository();repo.current=repository;refresh(repository).catch(e=>setError(e instanceof Error?e.message:"Gagal membaca data"));},[]);
  async function run<T>(action:(r:SipekaRepository)=>Promise<T>,notice="Perubahan simulasi tersimpan selama sesi ini."):Promise<T|undefined> {
    if(busy.current||!repo.current)return; busy.current=true;setPending(true);setError("");
    try {const result=await action(repo.current);await refresh(repo.current);setMessage(notice);return result;}
    catch(e){setError(e instanceof Error?e.message:"Aksi gagal");return undefined;}
    finally{busy.current=false;setPending(false);}
  }
  function reset(){if(busy.current)return;repo.current=createRepository();setWorkerId("PK-001");setPeriod("2026-09");setError("");setMessage("Data kembali ke placeholder JSON awal.");refresh(repo.current).catch(e=>setError(String(e)));}
  return <Context.Provider value={{data,workerId,setWorkerId,period,setPeriod,pending,error,message,run,reset}}>{children}</Context.Provider>;
}
export function useDemo(){const context=useContext(Context);if(!context)throw new Error("DemoProvider required");return context;}
