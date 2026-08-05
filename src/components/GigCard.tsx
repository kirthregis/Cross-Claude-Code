import { Gig } from "@/lib/types";

interface GigCardProps {
  gig: Gig;
}

export function GigCard({ gig }: GigCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{gig.sourceKind}</p>
          <h3 className="text-lg font-bold text-white">{gig.title}</h3>
          <p className="text-sm text-zinc-400 mt-1">{gig.body}</p>
        </div>
      </div>
    </div>
  );
}