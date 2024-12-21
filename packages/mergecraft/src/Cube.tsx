import { useCallback, useRef, useState } from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

import { ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";

import { Doc } from "./datatype";

import dirt from "./assets/dirt.jpg?url";

// This is a naive implementation and wouldn't allow for more than a few thousand boxes.
// In order to make this scale this has to be one instanced mesh, then it could easily be
// hundreds of thousands.

export const Cubes = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const addCube = (x: number, y: number, z: number) =>
    changeDoc((doc) => doc.cubes.push([x, y, z]));
  const removeCube = (x: number, y: number, z: number) =>
    changeDoc((doc) => {
      const index = doc.cubes.findIndex(
        (coords) => coords[0] === x && coords[1] === y && coords[2] === z
      );
      if (index !== -1) {
        doc.cubes.splice(index, 1);
      }
    });

  if (!doc) {
    return null;
  }

  const cubes = doc.cubes || [];
  return cubes.map((coords, index) => (
    <Cube
      key={index}
      addCube={addCube}
      removeCube={removeCube}
      position={coords}
    />
  ));
};

interface CubeProps {
  addCube: (x: number, y: number, z: number) => void;
  removeCube: (x: number, y: number, z: number) => void;
  position: [number, number, number];
}

export function Cube({ addCube, removeCube, ...props }: CubeProps) {
  const ref = useRef<RapierRigidBody>(null);
  const [hover, setHover] = useState<number | undefined>(undefined);

  const texture = useTexture(dirt);
  const onMove = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!e.faceIndex) return;
    setHover(Math.floor(e.faceIndex / 2));
  }, []);
  const onOut = useCallback(() => setHover(undefined), []);
  const onClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!e.faceIndex || !ref.current) return;
    const { x, y, z } = ref.current.translation();

    if (e.button === 2) {
      removeCube(x, y, z);
      return;
    }

    const dir: [number, number, number][] = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
    const faceIndex = Math.floor(e.faceIndex / 2);
    const adjacentCubeCoordinates = dir[faceIndex];
    addCube(...adjacentCubeCoordinates);
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
