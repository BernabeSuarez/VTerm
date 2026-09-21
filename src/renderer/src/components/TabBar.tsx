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
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  onOpenThemes,
}: TabBarProps): JSX.Element {
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
      <button className="tab-bar__themes" onClick={onOpenThemes}>
        Cambiar Tema
      </button>
    </div>
  );
}
