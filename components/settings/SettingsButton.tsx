"use client";
import React, { useState } from "react";
import { OpenRouterSettingsModal } from "./OpenRouterSettingsModal";

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        title="إعدادات OpenRouter"
        style={{
          background: 'transparent',
          border: '1px solid #444',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px'
        }}
      >
        <span role="img" aria-label="settings">⚙️</span>
        الإعدادات
      </button>
      {isOpen && <OpenRouterSettingsModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
