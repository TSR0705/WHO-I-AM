import { cn } from "@/lib/utils";
import { useState } from "react";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("flex flex-col items-center gap-4 p-6 rounded-lg border border-white/10 bg-black/40 backdrop-blur-md max-w-sm mx-auto shadow-2xl")}>
      <h1 className="text-2xl font-bold mb-2 text-white">Component Example</h1>
      <h2 className="text-3xl font-extrabold font-mono text-primary">{count}</h2>
      <div className="flex gap-4">
        <button 
          onClick={() => setCount((prev) => prev - 1)}
          className="w-12 h-12 flex items-center justify-center text-xl font-bold border border-white/20 hover:border-primary hover:text-primary transition bg-neutral-900/60 rounded"
        >
          -
        </button>
        <button 
          onClick={() => setCount((prev) => prev + 1)}
          className="w-12 h-12 flex items-center justify-center text-xl font-bold border border-white/20 hover:border-primary hover:text-primary transition bg-neutral-900/60 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};
