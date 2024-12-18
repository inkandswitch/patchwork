interface Props {
    clearGrid: () => void;
}

export const ClearGrid = ({
    clearGrid,
}: Props) => {
    return (
        <button className="button clear-button" onClick={clearGrid}>Clear</button>
    );
}
