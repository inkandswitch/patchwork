import { type AutomergeUrl } from "@automerge/automerge-repo";
import { Canvas } from "@react-three/fiber";
import { Sky, PointerLockControls, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { createXRStore, XR } from "@react-three/xr";

import { Ground } from "./Ground";
import { Player } from "./Player";
import { Cubes } from "./Cube";

export default function Scene({ docUrl }: { docUrl: AutomergeUrl }) {
  const store = createXRStore();

  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "jump", keys: ["Space"] },
        ]}
      >
        <Canvas shadows camera={{ fov: 45 }}>
          <XR store={store}>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.3} />
            <pointLight castShadow intensity={0.8} position={[100, 100, 100]} />
            <Physics gravity={[0, -30, 0]}>
              <Ground />
              <Player />
              <Cubes docUrl={docUrl} />
            </Physics>
            <PointerLockControls />
          </XR>
        </Canvas>
      </KeyboardControls>
    </>
  );
}
