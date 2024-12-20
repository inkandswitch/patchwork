import { useCallback, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import create from "zustand";
import dirt from "./assets/dirt.jpg?url";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Doc } from "./datatype";
import { ThreeEvent } from "@react-three/fiber";

// This is a naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

export const Cubes = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const addCube = (x: number, y: number, z: number) =>
    changeDoc((doc) => doc.cubes.push([x, y, z]));

  console.log({ doc, docUrl, addCube });

  if (!doc) {
    return null;
  }

  const cubes = doc.cubes || [];
  return cubes.map((coords, index) => (
    <Cube key={index} addCube={addCube} position={coords} />
  ));
};

interface CubeProps {
  addCube: (x: number, y: number, z: number) => void;
  position: [number, number, number];
}

export function Cube({ addCube, ...props }: CubeProps) {
  const ref = useRef();
  const [hover, set] = useState(null);

  const texture = useTexture(dirt);
  const onMove = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    set(Math.floor(e.faceIndex / 2));
  }, []);
  const onOut = useCallback(() => set(null), []);
  const onClick = useCallback((e) => {
    e.stopPropagation();
    const { x, y, z } = ref.current.translation();
    const dir = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
    addCube(...dir[Math.floor(e.faceIndex / 2)]);
  }, []);
  return (
    <RigidBody {...props} type="fixed" colliders="cuboid" ref={ref}>
      <mesh
        receiveShadow
        castShadow
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      >
        {[...Array(6)].map((_, index) => (
          <meshStandardMaterial
            attach={`material-${index}`}
            key={index}
            map={texture}
            color={hover === index ? "hotpink" : "white"}
          />
        ))}
        <boxGeometry />
      </mesh>
    </RigidBody>
  );
}
