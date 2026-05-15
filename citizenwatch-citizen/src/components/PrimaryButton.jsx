import { Link } from 'react-router-dom';

export default function PrimaryButton({
  children,
  icon: Icon,
  to,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const buttonClassName = `primary-button primary-button--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link className={buttonClassName} to={to} {...props}>
        {Icon && <Icon size={18} aria-hidden="true" />}
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClassName} type={type} {...props}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}
