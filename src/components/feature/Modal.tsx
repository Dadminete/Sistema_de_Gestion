import React, { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
    headerClassName = '',
    bodyClassName = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content modal-${size} ${className}`} onClick={(e) => e.stopPropagation()}>
                <div className={`modal-header ${headerClassName}`}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-btn">
                        <FaTimes />
                    </button>
                </div>
                <div className={`modal-body ${bodyClassName}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
