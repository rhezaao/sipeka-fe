import { writeFileSync } from "node:fs";
import { z } from "zod";
import * as s from "../src/domain/schemas";

const definitions = {Metadata:s.metadataSchema,Company:s.companySchema,Worker:s.workerSchema,MonthlyCheck:s.checkSchema,Ticket:s.ticketSchema,EmploymentChange:s.employmentChangeSchema,CreateTicketInput:s.createTicketSchema,ClarificationInput:s.clarificationInputSchema,ResolutionInput:s.resolutionInputSchema,InformationInput:s.informationInputSchema,RequestInput:s.requestInputSchema,EmploymentInput:s.employmentInputSchema,ContinueInput:z.object({note:z.string().min(1).max(2000)})};
const schemas:Record<string,unknown>=Object.fromEntries(Object.entries(definitions).map(([name,schema])=>{const {$schema,...json}=z.toJSONSchema(schema,{io:"input",unrepresentable:"any"});return [name,json];}));
const ref=(name:string)=>({$ref:`#/components/schemas/${name}`});
const paths:Record<string,unknown>={};
function endpoint(path:string,method:string,result:string,input?:string,list=false,filters:string[]=[]){
 const parameters=[...(path.includes("{id}")?[{name:"id",in:"path",required:true,schema:{type:"string"}}]:[]),...filters.map(name=>({name,in:"query",required:false,schema:{type:name==="hasEvidence"?"boolean":"string"}})),...(method==="post"&&path==="/tickets"?[{name:"Idempotency-Key",in:"header",required:true,schema:{type:"string"}}]:[])];
 const operation={operationId:`${method}_${path.replace(/[^a-z]/gi,"_")}`,parameters,...(method==="post"?{requestBody:{required:true,content:{"application/json":{schema:input?ref(input):{type:"object",additionalProperties:false}}}}}:{}),responses:{"200":{description:"Successful response",content:{"application/json":{schema:{type:"object",required:["data"],properties:{data:list?{type:"array",items:ref(result)}:ref(result),meta:{type:"object",additionalProperties:true}}}}}},default:{description:"Error",content:{"application/json":{schema:ref("ErrorEnvelope")}}}}};
 paths[path]={...(paths[path]??{}),[method]:operation};
}
endpoint("/metadata","get","Metadata");endpoint("/companies","get","Company",undefined,true);
endpoint("/workers","get","Worker",undefined,true,["companyId"]);
endpoint("/checks","get","MonthlyCheck",undefined,true,["workerId","companyId","period"]);
endpoint("/tickets","get","Ticket",undefined,true,["workerId","companyId","period","status","issueType","hasEvidence"]);
endpoint("/employment-changes","get","EmploymentChange",undefined,true,["workerId","companyId"]);
endpoint("/tickets","post","Ticket","CreateTicketInput");endpoint("/tickets/{id}/review","post","Ticket");
for(const [path,input] of [["requests","RequestInput"],["clarification","ClarificationInput"],["information","InformationInput"],["continue","ContinueInput"],["resolution","ResolutionInput"]])endpoint(`/tickets/{id}/${path}`,"post","Ticket",input);
endpoint("/employment-changes","post","EmploymentChange","EmploymentInput");
schemas.ErrorEnvelope={type:"object",required:["error"],properties:{error:{type:"object",required:["code","message"],properties:{code:{type:"string"},message:{type:"string"},details:{}}}}};
const document={openapi:"3.1.0",info:{title:"SIPEKA Placeholder API",version:"1.0.0",description:"Contract for a future user-owned backend. No real BPJS integration. Cross-field validations and permissions are documented in backend-integration.md."},servers:[{url:"https://backend.example/v1",description:"Placeholder only"}],paths,components:{schemas,securitySchemes:{bearerAuth:{type:"http",scheme:"bearer"}}},security:[{bearerAuth:[]}]};
writeFileSync("docs/openapi.json",JSON.stringify(document,null,2)+"\n");
