"use client";
import { useEffect, useRef } from "react";
import { RemoveScroll } from "react-remove-scroll";

interface UseClickOutsideModalOptions {
  onClose: () => void;
  isOpen: boolean;
}

export function useClickOutsideModal({
  isOpen,
  onClose,
}: UseClickOutsideModalOptions) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const ModalWrapper: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    if (!isOpen) return null;

    return <RemoveScroll>{children}</RemoveScroll>;
  };

  return {
    modalRef,
    ModalWrapper,
  };
}
