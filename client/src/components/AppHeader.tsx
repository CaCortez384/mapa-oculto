interface AppHeaderProps {
    storyCount: number;
}

export const AppHeader = ({ storyCount }: AppHeaderProps) => {
    return (
        <div className="app-title-container">
            <h1 className="app-title-text">MAPA OCULTO</h1>
            <div className="app-title-counter">
                <div className="app-title-dot"></div>
                <p className="app-title-count">
                    {storyCount} secretos revelados
                </p>
            </div>
        </div>
    );
};
