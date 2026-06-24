"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play, Pause, Home, Trash2, Sparkles,
  RefreshCw, AlertCircle, Upload, ImageIcon,
  Layers, Crosshair
} from "lucide-react";
import { UseArduinoReturn } from "@/hooks/useArduino";

// ─── Machine constants ────────────────────────────────────────────────────────
const BED_W = 400, BED_H = 400, GRID_STEP = 50;
const VW = 500, VH = 500;
const PL = 42, PT = 16, PR = 16, PB = 38;
const PW = VW - PL - PR, PH = VH - PT - PB;

function toSvg(xMm: number, yMm: number) {
  return { x: PL + (xMm / BED_W) * PW, y: PT + (yMm / BED_H) * PH };
}

// ─── Waypoint type ─────────────────────────────────────────────────────────────
interface WP { x: number; y: number; laser: boolean; f: number; }

// ─── Demo patterns ─────────────────────────────────────────────────────────────
function mkSquare(): WP[] {
  const s = 240, ox = (BED_W - s) / 2, oy = (BED_H - s) / 2;
  return [
    { x: BED_W/2, y: BED_H/2, laser:false, f:4000 },
    { x:ox,    y:oy,    laser:false, f:4000 },
    { x:ox+s,  y:oy,    laser:true,  f:1500 },
    { x:ox+s,  y:oy+s,  laser:true,  f:1500 },
    { x:ox,    y:oy+s,  laser:true,  f:1500 },
    { x:ox,    y:oy,    laser:true,  f:1500 },
  ];
}
function mkCircle(): WP[] {
  const cx=BED_W/2, cy=BED_H/2, r=155;
  const pts:WP[]=[{x:cx,y:cy,laser:false,f:4000},{x:cx+r,y:cy,laser:false,f:4000}];
  for(let i=1;i<=72;i++){const a=(i/72)*Math.PI*2;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a),laser:true,f:1200});}
  return pts;
}
function mkStar(): WP[] {
  const cx=BED_W/2,cy=BED_H/2,ro=155,ri=62,n=5;
  const v:{x:number;y:number}[]=[];
  for(let i=0;i<n*2;i++){const a=(i*Math.PI)/n-Math.PI/2;v.push({x:cx+(i%2===0?ro:ri)*Math.cos(a),y:cy+(i%2===0?ro:ri)*Math.sin(a)});}
  const pts:WP[]=[{x:cx,y:cy,laser:false,f:4000},{...v[0],laser:false,f:4000}];
  v.forEach(p=>pts.push({...p,laser:true,f:1000}));pts.push({...v[0],laser:true,f:1000});
  return pts;
}
function mkScan(): WP[] {
  const x0=90,x1=310,y0=80,y1=320,lines=14;
  const pts:WP[]=[{x:x0,y:y0,laser:false,f:4000}];
  for(let i=0;i<lines;i++){const y=y0+(i*(y1-y0))/(lines-1),r=i%2===0;pts.push({x:r?x0:x1,y,laser:false,f:3000});pts.push({x:r?x1:x0,y,laser:true,f:900});}
  return pts;
}
const PATTERNS={square:mkSquare(),circle:mkCircle(),star:mkStar(),scan:mkScan()} as const;
type PatternKey=keyof typeof PATTERNS;

