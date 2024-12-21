import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import {
  CapsuleCollider,
  RigidBody,
  RapierRigidBody,
  useRapier,
} from "@react-three/rapier";
import * as RAPIER from "@dimforge/rapier3d-compat";

import { Model as Axe } from "./Axe";

const SPEED = 5;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const rotation = new THREE.Vector3();

export function Player({ lerp = THREE.MathUtils.lerp }) {
  const axe = useRef<THREE.Group>(null);
  const ref = useRef<RapierRigidBody>(null);
  const rapier = useRapier();
  const [, get] = useKeyboardControls();
  useFrame((state) => {
    if (!ref.current || !axe.current) {
      throw new Error("Player or axe ref is not defined");
    }

    const { forward, backward, left, right, jump } = get();
    const lv = ref.current.linvel();
    const length = new THREE.Vector3(lv.x, lv.y, lv.z).length();

    // update camera
    const xlation = ref.current.translation();
    state.camera.position.set(xlation.x, xlation.y, xlation.z);
    // update axe
    axe.current.children[0].rotation.x = lerp(
      axe.current.children[0].rotation.x,
      Math.sin((length > 1 ? 1 : 0) * state.clock.elapsedTime * 10) / 6,
      0.1
    );
    axe.current.rotation.copy(state.camera.rotation);
    axe.current.position
      .copy(state.camera.position)
      .add(state.camera.getWorldDirection(rotation).multiplyScalar(1));
    // movement
    frontVector.set(0, 0, +backward - +forward);
    sideVector.set(+left - +right, 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(state.camera.rotation);
    ref.current.setLinvel({ x: direction.x, y: lv.y, z: direction.z }, true);
    // jumping
    const world = rapier.world;
    const result = world.castRay(
      new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 }),
      100, // maxtoi
      true // solid
    );
    const grounded = result && result.collider && result.timeOfImpact <= 1.75;
    if (jump && grounded) ref.current.setLinvel({ x: 0, y: 7.5, z: 0 }, true);
  });
  return (
    <>
      <RigidBody
        ref={ref}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 10, 0]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>
      <group
        ref={axe}
        onPointerMissed={(e) =>
          axe.current && (axe.current.children[0].rotation.x = -0.5)
        }
      >
        <Axe position={[0.3, -0.35, 0.5]} />
      </group>
    </>
  );
}
