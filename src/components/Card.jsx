import React from 'react';
import './Card.css';

export default function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div 
      className={`card glass ${hoverable ? 'card-hoverable' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
