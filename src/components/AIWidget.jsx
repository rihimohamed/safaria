import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import './AIWidget.css';

export default function AIWidget({ suggestion, title = "AI Suggestion", onAction }) {
  return (
    <div className="ai-widget glass">
      <div className="ai-widget-header">
        <Sparkles size={18} className="ai-icon" />
        <h4>{title}</h4>
      </div>
      <p className="ai-widget-content">{suggestion}</p>
      {onAction && (
        <button className="ai-widget-btn" onClick={onAction}>
          Explore <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
