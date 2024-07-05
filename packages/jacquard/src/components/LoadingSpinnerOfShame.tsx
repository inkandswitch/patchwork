export const LoadingSpinnerOfShame = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100vh",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "100px",
          height: "100px",
          animation: "spin 2s linear infinite",
        }}
      >
        <defs>
          <path
            id="circlePath"
            d="M 50, 50
                m -37, 0
                a 37,37 0 1,1 74,0
                a 37,37 0 1,1 -74,0"
          />
        </defs>
        <text>
          <textPath href="#circlePath" startOffset="0%">
            shame
          </textPath>
          <textPath href="#circlePath" startOffset="50%">
            shame
          </textPath>
        </text>
      </svg>
      <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
    </div>
  );
};

export default LoadingSpinnerOfShame;
