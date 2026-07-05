import React from "react";

// Minimal 2-color Flat Vector Illustrations: Indigo (#4F46E5) + Slate Gray (#94A3B8)

// 1. School Profile: School building with blackboard feel
export function SchoolProfileIllustration({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground Line */}
      <line x1="4" y1="56" x2="60" y2="56" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      
      {/* Side wings */}
      <rect x="8" y="28" width="12" height="28" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
      <rect x="44" y="28" width="12" height="28" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
      
      {/* Center Building */}
      <rect x="20" y="16" width="24" height="40" rx="2" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
      
      {/* Roof Triangle */}
      <polygon points="20,16 32,6 44,16" fill="#4F46E5" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Clock */}
      <circle cx="32" cy="24" r="4" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" />
      <line x1="32" y1="24" x2="32" y2="22" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="24" x2="34" y2="24" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />

      {/* Main Door */}
      <path d="M28 56V44C28 41.7909 29.7909 40 32 40C34.2091 40 36 41.7909 36 44V56" fill="#4F46E5" stroke="#4F46E5" strokeWidth="2" />

      {/* Windows */}
      <rect x="12" y="34" width="4" height="6" rx="1" fill="#94A3B8" />
      <rect x="12" y="44" width="4" height="6" rx="1" fill="#94A3B8" />
      <rect x="48" y="34" width="4" height="6" rx="1" fill="#94A3B8" />
      <rect x="48" y="44" width="4" height="6" rx="1" fill="#94A3B8" />
      <rect x="24" y="32" width="4" height="5" rx="1" fill="#94A3B8" />
      <rect x="36" y="32" width="4" height="5" rx="1" fill="#94A3B8" />
    </svg>
  );
}

// 2. Academic Year: Graduation cap resting on a calendar
export function AcademicYearIllustration({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar Base */}
      <rect x="10" y="16" width="44" height="38" rx="4" fill="#EEF2FF" stroke="#94A3B8" strokeWidth="2" />
      <rect x="10" y="16" width="44" height="10" rx="2" fill="#94A3B8" />
      
      {/* Calendar Binder Rings */}
      <rect x="18" y="10" width="4" height="8" rx="2" fill="#4F46E5" />
      <rect x="42" y="10" width="4" height="8" rx="2" fill="#4F46E5" />

      {/* Grid Lines */}
      <line x1="16" y1="34" x2="20" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="34" x2="30" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="34" x2="40" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="34" x2="48" y2="34" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="42" x2="20" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="42" x2="30" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="42" x2="40" y2="42" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="42" x2="48" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

      {/* Graduation Cap overlapping */}
      <path d="M26 34L44 26L62 34L44 42L26 34Z" fill="#4F46E5" stroke="#4F46E5" strokeWidth="1.5" />
      <path d="M38 37V45C38 47 41 49 44 49C47 49 50 47 50 45V37" fill="#4F46E5" stroke="#4F46E5" strokeWidth="1.5" />
      
      {/* Tassel */}
      <path d="M44 34L56 39.5V45" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="56" cy="45" r="1.5" fill="#94A3B8" />
    </svg>
  );
}

// 3. Fee Structure: Piggy bank and falling coins
export function FeeStructureIllustration({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Piggy Body */}
      <path
        d="M38 18C47.3888 18 55 24.7157 55 33C55 41.2843 47.3888 48 38 48C36.657 48 35.3477 47.8631 34.0954 47.6033C32.4839 49.6865 30.0887 51 27.5 51C25.6881 51 24.0326 50.3601 22.8021 49.3361C20.672 49.7712 18.4357 50 16 50C13.2386 50 11 47.7614 11 45C11 44.5204 11.0673 44.0565 11.1925 43.6186C9.25597 41.0118 8 37.3861 8 33.3333C8 25.1303 14.8697 18.5 23.3333 18.5C24.5807 18.5 25.8016 18.6534 26.9749 18.9419C29.7423 18.3308 33.6806 18 38 18Z"
        fill="#EEF2FF"
        stroke="#4F46E5"
        strokeWidth="2"
      />

      {/* Piggy Legs */}
      <rect x="22" y="47" width="5" height="7" rx="2" fill="#4F46E5" />
      <rect x="36" y="47" width="5" height="7" rx="2" fill="#4F46E5" />

      {/* Snout */}
      <ellipse cx="7" cy="33" rx="3" ry="5" fill="#94A3B8" stroke="#94A3B8" strokeWidth="1.5" />

      {/* Eye */}
      <circle cx="20" cy="27" r="2" fill="#4F46E5" />

      {/* Ear */}
      <polygon points="28,19 23,10 33,14" fill="#4F46E5" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Coin Slot */}
      <rect x="34" y="24" width="8" height="2.5" rx="1" transform="rotate(-15 34 24)" fill="#94A3B8" />

      {/* Falling Coins */}
      <circle cx="38" cy="8" r="4.5" fill="#FFF" stroke="#4F46E5" strokeWidth="1.5" />
      <line x1="38" y1="5.5" x2="38" y2="10.5" stroke="#4F46E5" strokeWidth="1" />
      <line x1="35.5" y1="8" x2="40.5" y2="8" stroke="#4F46E5" strokeWidth="1" />

      <circle cx="48" cy="14" r="4.5" fill="#FFF" stroke="#94A3B8" strokeWidth="1.5" />
      <line x1="48" y1="11.5" x2="48" y2="16.5" stroke="#94A3B8" strokeWidth="1" />
      <line x1="45.5" y1="14" x2="50.5" y2="14" stroke="#94A3B8" strokeWidth="1" />
    </svg>
  );
}

