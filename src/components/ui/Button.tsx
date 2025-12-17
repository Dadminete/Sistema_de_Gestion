import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'secondaryLink' | 'iconOnly';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  return (
    <button className={`button ${variant} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
