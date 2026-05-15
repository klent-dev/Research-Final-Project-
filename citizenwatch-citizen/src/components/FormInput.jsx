export default function FormInput({
  icon: Icon,
  label,
  as = 'input',
  children,
  className = '',
  ...props
}) {
  const Field = as;

  return (
    <label className={`form-input ${className}`.trim()}>
      <span className="form-input__label">
        {Icon && <Icon aria-hidden="true" />}
        {label}
      </span>
      {children ?? <Field {...props} />}
    </label>
  );
}

