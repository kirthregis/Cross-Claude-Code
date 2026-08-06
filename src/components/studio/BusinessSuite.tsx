'use client';
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { DollarSign, Download, Layout } from 'lucide-react';

export default function BusinessSuite({ projectData }: any) {
  const [fee, setFee] = useState(0);
  
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('EMY STUDIO - INVOICE', 20, 20);
    doc.setFontSize(12);
    doc.text(\Project: \\, 20, 40);
    doc.text(\Fee: \ AED\, 20, 50);
    doc.text(\Tax (5%): \ AED\, 20, 60);
    doc.save('invoice.pdf');
  };

  return (
    <div className="p-6 bg-black/40 border border-white/10 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="text-blue-400" /> Revenue Engine
        </h2>
        <button onClick={generatePDF} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
          <Download size={18} /> Export PDF
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
          <label className="block text-xs uppercase text-gray-400 mb-2">Gig Fee (AED)</label>
          <input 
            type="number" 
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-full bg-transparent border-b border-blue-500 outline-none text-xl"
            placeholder="0.00"
          />
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
          <h3 className="flex items-center gap-2 text-sm mb-3"><Layout size={16}/> Stage Plot Preview</h3>
          <div className="aspect-video bg-zinc-900 rounded border border-dashed border-white/20 flex items-center justify-center">
            <span className="text-xs text-zinc-500">SVG Drag-Drop Canvas Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