// ─── Image → per-component contour toolpath ──────────────────────────────────
async function imageToToolpath(src: string): Promise<WP[]> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // High-res grid to eliminate jagged edges
      const C=128, R=128, cW=BED_W/C, cH=BED_H/R;
      const canvas=document.createElement("canvas");
      canvas.width=C; canvas.height=R;
      const ctx=canvas.getContext("2d")!;
      ctx.fillStyle="#fff"; ctx.fillRect(0,0,C,R);
      ctx.drawImage(img,0,0,C,R);
      const {data}=ctx.getImageData(0,0,C,R);

      const dark=new Uint8Array(C*R);
      for(let i=0;i<C*R;i++){const g=0.299*data[i*4]+0.587*data[i*4+1]+0.114*data[i*4+2];dark[i]=g<145?1:0;}

      const edge=new Uint8Array(C*R); let ec=0;
      for(let y=0;y<R;y++)for(let x=0;x<C;x++){
        const i=y*C+x; if(!dark[i])continue;
        if((x>0&&!dark[y*C+x-1])||(x<C-1&&!dark[y*C+x+1])||(y>0&&!dark[(y-1)*C+x])||(y<R-1&&!dark[(y+1)*C+x])){edge[i]=1;ec++;}
      }
      if(ec<8){resolve(mkScan());return;}

      // BFS connected components
      const labels=new Int32Array(C*R).fill(-1);
      const comps:number[][]=[];
      const q:number[]=[];
      for(let i=0;i<C*R;i++){
        if(!edge[i]||labels[i]!==-1)continue;
        const id=comps.length; const comp:number[]=[]; comps.push(comp);
        labels[i]=id; q.length=0; q.push(i); let h=0;
        while(h<q.length){
          const cur=q[h++]; comp.push(cur);
          const cx=cur%C,cy=Math.floor(cur/C);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            if(!dx&&!dy)continue;
            const nx=cx+dx,ny=cy+dy;
            if(nx<0||nx>=C||ny<0||ny>=R)continue;
            const ni=ny*C+nx;
            if(edge[ni]&&labels[ni]===-1){labels[ni]=id;q.push(ni);}
          }
        }
      }

      const wps:WP[]=[{x:BED_W/2,y:BED_H/2,laser:false,f:4000}];
      // Require at least 10 points to remove noise
      comps.filter(c=>c.length>=10).sort((a,b)=>b.length-a.length).forEach(comp=>{
        const pts=comp.map(i=>({x:(i%C)*cW+cW/2,y:Math.floor(i/C)*cH+cH/2}));
        const vis=new Uint8Array(pts.length); const ord:typeof pts=[];
        let cur=0,minY=Infinity;
        pts.forEach((p,i)=>{if(p.y<minY){minY=p.y;cur=i;}});
        vis[cur]=1; ord.push(pts[cur]);
        while(ord.length<pts.length){
          const cp=pts[cur]; let best=-1,bestD=Infinity;
          for(let i=0;i<pts.length;i++){if(vis[i])continue;const d=(pts[i].x-cp.x)**2+(pts[i].y-cp.y)**2;if(d<bestD){bestD=d;best=i;}}
          if(best===-1)break;
          vis[best]=1; ord.push(pts[best]); cur=best;
        }

        // Smooth the path
        let sm = ord;
        for(let it=0;it<4;it++){
           const nsm: {x:number, y:number}[] = [];
           for(let i=0;i<sm.length;i++){
             // Don't wrap around if the path doesn't naturally close
             const isStart = i === 0;
             const isEnd = i === sm.length - 1;
             const p0 = isStart ? sm[i] : sm[i-1];
             const p1 = sm[i];
             const p2 = isEnd ? sm[i] : sm[i+1];
             nsm.push({x:(p0.x+p1.x+p2.x)/3, y:(p0.y+p1.y+p2.y)/3});
           }
           sm = nsm;
        }

        wps.push({...sm[0],laser:false,f:3500}); // Move to start
        wps.push({...sm[0],laser:true,f:900});   // Turn on laser

        for(let i=1; i<sm.length; i++) {
          const prev = sm[i-1];
          const curr = sm[i];
          const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
          
          if (dist > 5) {
            // Lift laser (z-axis movement) for jumps
            wps.push({...curr, laser:false, f:3500});
          }
          wps.push({...curr, laser:true, f:900});
        }
        
        // Only close the loop if the ends are actually close to each other
        const distClose = Math.hypot(sm[0].x - sm[sm.length-1].x, sm[0].y - sm[sm.length-1].y);
        if (distClose <= 5) {
           wps.push({...sm[0], laser:true, f:900});
        } else {
           // Lift laser before moving to next component
           wps.push({...sm[sm.length-1], laser:false, f:3500});
        }
      });
      wps.push({x:0,y:0,laser:false,f:4000});
      resolve(wps);
    };
    img.onerror=()=>resolve(mkScan());
    img.src=src;
  });
}

// ─── Trail point ───────────────────────────────────────────────────────────────
interface TrailPt { x:number; y:number; laser:boolean; }

// ─── Component ────────────────────────────────────────────────────────────────
interface CNCBedProps { arduino?: UseArduinoReturn; }

