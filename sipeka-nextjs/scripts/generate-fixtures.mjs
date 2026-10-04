// Authoring helper only. The application imports the generated JSON, not this script.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../src/data/', import.meta.url));
mkdirSync(dir, { recursive: true });
const companyId = 'CO-001';
const updatedAt = '2026-10-03T09:30:00+07:00';
const workers = [
  { id:'PK-001', name:'Dimas Pratama', initials:'DP', companyId, employmentStartDate:'2025-01-12', membershipStatus:'ACTIVE', scenario:'real' },
  { id:'PK-002', name:'Nadia Larasati', initials:'NL', companyId, employmentStartDate:'2025-02-03', membershipStatus:'ACTIVE', scenario:'normal' },
  { id:'PK-003', name:'Arif Wicaksana', initials:'AW', companyId, employmentStartDate:'2025-04-07', membershipStatus:'ACTIVE', scenario:'delay' },
  { id:'PK-004', name:'Sinta Maharani', initials:'SM', companyId, employmentStartDate:'2026-10-01', membershipStatus:'UNKNOWN', scenario:'missing' },
];
const periods = ['2026-10','2026-09','2026-08','2026-07','2026-06'];
const wages = { 'PK-001':5200000, 'PK-002':6400000, 'PK-003':4800000, 'PK-004':5500000 };
const checks = workers.flatMap(w => periods.filter(p=>w.scenario !== 'missing'||p==='2026-10').map(period=>{
  const missing = period==='2026-10'||w.scenario==='missing';
  const mismatch = !missing&&period==='2026-09'&&['real','delay'].includes(w.scenario);
  return { id:`CHK-${w.id}-${period}`,workerId:w.id,companyId,period,status:missing?'DATA_UNAVAILABLE':mismatch?'NEEDS_REVIEW':'MATCHED',updatedAt,
    declaredCompanyId:companyId,registeredCompanyId:w.scenario==='missing'?null:companyId,
    declaredStartDate:w.employmentStartDate,registeredStartDate:w.scenario==='missing'?null:w.employmentStartDate,
    wageComponent:'FIXED_MONTHLY_WAGE',comparableWage:true,declaredWage:wages[w.id],reportedWage:missing?null:wages[w.id],workerDeduction:wages[w.id]/100,
    paymentStatus:missing?'UNAVAILABLE':mismatch?'UNMATCHED':'MATCHED',
    reason:missing?'Catatan periode ini belum diterima. Belum ada kesimpulan kecocokan.':mismatch?'Slip gaji menunjukkan potongan JKN. Catatan pembayaran pada periode yang sama perlu dicocokkan; data mungkin masih diperbarui.':'Pendaftaran, komponen upah tetap, dan catatan pembayaran tersedia serta cocok.' };
}));
const slip={id:'EVD-0101',type:'PAYSLIP',title:'Slip gaji simulasi Agustus 2026',period:'2026-08',source:'WORKER',sharedWithCompany:false,declaredWage:4800000,deduction:48000,synthetic:true};
const events = [
  {id:'EV-0101-3',occurredAt:'2026-09-04T10:00:00+07:00',actorRole:'bpjs',actorName:'Maya Anggraini',action:'Pemeriksaan selesai',note:'Pembayaran cocok setelah pembaruan catatan simulasi.',visibility:'ALL'},
  {id:'EV-0101-2',occurredAt:'2026-09-03T14:00:00+07:00',actorRole:'company',actorName:'Ratna Putri',action:'Klarifikasi perusahaan diterima',note:'Catatan pembayaran perusahaan sudah benar. Bukti rekonsiliasi simulasi terlampir.',visibility:'ALL'},
  {id:'EV-0101-1',occurredAt:'2026-09-02T09:00:00+07:00',actorRole:'worker',actorName:'Arif Wicaksana',action:'Tiket terkirim',note:'Laporan diterima untuk pemeriksaan.',visibility:'ALL'},
];
const tickets = [
  {id:'SPK-2026-0101',workerId:'PK-003',companyId,period:'2026-08',issueType:'CONTRIBUTION_MISMATCH',status:'RESOLVED',description:'Catatan pembayaran Agustus sempat belum cocok.',workerNote:'Keterangan simulasi untuk contoh tiket selesai.',createdAt:events[2].occurredAt,updatedAt:events[0].occurredAt,nextActor:'none',nextStep:'Tidak ada tindakan lanjutan untuk tiket ini.',priority:'MEDIUM',priorityReason:'Perbedaan pada satu periode perlu rekonsiliasi, bukan kesimpulan otomatis.',request:null,evidence:[slip],events,
    clarification:{choice:'CORRECT',note:'Pembayaran perusahaan sudah dicatat. Pembaruan catatan simulasi terlambat.',correctionDate:null,evidenceAttached:true,submittedAt:events[1].occurredAt},
    resolution:{code:'UPDATE_DELAY',explanation:'Perbedaan terjadi karena waktu pembaruan. Catatan pembayaran terbaru sudah cocok.',updateMonthlyData:true,resolvedAt:events[0].occurredAt}},
  {id:'SPK-2026-0102',workerId:'PK-004',companyId,period:'2026-10',issueType:'DATA_UNAVAILABLE',status:'SUBMITTED',description:'Catatan kepesertaan Oktober belum tersedia.',workerNote:'Saya mulai bekerja pada 1 Oktober 2026. Semua informasi ini fiktif.',createdAt:'2026-10-03T08:00:00+07:00',updatedAt:'2026-10-03T08:00:00+07:00',nextActor:'bpjs',nextStep:'Petugas meninjau laporan dan kelengkapan data.',priority:'NEEDS_DATA',priorityReason:'Data dasar belum tersedia; bukti perlu dilengkapi sebelum mengambil keputusan.',request:null,evidence:[],events:[{id:'EV-0102-1',occurredAt:'2026-10-03T08:00:00+07:00',actorRole:'worker',actorName:'Sinta Maharani',action:'Tiket terkirim',note:'Laporan diterima untuk pemeriksaan.',visibility:'ALL'}],clarification:null,resolution:null},
];
writeFileSync(dir+'placeholder.json',JSON.stringify({metadata:{schemaVersion:'1.0',currency:'IDR',timezone:'Asia/Jakarta',updatedAt,defaultPeriod:'2026-09',periods,actors:{company:'Ratna Putri',bpjs:'Maya Anggraini'}},companies:[{id:companyId,name:'PT Cakrawala Kreasi'}],workers,checks,tickets,employmentChanges:[]},null,2)+'\n');
console.log('Static placeholder.json created.');
