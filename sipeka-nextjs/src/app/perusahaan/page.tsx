import { Suspense } from "react";
import { Workspace } from "@/components/workspace";
export default function Page(){return <Suspense fallback={<p>Memuat simulasi…</p>}><Workspace role="company" view="home"/></Suspense>;}
