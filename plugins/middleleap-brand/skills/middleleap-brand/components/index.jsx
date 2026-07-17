/**
 * MiddleLeap component library · v2.0
 * import './components.css' once at app root, then use these components.
 * Every state change is the pivot: a square rotating 45°. See DESIGN.md.
 */
import React, { useId } from 'react';

/* ---------- Mark & Lockup ---------- */
export function PivotMark({ size = 26, animate = false, className = '' }) {
  const r = Math.round(size * 0.16);
  const box = { width: size, height: size, borderRadius: r };
  return (
    <span className={`ml-mark ${animate ? 'ml-mark--animate' : ''} ${className}`} aria-hidden="true">
      <span className="ml-mark__sq" style={box} />
      <span className="ml-mark__dm" style={{ ...box, marginLeft: size * 0.45 }} />
    </span>
  );
}

export function Wordmark({ size = 20, className = '' }) {
  return (
    <span className={`ml-wordmark ${className}`} style={{ fontSize: size }}>
      Middle<b>Leap</b>
    </span>
  );
}

export function Lockup({ markSize = 26, wordSize = 20, animate = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: markSize * 0.55 }}>
      <PivotMark size={markSize} animate={animate} />
      <Wordmark size={wordSize} />
    </span>
  );
}

/* ---------- Button ---------- */
export function Button({
  variant = 'primary', // primary | secondary | ghost | danger
  size = 'md',         // sm | md | lg
  children, className = '', ...rest
}) {
  const sz = size === 'md' ? '' : `ml-btn--${size}`;
  return (
    <button className={`ml-btn ml-btn--${variant} ${sz} ${className}`} {...rest}>
      {variant === 'primary' && <span className="ml-btn__pv" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ---------- Field ---------- */
export function Field({ label, hint, error = false, id, className = '', ...inputProps }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div className={`ml-field ${error ? 'ml-field--error' : ''} ${className}`}>
      {label && <label className="ml-field__label" htmlFor={fieldId}>{label}</label>}
      <input className="ml-field__input" id={fieldId} aria-invalid={error || undefined}
        aria-describedby={hintId} {...inputProps} />
      {hint && <span className="ml-field__hint" id={hintId}>{hint}</span>}
    </div>
  );
}

/* ---------- Checkbox — the pivot ---------- */
export function Checkbox({ label, className = '', ...rest }) {
  return (
    <label className={`ml-check ${className}`}>
      <input type="checkbox" {...rest} />
      <span className="ml-check__box" aria-hidden="true" />
      {label}
    </label>
  );
}

/* ---------- Toggle ---------- */
export function Toggle({ 'aria-label': ariaLabel, className = '', ...rest }) {
  return (
    <label className={`ml-toggle ${className}`}>
      <input type="checkbox" role="switch" aria-label={ariaLabel} {...rest} />
      <span className="ml-toggle__track" aria-hidden="true" />
      <span className="ml-toggle__thumb" aria-hidden="true" />
    </label>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tone = 'neutral', children, className = '' }) {
  // tone: ember | positive | caution | critical | neutral
  return (
    <span className={`ml-badge ml-badge--${tone} ${className}`}>
      <i className="ml-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ title, children, mark = false, className = '', ...rest }) {
  return (
    <div className={`ml-card ${className}`} {...rest}>
      {mark && <PivotMark size={18} />}
      {title && <h4 className="ml-card__title">{title}</h4>}
      <div className="ml-card__body">{children}</div>
    </div>
  );
}

/* ---------- Alert ---------- */
export function Alert({ tone = 'info', title, children, className = '' }) {
  // tone: positive | caution | critical | info
  const role = tone === 'critical' ? 'alert' : 'status';
  return (
    <div className={`ml-alert ml-alert--${tone} ${className}`} role={role}>
      <span className="ml-alert__dot" aria-hidden="true" />
      <div>
        {title && <b className="ml-alert__title">{title}</b>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Loader ---------- */
export function Loader({ size = 34, label = 'Loading' }) {
  return (
    <span role="status" aria-label={label}>
      <span className="ml-loader" style={{ width: size, height: size, borderRadius: size * 0.2, display: 'inline-block' }} />
    </span>
  );
}

/* ---------- Eyebrow ---------- */
export function Eyebrow({ children, className = '' }) {
  return <p className={`ml-eyebrow ${className}`}>{'// '}{children}</p>;
}
