"use client";

import { X } from "lucide-react";
import eduDataRaw from "../data/education.json";

interface EduItem {
  name: string;
  whatChecked: string;
  whyAccess: string;
  privacyImpact: string;
  realWorldExample: string;
  protection: string;
  learnMore: string;
}

const eduData = eduDataRaw as Record<string, EduItem>;

interface EducationalDrawerProps {
  eduKey: string | null;
  onClose: () => void;
}

export default function EducationalDrawer({ eduKey, onClose }: EducationalDrawerProps) {
  if (!eduKey || !eduData[eduKey]) return null;

  const item = eduData[eduKey];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono no-print">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-900 p-6 flex flex-col justify-between shadow-2xl relative">
          
          <div className="space-y-5 overflow-y-auto pr-1">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                {item.name}
              </h3>
              <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">What we checked</h4>
                <p className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-900/80">
                  {item.whatChecked}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Why websites can access this</h4>
                <p className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-900/80">
                  {item.whyAccess}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Privacy Impact</h4>
                <p className="p-3.5 bg-red-950/10 rounded-xl border border-red-900/20 text-zinc-400">
                  {item.privacyImpact}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Real-world Example</h4>
                <p className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-900/80 italic text-zinc-400">
                  &ldquo;{item.realWorldExample}&rdquo;
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">How to protect yourself</h4>
                <p className="p-3.5 bg-cyan-950/10 rounded-xl border border-cyan-900/20 text-zinc-400">
                  {item.protection}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Learn More</h4>
                <p className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-900/80 text-zinc-500">
                  {item.learnMore}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 rounded-xl text-xs font-bold font-mono transition-all"
            >
              CLOSE DIALOG
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
