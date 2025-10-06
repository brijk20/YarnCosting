import cn from "../../utils/cn"

const variantStyles = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-sm shadow-indigo-200",
  secondary:
    "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
  outline:
    "border border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:text-indigo-600",
  ghost:
    "text-slate-600 hover:bg-slate-900/5",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500",
  link:
    "text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline",
}

const sizeStyles = {
  sm: "h-9 px-3 text-xs font-semibold",
  md: "h-11 px-4 text-sm font-semibold",
  lg: "h-12 px-6 text-base font-semibold",
  pill: "px-4 py-2 text-xs font-semibold",
}

const Button = ({
  as = "button",
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}) => {
  const Component = as
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-full transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
  return (
    <Component
      className={cn(baseStyles, variantStyles[variant] ?? variantStyles.primary, sizeStyles[size] ?? sizeStyles.md, className)}
      {...props}
    >
      {leadingIcon ? <span className="flex h-4 w-4 items-center justify-center">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="flex h-4 w-4 items-center justify-center">{trailingIcon}</span> : null}
    </Component>
  )
}

export default Button
