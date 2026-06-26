import { useState, useEffect, useRef } from "react";

export function useHindiInput({ value, onChange, enabled = true }) {
  const [isHindiMode, setIsHindiMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeWord, setActiveWord] = useState("");
  const [wordStartIdx, setWordStartIdx] = useState(-1);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const textareaRef = useRef(null);

  // Extract the English word at the current cursor position
  const updateActiveWord = (text, cursorPos) => {
    if (!isHindiMode || !enabled) {
      setActiveWord("");
      setSuggestions([]);
      return;
    }

    const textBeforeCursor = text.slice(0, cursorPos);
    // Matches the trailing English alphabetic characters
    const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
    if (match) {
      const word = match[1];
      setActiveWord(word);
      setWordStartIdx(textBeforeCursor.length - word.length);
    } else {
      setActiveWord("");
      setSuggestions([]);
    }
  };

  // Fetch suggestions when activeWord changes
  useEffect(() => {
    if (!activeWord || !isHindiMode || !enabled) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://inputtools.google.com/request?text=${encodeURIComponent(
            activeWord
          )}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`
        );
        if (res.ok) {
          const data = await res.json();
          if (
            data &&
            data[0] === "SUCCESS" &&
            data[1] &&
            data[1][0] &&
            data[1][0][1]
          ) {
            const list = data[1][0][1];
            // Put the original English word as the last option
            setSuggestions([...list, activeWord]);
            setHighlightIdx(0);
          }
        }
      } catch (err) {
        console.error("Transliteration API failed", err);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [activeWord, isHindiMode, enabled]);

  const selectSuggestion = (selectedWord, appendChar = "") => {
    if (wordStartIdx < 0 || !textareaRef.current) return;
    const text = value;
    const cursorPos = textareaRef.current.selectionStart;

    const before = text.slice(0, wordStartIdx);
    const after = text.slice(cursorPos);

    const replacement = selectedWord + appendChar;
    const newValue = before + replacement + after;
    onChange(newValue);

    setSuggestions([]);
    setActiveWord("");

    // Restore cursor position right after the replaced word
    requestAnimationFrame(() => {
      const newPos = before.length + replacement.length;
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (!isHindiMode || !enabled || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((idx) => (idx + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((idx) => (idx - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === " " || e.key === "Enter") {
      // Intercept space/enter to auto-replace with highlighted suggestion
      e.preventDefault();
      const selected = suggestions[highlightIdx] || suggestions[0];
      selectSuggestion(selected, e.key === " " ? " " : "\n");
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveWord("");
    }
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);
    const cursorPos = e.target.selectionStart;
    updateActiveWord(newVal, cursorPos);
  };

  const handleSelect = (e) => {
    const cursorPos = e.target.selectionStart;
    updateActiveWord(e.target.value, cursorPos);
  };

  return {
    textareaRef,
    isHindiMode,
    setIsHindiMode,
    suggestions,
    highlightIdx,
    setHighlightIdx,
    handleTextareaChange: handleChange,
    handleTextareaSelect: handleSelect,
    handleKeyDown,
    selectSuggestion,
  };
}
