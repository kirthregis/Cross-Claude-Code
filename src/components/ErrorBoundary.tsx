"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { crashed: boolean; error?: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError(e: Error): State {
    return { crashed: true, error: e?.message ?? "Unknown error" };
  }
  componentDidCatch() {
    // Heal storage on any crash � corrupt data is the most common cause
    try {
      ["emy-studio-projects-v1","emy-studio-settings-v1"].forEach(k => {
        try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
        catch { localStorage.removeItem(k); }
      });
    } catch {}
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24,fontFamily:"sans-serif",color:"#fff",textAlign:"center"}}>
        <img src="/icon-192.png" style={{width:64,borderRadius:16}} alt="EMY Studio" />
        <div style={{fontSize:20,fontWeight:900}}>EMY Studio</div>
        <div style={{color:"#71717a",fontSize:14,maxWidth:320}}>Something went wrong. Your projects are safe � tap below to reload.</div>
        <button onClick={() => { this.setState({crashed:false}); window.location.reload(); }}
          style={{background:"#7c3aed",color:"#fff",padding:"10px 28px",borderRadius:12,border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          Reload Studio
        </button>
        <button onClick={() => { localStorage.removeItem("emy-studio-projects-v1"); localStorage.removeItem("emy-studio-settings-v1"); window.location.reload(); }}
          style={{background:"transparent",color:"#71717a",border:"1px solid #3f3f46",padding:"8px 20px",borderRadius:10,fontSize:12,cursor:"pointer"}}>
          Clear data and reload
        </button>
      </div>
    );
  }
}
