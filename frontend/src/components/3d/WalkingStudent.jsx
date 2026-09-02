import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export default function WalkingStudent({ modelUrl = null }) {
  return (
    <div className="walking-student-container flex items-center justify-center">
      <img 
        src="/stud.png" 
        alt="Walking Student" 
        className="w-full h-full object-contain"
        style={{ maxHeight: '200px' }}
      />
    </div>
  );
}
