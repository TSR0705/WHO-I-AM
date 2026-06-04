import React from "react";

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

interface GridControlPanelProps {
  cfg: CfgState;
  setCfg: React.Dispatch<React.SetStateAction<CfgState>>;
  onClose: () => void;
  onRandomize: () => void;
}

export default function GridControlPanel({ cfg, setCfg, onClose, onRandomize }: GridControlPanelProps) {
  return (
    <aside className="control-panel no-print">
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
        <button onClick={onRandomize}>Random (R)</button>
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
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
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
