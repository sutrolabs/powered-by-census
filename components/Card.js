export default function Card({ className, disabled, children, noPadding }) {
  return (
    <div
      className={`
        rounded-md border border-neutral-200  bg-white ${!noPadding ? "px-3 py-5" : ""}
        shadow-sm transition
        data-[disabled]:border-neutral-200
        ${className}
      `}
      data-disabled={disabled ? "" : null}
    >
      {children}
    </div>
  )
}
