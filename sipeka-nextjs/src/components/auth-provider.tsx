"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authenticateDemo, restoreDemoSession, roleHome, type DemoSession } from "@/services/demo-auth";
import type { Role } from "@/domain/schemas";
import { Icon } from "./ui";

type Auth = {session:DemoSession|null;ready:boolean;login:(username:string,password:string)=>DemoSession|null;logout:()=>void};
const Context=createContext<Auth|null>(null);
const sessionKey="sipeka.demo.username.v1";
export function AuthProvider({children}:{children:ReactNode}) {
  const [session,setSession]=useState<DemoSession|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{try{const username=sessionStorage.getItem(sessionKey);if(username)setSession(restoreDemoSession(username));}catch{/* In-memory login remains available when storage is disabled. */}setReady(true);},[]);
  function login(username:string,password:string){const next=authenticateDemo(username,password);if(next){setSession(next);try{sessionStorage.setItem(sessionKey,next.username);}catch{}}return next;}
  function logout(){setSession(null);try{sessionStorage.removeItem(sessionKey);}catch{}}
  return <Context.Provider value={{session,ready,login,logout}}>{children}</Context.Provider>;
}
export function useAuth(){const auth=useContext(Context);if(!auth)throw new Error("AuthProvider required");return auth;}
export function AuthGate({role,children}:{role:Role;children:ReactNode}) {
  const {session,ready}=useAuth();const router=useRouter();
  useEffect(()=>{if(!ready)return;if(!session)router.replace("/login/");else if(session.role!==role)router.replace(roleHome(session.role));},[ready,session,role,router]);
  if(!ready||!session||session.role!==role)return <main className="loading-view"><Icon name="lock"/><p role="status">Menyiapkan halaman akun…</p></main>;
  return children;
}
