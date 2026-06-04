import React, { useState, useEffect, useCallback } from "react";
import DataGridHero from "@/components/ui/data-grid-hero";

interface CfgState {
  rows: number;
  cols: number;
  spacing: number;
  duration: number;
  color: string;
  animationType: "pulse" | "wave" | "random";
  pulseEffect: boolean;
  mouseGlow: boolean;
  opacityMin: number;
  opacityMax: number;
  background: string;
}

export default function DemoOne() {
  const [cfg, setCfg] = useState<CfgState>({
    rows: 25,
    cols: 35,
    spacing: 4,
    duration: 5.0,
    color: "hsl(var(--cyan))",
    animationType: "pulse",
    pulseEffect: true,
    mouseGlow: true,
    opacityMin: 0.05,
    opacityMax: 0.6,
    background: "hsl(var(--background))",
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const randomize = useCallback(() => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const colors = [
      "hsl(var(--green))",
      "hsl(var(--pink))",
      "hsl(var(--cyan))",
      "hsl(var(--yellow))",
      "hsl(var(--orange))",
    ];
    const anims: ("pulse" | "wave" | "random")[] = ["pulse", "wave", "random"];
    setCfg((c) => ({
      ...c,
      rows: Math.floor(rand(15, 40)),
      cols: Math.floor(rand(15, 40)),
      duration: rand(3, 10),
      color: colors[Math.floor(Math.random() * colors.length)],
      animationType: anims[Math.floor(Math.random() * anims.length)],
      pulseEffect: Math.random() > 0.2,
      mouseGlow: Math.random() > 0.3,
      opacityMin: rand(0.05, 0.2),
      opacityMax: rand(0.5, 1.0),
      spacing: Math.floor(rand(2, 8)),
    }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName && target.tagName.toLowerCase() === "input") return;
      const k = e.key.toLowerCase();
      if (k === "h") setPanelOpen((v) => !v);
      if (k === "r") randomize();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomize]);

  return (
    <DataGridHero {...cfg}>
      <h1>DataGrid Hero</h1>
      <p>
        A generative, interactive hero component built with React. Customize
        the grid animation using the control panel.
      </p>
      <div className="buttons">
        <button className="button">Get Started</button>
        <button
          className="button-outline"
          onClick={() => setPanelOpen(true)}
        >
          Controls (H)
        </button>
      </div>

      {panelOpen && (
        <ControlPanel
          cfg={cfg}
          setCfg={setCfg}
          onClose={() => setPanelOpen(false)}
          onRandomize={randomize}
        />
      )}
    </DataGridHero>
  );
}

// -- Control Panel & Helpers --

interface ControlPanelProps {
  cfg: CfgState;
  setCfg: React.Dispatch<React.SetStateAction<CfgState>>;
  onClose: () => void;
  onRandomize: () => void;
}

function ControlPanel({ cfg, setCfg, onClose, onRandomize }: ControlPanelProps) {
  return (
    <aside className="control-panel">
      <h3>Grid Controls</h3>
      <Slider
        label="Rows"
        min={5}
        max={50}
        step={1}
        value={cfg.rows}
        onChange={(v) => setCfg({ ...cfg, rows: v })}
      />
      <Slider
        label="Columns"
        min={5}
        max={50}
        step={1}
        value={cfg.cols}
        onChange={(v) => setCfg({ ...cfg, cols: v })}
      />
      <Slider
        label="Spacing"
        min={0}
        max={16}
        step={1}
        value={cfg.spacing}
        onChange={(v) => setCfg({ ...cfg, spacing: v })}
      />
      <Slider
        label="Duration"
        min={1}
        max={15}
        step={0.1}
        value={cfg.duration}
        onChange={(v) => setCfg({ ...cfg, duration: v })}
      />
      <Select
        label="Animation Type"
        value={cfg.animationType}
        options={[
          { label: "Pulse from Center", value: "pulse" },
          { label: "Wave", value: "wave" },
          { label: "Random", value: "random" },
        ]}
        onChange={(v) => setCfg({ ...cfg, animationType: v as "pulse" | "wave" | "random" })}
      />
      <Toggle
        label="Pulse Effect"
        value={cfg.pulseEffect}
        onChange={(v) => setCfg({ ...cfg, pulseEffect: v })}
      />
      <Toggle
        label="Mouse Glow"
        value={cfg.mouseGlow}
        onChange={(v) => setCfg({ ...cfg, mouseGlow: v })}
      />
      <Slider
        label="Opacity Min"
        min={0}
        max={1}
        step={0.05}
        value={cfg.opacityMin}
        onChange={(v) => setCfg({ ...cfg, opacityMin: v })}
      />
      <Slider
        label="Opacity Max"
        min={0}
        max={1}
        step={0.05}
        value={cfg.opacityMax}
        onChange={(v) => setCfg({ ...cfg, opacityMax: v })}
      />
      <div className="panel-buttons">
        <button onClick={onRandomize}>Randomize (R)</button>
        <button onClick={onClose}>Close (H)</button>
      </div>
    </aside>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

function Slider({ label, min, max, step, value, onChange }: SliderProps) {
  return (
    <label className="panel-control">
      <div className="label-row">
        <span>{label}</span>
        <span className="value">{Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <label className="panel-control toggle-control">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
      >
        <span />
      </button>
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="panel-control">
      <div className="label-row">{label}</div>
      <div className="select-wrapper">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </label>
  );
}