// 4. Receipt Settings: Receipt/invoice with gear settings wheel
export function ReceiptSettingsIllustration({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Receipt Page */}
      <path
        d="M14 8H42L50 16V52L46 56L40 52L34 56L28 52L22 56L16 52L10 56V12L14 8Z"
        fill="#EEF2FF"
        stroke="#4F46E5"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Header lines */}
      <line x1="18" y1="18" x2="34" y2="18" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="24" x2="28" y2="24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

      {/* Receipt Items */}
      <line x1="18" y1="32" x2="38" y2="32" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" />
      <line x1="18" y1="38" x2="38" y2="38" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 2" />
      
      {/* Seal Circle (Receipt verified stamp) */}
      <circle cx="40" cy="42" r="7" fill="#FFF" stroke="#94A3B8" strokeWidth="2" />
      <path d="M37 42L39 44L43 40" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 5. WhatsApp Reminders: Chat bubble with small notification bell overlay
export function WhatsAppRemindersIllustration({ className = "h-16 w-16" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Chat Bubble */}
      <path
        d="M10 32C10 19.8497 19.8497 10 32 10C44.1503 10 54 19.8497 54 32C54 44.1503 44.1503 54 32 54C28.1887 54 24.5824 53.0335 21.4312 51.3283L11 53L13.1365 43.1492C11.1685 39.847 10 36.0526 10 32Z"
        fill="#EEF2FF"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Foreground Notification Bell */}
      <g transform="translate(18, 16)">
        {/* Bell Body */}
        <path
          d="M14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6V12C6 14.5 4 16.5 4 18H16C16 16.5 14 14.5 14 12V6Z"
          fill="#4F46E5"
          stroke="#4F46E5"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Bell clapper */}
        <path d="M8 21C8 22.1046 8.89543 23 10 23C11.1046 23 12 22.1046 12 21" fill="#4F46E5" stroke="#4F46E5" strokeWidth="1.5" />
        
        {/* Little sound lines */}
        <path d="M1 9C1.5 7 2.5 5 4 4.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 9C18.5 7 17.5 5 16 4.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 6. Empty State Illustration: Reassuring checkmark list
export function EmptyStateIllustration({ className = "h-20 w-20" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard */}
      <rect x="22" y="16" width="36" height="48" rx="4" fill="#EEF2FF" stroke="#94A3B8" strokeWidth="2" />
      
      {/* Clipboard Clip */}
      <path d="M34 16V13C34 11.8954 34.8954 11 36 11H44C45.1046 11 46 11.8954 46 13V16H34Z" fill="#94A3B8" stroke="#94A3B8" strokeWidth="1.5" />

      {/* Done Checkmarks and Lines */}
      <g transform="translate(28, 24)">
        {/* Row 1 */}
        <circle cx="4" cy="5" r="3.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.5" />
        <path d="M2.5 5L3.5 6L5.5 4" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="5" x2="22" y2="5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

        {/* Row 2 */}
        <circle cx="4" cy="17" r="3.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.5" />
        <path d="M2.5 17L3.5 18L5.5 16" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="20" y2="17" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

        {/* Row 3 */}
        <circle cx="4" cy="29" r="3.5" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="1.5" />
        <path d="M2.5 29L3.5 30L5.5 28" stroke="#4F46E5" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="29" x2="24" y2="29" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