export default function CNCBed({ arduino }: CNCBedProps) {
  const [toolX,setToolX]         = useState(BED_W/2);
  const [toolY,setToolY]         = useState(BED_H/2);
  const [laserOn,setLaserOn]     = useState(false);
  const [trail,setTrail]         = useState<TrailPt[]>([]);
  const [isPlaying,setIsPlaying] = useState(true);
  const [pattern,setPattern]     = useState<PatternKey>("square");
  const [status,setStatus]       = useState<"IDLE"|"MOVING"|"CUTTING">("IDLE");
  const [feedRate,setFeedRate]   = useState(1500);
  const [bedImage,setBedImage]   = useState<string|null>(null);
  const [customWPs,setCustomWPs] = useState<WP[]|null>(null);
  const [activeLabel,setActiveLabel] = useState("square");
  const [tab,setTab]             = useState<"ai"|"upload">("ai");
  const [aiPrompt,setAiPrompt]   = useState("");
  const [aiLoading,setAiLoading] = useState(false);
  const [aiError,setAiError]     = useState<string|null>(null);
  const [passes,setPasses]       = useState(1);
  const [isDragging,setIsDragging] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const anim = useRef({wpIdx:0,progress:0,x:BED_W/2,y:BED_H/2,laser:false});

  const activeWPs = useMemo(() => {
    const base = customWPs ?? PATTERNS[pattern];
    if (passes <= 1) return base;
    const res: WP[] = [];
    for(let i=0; i<passes; i++) {
      res.push(...base);
    }
    return res;
  }, [customWPs, pattern, passes]);

  // ── Demo animation ──────────────────────────────────────────────────────────
  useEffect(()=>{
    if(arduino?.isConnected||!isPlaying)return;
    const wps=activeWPs, s=anim.current, SC=22;
    const id=setInterval(()=>{
      if(s.wpIdx >= wps.length - 1) {
        setIsPlaying(false);
        setStatus("IDLE");
        setLaserOn(false);
        return;
      }
      const wp=wps[s.wpIdx],ni=s.wpIdx+1,nwp=wps[ni];
      if(!wp||!nwp)return;
      const dx=nwp.x-wp.x,dy=nwp.y-wp.y,dist=Math.hypot(dx,dy);
      if(dist<0.5){s.wpIdx=ni;s.progress=0;return;}
      s.progress+=(wp.f/60/1000)*20*SC/dist;
      if(s.progress>=1){s.wpIdx=ni;s.progress=0;s.x=nwp.x;s.y=nwp.y;s.laser=nwp.laser;}
      else{s.x=wp.x+dx*s.progress;s.y=wp.y+dy*s.progress;s.laser=nwp.laser;}
      setToolX(s.x);setToolY(s.y);setLaserOn(s.laser);
      setFeedRate(wp.f);setStatus(s.laser?"CUTTING":"MOVING");
      setTrail(p=>[...p.slice(-1500),{x:s.x,y:s.y,laser:s.laser}]);
    },20);
    return ()=>clearInterval(id);
  },[isPlaying,pattern,arduino?.isConnected,activeWPs]);

  // ── Arduino live feed ───────────────────────────────────────────────────────
  useEffect(()=>{
    if(!arduino?.isConnected||!arduino.lastMessage)return;
    const line=arduino.lastMessage.trim().toUpperCase();
    const xM=line.match(/X(-?\d+\.?\d*)/),yM=line.match(/Y(-?\d+\.?\d*)/),fM=line.match(/F(\d+\.?\d*)/);
    if(xM||yM){const nx=xM?Math.max(0,Math.min(BED_W,parseFloat(xM[1]))):toolX,ny=yM?Math.max(0,Math.min(BED_H,parseFloat(yM[1]))):toolY;setToolX(nx);setToolY(ny);setStatus("MOVING");setTrail(p=>[...p.slice(-900),{x:nx,y:ny,laser:laserOn}]);}
    if(fM)setFeedRate(parseFloat(fM[1]));
    if(line.includes("M3")){setLaserOn(true);setStatus("CUTTING");}
    if(line.includes("M5")){setLaserOn(false);setStatus("MOVING");}
    if(line.startsWith("G28")){setToolX(0);setToolY(0);setTrail([]);setStatus("IDLE");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[arduino?.lastMessage,arduino?.isConnected]);

  // ── Load image → toolpath ───────────────────────────────────────────────────
  const loadImage=async(src:string,label:string)=>{
    setAiLoading(true);setAiError(null);
    try{
      setBedImage(src);
      const wps=await imageToToolpath(src);
      setCustomWPs(wps);setActiveLabel(label);setTrail([]);setIsPlaying(true);
      anim.current={wpIdx:0,progress:0,x:BED_W/2,y:BED_H/2,laser:false};
    }catch{setAiError("Could not process image.");}
    finally{setAiLoading(false);}
  };

  const runAiCut=async()=>{
    if(!aiPrompt.trim()||aiLoading)return;
    setAiLoading(true);setAiError(null);
    try{
      const res=await fetch("/api/generate-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:aiPrompt.trim()})});
      const data=await res.json();
      if(!res.ok||data.error)throw new Error(data.error||"Generation failed");
      await loadImage(data.image,`${aiPrompt.slice(0,22)}…`);
    }catch(e:unknown){setAiError(e instanceof Error?e.message:"Failed");}
    finally{setAiLoading(false);}
  };

  const handleFile=useCallback((file:File)=>{
    if(!file.type.startsWith("image/"))return;
    const r=new FileReader();
    r.onload=e=>loadImage(e.target?.result as string,file.name.slice(0,20));
    r.readAsDataURL(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const handleDrop=useCallback((e:React.DragEvent<HTMLDivElement>)=>{
    e.preventDefault();setIsDragging(false);
    const f=e.dataTransfer.files[0];if(f)handleFile(f);
  },[handleFile]);

  const handleHome=()=>{
    anim.current={wpIdx:0,progress:0,x:0,y:0,laser:false};
    setToolX(0);setToolY(0);setLaserOn(false);setTrail([]);setStatus("IDLE");
  };
  const switchPattern=(key:PatternKey)=>{
    setPattern(key);setCustomWPs(null);setBedImage(null);setActiveLabel(key);
    setTrail([]);anim.current={wpIdx:0,progress:0,x:BED_W/2,y:BED_H/2,laser:false};
  };

  // ── Trail segments ────────────────────────────────────────────────────────────
  type Seg={pts:string[];laser:boolean};
  const segs:Seg[]=[];
  for(const pt of trail){
    const sp=toSvg(pt.x,pt.y);
    const s=`${sp.x.toFixed(1)},${sp.y.toFixed(1)}`;
    if(!segs.length||segs[segs.length-1].laser!==pt.laser)segs.push({pts:[s],laser:pt.laser});
    else segs[segs.length-1].pts.push(s);
  }
  const tool=toSvg(toolX,toolY);
  const gc=BED_W/GRID_STEP, gr=BED_H/GRID_STEP;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <section id="cnc-bed" className="relative py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/50 dark:from-slate-950 dark:via-zinc-950 dark:to-orange-950/20 border-y border-white/80 dark:border-zinc-800 overflow-hidden">
      {/* Ambient background blur blobs for glassmorphism pop */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] rounded-full bg-orange-400/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] rounded-full bg-indigo-400/5 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 tech-grid-fine opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">

        {/* ── Section header ── */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-px bg-orange-500/50" />
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-orange-600 uppercase">
                Hardware Interface
              </span>
            </div>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Laser Control System
            </h2>
            <div className="w-12 h-1 bg-white/60 dark:bg-slate-800 mt-4 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-orange-500 rounded-full" />
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed font-medium">
              Upload an image or generate one with AI. The simulation engine converts the design into a precision laser toolpath in real time.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white shadow-sm rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-widest">SYSTEM ONLINE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Bed visualization ── */}
          <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b-4 border-slate-300 dark:border-slate-800 font-mono bg-white dark:bg-slate-950">
              <Crosshair className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex-grow truncate">
                {activeLabel.length>0 ? activeLabel : "WORKSPACE"} — {BED_W}×{BED_H} mm
              </span>

              {/* Source badge */}
              {arduino?.isConnected ? (
                <span className="flex items-center gap-1.5 text-[9px] font-black border-2 border-emerald-300 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md shadow-[2px_2px_0px_#6ee7b7]">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500 animate-pulse"/>HARDWARE
                </span>
              ) : (
                <span className="text-[9px] font-black text-orange-700 border-2 border-orange-300 bg-orange-100 px-3 py-1.5 rounded-md shadow-[2px_2px_0px_#fdba74]">
                  {bedImage ? "AI CUT" : "SIMULATION"}
                </span>
              )}

              {/* Controls */}
              {!arduino?.isConnected && (
                <button onClick={()=>{
                  if (!isPlaying && anim.current.wpIdx >= activeWPs.length - 1) {
                    anim.current = {wpIdx:0,progress:0,x:activeWPs[0]?.x||0,y:activeWPs[0]?.y||0,laser:false};
                    setTrail([]);
                  }
                  setIsPlaying(p=>!p);
                }}
                  className="p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1">
                  {isPlaying?<Pause className="w-4 h-4"/>:<Play className="w-4 h-4 translate-x-0.5"/>}
                </button>
              )}
              <button onClick={handleHome} title="Go to home"
                className="p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1">
                <Home className="w-4 h-4"/>
              </button>
              <button onClick={()=>setTrail([])} title="Clear trail"
                className="p-2 rounded-md bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-500 transition-all cursor-pointer shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] active:shadow-none active:translate-y-1 active:translate-x-1">
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>

            {/* SVG bed */}
            <div className="p-6 relative">
              <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto rounded-xl select-none relative z-0 shadow-sm bg-white/70 dark:bg-slate-300/90">
                <defs>
                  {/* Honeycomb work-surface texture */}
                  <pattern id="hcBed" width="14" height="12.12" patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${PL},${PT})`}>
                    <polygon points="7,0.5 13.5,4 13.5,8.5 7,12 0.5,8.5 0.5,4"
                      fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="0.5"/>
                  </pattern>
                  {/* Laser trail soft shadow */}
                  <filter id="lShadowBed" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ea580c" floodOpacity="0.15"/>
                  </filter>
                  <clipPath id="bedArea">
                    <rect x={PL} y={PT} width={PW} height={PH}/>
                  </clipPath>
                </defs>

                {/* Work area background */}
                <rect x={PL} y={PT} width={PW} height={PH}
                  fill="rgba(255,255,255,0.6)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" rx="2"/>
                <rect x={PL} y={PT} width={PW} height={PH} fill="url(#hcBed)" rx="2"/>

                {/* Material on bed (uploaded/generated image) */}
                {bedImage && (
                  <image href={bedImage}
                    x={PL} y={PT} width={PW} height={PH}
                    preserveAspectRatio="none"
                    clipPath="url(#bedArea)"
                    style={{opacity:0.12, filter:"grayscale(1)"}}/>
                )}

                {/* Grid lines */}
                {Array.from({length:gc+1},(_,i)=>{
                  const sx=toSvg(i*GRID_STEP,0).x, b=i===0||i===gc;
                  return(<g key={`v${i}`}>
                    <line x1={sx} y1={PT} x2={sx} y2={PT+PH}
                      stroke={b?"rgba(0,0,0,0.08)":"rgba(0,0,0,0.03)"}
                      strokeWidth={b?1:0.5}/>
                    {!b&&<text x={sx} y={PT+PH+16} textAnchor="middle"
                      fontSize="8" fill="rgba(0,0,0,0.3)" fontFamily="monospace" fontWeight="bold">
                      {i*GRID_STEP}
                    </text>}
                  </g>);
                })}
                {Array.from({length:gr+1},(_,i)=>{
                  const sy=toSvg(0,i*GRID_STEP).y, b=i===0||i===gr;
                  return(<g key={`h${i}`}>
                    <line x1={PL} y1={sy} x2={PL+PW} y2={sy}
                      stroke={b?"rgba(0,0,0,0.08)":"rgba(0,0,0,0.03)"}
                      strokeWidth={b?1:0.5}/>
                    {!b&&<text x={PL-8} y={sy+3} textAnchor="end"
                      fontSize="8" fill="rgba(0,0,0,0.3)" fontFamily="monospace" fontWeight="bold">
                      {i*GRID_STEP}
                    </text>}
                  </g>);
                })}

                {/* Axis labels */}
                <text x={PL+PW/2} y={VH-2} textAnchor="middle"
                  fontSize="8.5" fill="rgba(0,0,0,0.25)" fontFamily="monospace" fontWeight="bold" letterSpacing="1">X (mm)</text>
                <text x={12} y={PT+PH/2} textAnchor="middle"
                  fontSize="8.5" fill="rgba(0,0,0,0.25)" fontFamily="monospace" fontWeight="bold" letterSpacing="1"
                  transform={`rotate(-90,12,${PT+PH/2})`}>Y (mm)</text>

                {/* Rails */}
                {[{x1:PL,y1:PT-8,x2:PL+PW,y2:PT-8},{x1:PL,y1:PT+PH+8,x2:PL+PW,y2:PT+PH+8},
                  {x1:PL-8,y1:PT,x2:PL-8,y2:PT+PH},{x1:PL+PW+8,y1:PT,x2:PL+PW+8,y2:PT+PH}
                ].map((l,li)=><line key={li} {...l} stroke="rgba(226,232,240,0.8)" strokeWidth="5" strokeLinecap="round"/>)}

                {/* Corner pulleys */}
                {[toSvg(0,0),toSvg(BED_W,0),toSvg(0,BED_H),toSvg(BED_W,BED_H)].map((c,ci)=>(
                  <g key={ci}>
                    <circle cx={c.x} cy={c.y} r="6.5"
                      fill="rgba(241,245,249,0.9)" stroke="rgba(203,213,225,0.8)" strokeWidth="1.5"/>
                    <circle cx={c.x} cy={c.y} r="2.5" fill="rgba(148,163,184,0.8)"/>
                  </g>
                ))}

                {/* Home label */}
                <rect x={PL+6} y={PT+6} width={38} height={12} rx="2"
                  fill="rgba(254,243,199,0.7)" stroke="rgba(252,211,77,0.8)" strokeWidth="1"/>
                <text x={PL+25} y={PT+14} textAnchor="middle"
                  fontSize="7" fill="#d97706" fontFamily="monospace" fontWeight="bold">HOME</text>

                {/* Burn trail */}
                {segs.map((seg,si)=>
                  seg.pts.length>1?(
                    <polyline key={si} points={seg.pts.join(" ")} fill="none"
                      stroke={seg.laser?"#ea580c":"rgba(0,0,0,0.05)"}
                      strokeWidth={seg.laser?2:0.8}
                      strokeLinecap="round" strokeLinejoin="round"
                      filter={seg.laser?"url(#lShadowBed)":undefined}/>
                  ):null
                )}

                {/* Tool head */}
                <g>
                  {laserOn&&(
                    <circle cx={tool.x} cy={tool.y} r="16"
                      fill="rgba(234,88,12,0.1)" stroke="rgba(234,88,12,0.2)" strokeWidth="1.5"
                      style={{animation:"ping 0.8s ease-out infinite"}}/>
                  )}
                  {/* Carriage */}
                  <rect x={tool.x-7} y={tool.y-7} width={14} height={14} rx="3"
                    fill="rgba(255,255,255,0.9)"
                    stroke={laserOn?"#ea580c":"rgba(148,163,184,0.8)"}
                    strokeWidth="1.5"/>
                  {/* Crosshair */}
                  {[[-16,0,-9,0],[9,0,16,0],[0,-16,0,-9],[0,9,0,16]].map(([x1,y1,x2,y2],li)=>(
                    <line key={li}
                      x1={tool.x+x1} y1={tool.y+y1} x2={tool.x+x2} y2={tool.y+y2}
                      stroke={laserOn?"#ea580c":"rgba(148,163,184,0.8)"}
                      strokeWidth="1.5" strokeLinecap="round"/>
                  ))}
                  {/* Laser dot */}
                  <circle cx={tool.x} cy={tool.y} r={laserOn?4.5:3}
                    fill={laserOn?"#ea580c":"#d1d5db"}/>
                  {laserOn&&<circle cx={tool.x} cy={tool.y} r="2.5" fill="#fff"/>}
                </g>

                {/* Position HUD */}
                <rect x={PL+PW-110} y={PT+PH-45} width={105} height={40} rx="6"
                  fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,1)" strokeWidth="1" />
                <text x={PL+PW-105} y={PT+PH-28} fontSize="9" fontWeight="bold"
                  fill="#64748b" fontFamily="monospace">
                  X: <tspan fill="#334155">{toolX.toFixed(1).padStart(6)}</tspan> mm
                </text>
                <text x={PL+PW-105} y={PT+PH-13} fontSize="9" fontWeight="bold"
                  fill="#64748b" fontFamily="monospace">
                  Y: <tspan fill="#334155">{toolY.toFixed(1).padStart(6)}</tspan> mm
                </text>

                {/* Status pill */}
                <rect x={PL+PW-86} y={PT+6} width={80} height={15} rx="4"
                  fill={status==="CUTTING"?"rgba(255,237,213,0.8)":status==="MOVING"?"rgba(254,249,195,0.8)":"rgba(220,252,231,0.8)"}
                  stroke={status==="CUTTING"?"rgba(253,186,116,0.8)":status==="MOVING"?"rgba(253,224,71,0.8)":"rgba(134,239,172,0.8)"}
                  strokeWidth="1"/>
                <text x={PL+PW-46} y={PT+16} textAnchor="middle"
                  fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="1"
                  fill={status==="CUTTING"?"#ea580c":status==="MOVING"?"#ca8a04":"#16a34a"}>
                  ● {status}
                </text>
              </svg>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-4 space-y-8 font-mono">

            {/* ── Image input card ── */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

              {/* Tab switcher */}
              <div className="flex gap-2 mb-6 relative z-10">
                {([["ai","AI Generate",Sparkles],["upload","Upload Image",Upload]] as const).map(([k,label,Icon])=>(
                  <button key={k} onClick={()=>setTab(k as "ai"|"upload")}
                    className={`flex items-center justify-center gap-2 flex-1 py-3 rounded-md border-2 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      tab===k
                        ? "bg-slate-800 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-none translate-y-1 translate-x-1"
                        : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 active:shadow-none active:translate-y-1 active:translate-x-1"
                    }`}>
                    <Icon className="w-4 h-4"/>{label}
                  </button>
                ))}
              </div>

              {/* AI tab */}
              {tab==="ai"&&(
                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                    DESCRIBE ANY SHAPE — AI GENERATES A CLEAN OUTLINE IMAGE FOR PRECISION LASER CUTTING.
                  </p>
                  <textarea rows={2} value={aiPrompt}
                    onChange={e=>setAiPrompt(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();runAiCut();}}}
                    placeholder="gear, mandala, logo, snowflake…"
                    className="w-full bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-md px-4 py-3 text-[12px] font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 transition-all shadow-inner"/>
                  <button onClick={runAiCut} disabled={!aiPrompt.trim()||aiLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-md border-2 border-blue-700 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-[4px_4px_0px_#1e3a8a] active:shadow-none active:translate-y-1 active:translate-x-1">
                    {aiLoading
                      ?<><RefreshCw className="w-4 h-4 animate-spin"/>PROCESSING…</>
                      :<><Sparkles className="w-4 h-4 fill-current"/>GENERATE &amp; CUT</>}
                  </button>
                </div>
              )}

              {/* Upload tab */}
              {tab==="upload"&&(
                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                    UPLOAD ANY IMAGE — IT WILL BE TRACED FOR A CONTOUR TOOLPATH.
                  </p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
                  <div
                    onClick={()=>fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
                    onDragLeave={()=>setIsDragging(false)}
                    className={`flex flex-col items-center gap-4 py-10 rounded-md border-4 border-dashed cursor-pointer transition-all bg-white dark:bg-slate-950 ${
                      isDragging
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-inner"
                        : "border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}>
                    <div className={`w-14 h-14 rounded-md border-2 flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 border-blue-200" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"}`}>
                      <ImageIcon className="w-6 h-6"/>
                    </div>
                    <div className="text-center font-mono uppercase">
                      <p className="text-[12px] text-slate-900 dark:text-slate-100 font-black">CLICK TO BROWSE</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">OR DRAG &amp; DROP</p>
                    </div>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">PNG · JPG · SVG</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {aiError&&(
                <div className="mt-4 flex items-start gap-2 text-[10px] text-red-700 dark:text-red-300 font-black bg-red-100 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-800 rounded-md px-4 py-3 shadow-[4px_4px_0px_#fca5a5] dark:shadow-[4px_4px_0px_rgba(220,38,38,0.5)] relative z-10">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/><span>{aiError}</span>
                </div>
              )}

              {/* Material preview */}
              {bedImage&&(
                <div className="mt-6 rounded-md overflow-hidden border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner relative z-10">
                  <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-sm" />
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">MATERIAL PREVIEW</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bedImage} alt="material" className="w-full object-contain max-h-32 p-3"
                    style={{filter:"grayscale(1)"}}/>
                </div>
              )}
            </div>

            {/* ── Cut Settings ── */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 pb-4 border-b-2 border-slate-300 dark:border-slate-800 flex justify-between items-center relative z-10">
                <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-orange-500"/> CUT PARAMETERS</span>
                <span className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-md shadow-[2px_2px_0px_#cbd5e1] dark:shadow-[2px_2px_0px_#1e293b]">{passes} {passes === 1 ? "PASS" : "PASSES"}</span>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-5">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 w-12">LAYERS</span>
                  <input type="range" min="1" max="10" step="1"
                     value={passes} onChange={e=>setPasses(parseInt(e.target.value))}
                     className="flex-grow accent-orange-500 cursor-pointer h-2 bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 rounded-lg appearance-none shadow-inner" />
                  <span className="text-[16px] text-slate-900 dark:text-slate-100 font-black w-6 text-right">{passes}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-wider font-bold">
                  CONTROLS HOW MANY TIMES THE LASER TRACES THE TOOLPATH TO CUT DEEPER INTO THE MATERIAL.
                </p>
              </div>
            </div>

            {/* ── Telemetry ── */}
            <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
              <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 pb-4 border-b-2 border-slate-300 dark:border-slate-800 relative z-10">
                LIVE TELEMETRY
              </div>
              <div className="space-y-4 relative z-10">
                {[
                  {label:"STATUS",    value:status,
                    cls:status==="CUTTING"?"text-orange-600 font-black":status==="MOVING"?"text-yellow-600 font-black":"text-emerald-600 font-black"},
                  {label:"LASER",     value:laserOn?"ACTIVE":"IDLE",
                    cls:laserOn?"text-orange-600 font-black":"text-slate-500 dark:text-slate-400 font-black"},
                  {label:"FEED RATE", value:`${feedRate} mm/min`, cls:"text-slate-800 dark:text-slate-200 font-black"},
                  {label:"POS X",     value:`${toolX.toFixed(2)} mm`, cls:"text-slate-900 dark:text-slate-100 font-black text-[13px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-sm"},
                  {label:"POS Y",     value:`${toolY.toFixed(2)} mm`, cls:"text-slate-900 dark:text-slate-100 font-black text-[13px] bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-sm"},
                  {label:"WAYPOINTS", value:trail.length.toString(), cls:"text-slate-600 dark:text-slate-400 font-black"},
                  {label:"SOURCE",    value:arduino?.isConnected?"HARDWARE":"SIMULATION",
                    cls:arduino?.isConnected?"text-emerald-600 font-black":"text-slate-500 dark:text-slate-400 font-black"},
                ].map(({label,value,cls})=>(
                  <div key={label} className="flex justify-between items-center text-[10px] tracking-wider uppercase">
                    <span className="text-slate-600 dark:text-slate-400 font-black">{label}</span>
                    <span className={cls}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Demo patterns (when no image loaded) ── */}
            {!bedImage&&!arduino?.isConnected&&(
              <div className="bg-slate-100 dark:bg-slate-900 border-4 border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-[8px_8px_0px_rgba(15,23,42,0.1)] dark:shadow-[8px_8px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
                <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 pb-4 border-b-2 border-slate-300 dark:border-slate-800 relative z-10">
                  DEMO PATTERNS
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {(Object.keys(PATTERNS) as PatternKey[]).map(key=>(
                    <button key={key} onClick={()=>switchPattern(key)}
                      className={`py-3 px-4 rounded-md border-2 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        activeLabel===key&&!customWPs
                          ?"bg-slate-800 dark:bg-slate-700 border-slate-900 dark:border-slate-600 text-white shadow-none translate-y-1 translate-x-1"
                          :"bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-[4px_4px_0px_#cbd5e1] dark:shadow-[4px_4px_0px_#1e293b] hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 active:shadow-none active:translate-y-1 active:translate-x-1"
                      }`}>
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
