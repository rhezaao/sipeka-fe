"use client";
import { useEffect, useRef, type ReactNode } from "react";

const paths:Record<string,string> = {
  shield:"M12 3 3 7v6c0 5 9 8 9 8s9-3 9-8V7l-9-4Z M8 12l3 3 5-6",
  home:"m3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8", history:"M3 11a9 9 0 1 1 2 7 M3 3v8h8 M12 7v5l3 2",
  ticket:"M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Z M15 5v14",
  user:"M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-3a8 8 0 0 1 16 0v3",
  building:"M4 21V3h12v18 M16 9h4v12 M8 7h4 M8 11h4 M8 15h4 M2 21h20",
  check:"m5 12 4 4L19 6", alert:"m12 3 10 18H2L12 3Z M12 9v5 M12 17v1",
  clock:"M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
  file:"M14 2H5v20h14V7l-5-5Z M14 2v5h5 M8 12h8 M8 16h8",
  arrow:"M5 12h14 m-5-5 5 5-5 5", lock:"M5 10h14v11H5V10 M8 10V6a4 4 0 0 1 8 0v4",
  search:"M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 m-2 5 6 6",
  info:"M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 10v7 M12 6v1",
  chart:"M4 3v18h17 M8 16v-5 M13 16V7 M18 16v-9", close:"m6 6 12 12 M6 18 18 6",
};
export function Icon({name="shield"}:{name?:string}){return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]??paths.info}/></svg>;}
export function Badge({children,tone="gray"}:{children:ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>;}
export function Notice({children,tone="",title}:{children:ReactNode;tone?:string;title?:string}){return <div className={`notice ${tone}`}><Icon name={tone==="warn"?"alert":"info"}/><div>{title&&<strong>{title}</strong>}<div>{children}</div></div></div>;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);return <dialog className="react-dialog" ref={ref} onCancel={onClose}><div className="card-header"><h2>{title}</h2><button className="icon-button" aria-label="Tutup dialog" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;}
