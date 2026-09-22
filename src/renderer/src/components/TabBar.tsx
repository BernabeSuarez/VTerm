import { useEffect, useRef, useState } from "react";
import icon from "../assets/icon.png";

interface Tab {
  id: string;
  title: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  onOpenThemes: () => void;
  onOpenProfiles: () => void;
  onOpenShortcuts: () => void;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  onOpenThemes,
  onOpenProfiles,
  onOpenShortcuts,
}: TabBarProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cierra el menú con un click afuera o con Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = (action: () => void): void => {
    setMenuOpen(false);
    action();
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar__brand" title="Terminal">
        <img src={icon} alt="Terminal" draggable={false} />
      </div>
      <div className="tab-bar__tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeId ? "tab--active" : ""}`}
            onClick={() => onSelect(tab.id)}
          >
            <span className="tab__title">{tab.title}</span>
            {tabs.length > 1 && (
              <button
                className="tab__close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                aria-label="Cerrar pestaña"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          className="tab-bar__new"
          onClick={onNew}
          aria-label="Nueva pestaña"
        >
          +
        </button>
      </div>
      <div className="tab-bar__menu" ref={menuRef}>
        <button
          className="tab-bar__menu-trigger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Más opciones"
          title="Más opciones"
        >
          ⋯
        </button>
        {menuOpen && (
          <div className="tab-bar__dropdown" role="menu">
            <button role="menuitem" onClick={() => closeMenu(onOpenProfiles)}>
              Shell
            </button>
            <button role="menuitem" onClick={() => closeMenu(onOpenThemes)}>
              Cambiar Tema
            </button>
            <button role="menuitem" onClick={() => closeMenu(onOpenShortcuts)}>
              Atajos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}