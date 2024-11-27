import { Progress } from "@patchwork/sdk/ui/progress";
import { useEffect, useState } from "react";

// A very rough and naive loading screen.
// It just assumes things load in ~1 second and shows a progress bar.
// Typically Automerge blocks the UI thread while it's loading though,
// so we don't get smooth progress or anything, the bar just
// shows empty and then the doc loads.

export const LoadingScreen = ({ what }: { what?: string }) => {
  const [loadProgress, setLoadProgress] = useState(0);
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadProgress((prevProgress) => Math.min(prevProgress + 10, 100));
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  });

  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
      <div>
        <div className="text-sm mb-4 font-light">
          Loading{what ? " " + what : ""}...
        </div>
        <Progress
          color="blue"
          value={loadProgress}
          className="w-96 border bg-gray-50 h-2"
        />
      </div>
    </div>
  );
};
