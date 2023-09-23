import { OrbitControls, Sphere } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Color, Group, Object3DEventMap, Vector3 } from "three";
import { pointsInner, pointsOuter } from "./util";
import GUI from "lil-gui";

export default function TheadLanding() {
  const [lightPower, setLightPower] = useState(10); // initial power value

  useEffect(() => {
    const gui = new GUI();
    gui
      .add({ power: lightPower }, "power", 0, 100)
      .onChange((value) => setLightPower(value));
    return () => gui.destroy();
  }, [lightPower]);

  return (
    <div className="relative h-[100vh] w-[100vw">
      <Canvas className="bg-[#101010]">
        <OrbitControls maxDistance={20} minDistance={20} />
        <directionalLight />
        <pointLight position={[0, 0, 0]} power={lightPower} />
        <PointCircleGroup />
      </Canvas>
    </div>
  );
}

const PointCircleGroup = () => {
  const pointCircleRef = useRef<Group<Object3DEventMap>>(null);
  const time = useRef<number>(0);
  const { aspect } = useThree(({ viewport }) => viewport);
  const [isFirstRender, setIsFirstrender] = useState(true);
  const shader: THREE.Shader = {
    uniforms: {
      u_time: { value: time },
      u_aspect: { value: aspect },
    },
    vertexShader,
    fragmentShader,
  };

  useFrame(({ clock }) => {
    if (pointCircleRef.current) {
      pointCircleRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
    if (isFirstRender) {
      setIsFirstrender(false); //trigger re-render lol
    }
    shader.uniforms.u_time.value = clock.getElapsedTime();
    // console.log(shader.uniforms.u_time.value);
    time.current = clock.getElapsedTime();
  });

  return (
    <group ref={pointCircleRef}>
      <axesHelper args={[10]} />
      {pointsInner.map((point) => (
        <PointCircle
          key={point.idx}
          position={point.position}
          color={point.color}
          shader={shader}
        />
      ))}
      {pointsOuter.map((point) => (
        <PointCircle
          key={point.idx}
          position={point.position}
          color={point.color}
          shader={shader}
        />
      ))}
    </group>
  );
};

const PointCircle = ({
  position,
  color,
  shader,
}: {
  color: Color | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  position: Vector3 | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shader: any;
}) => {
  // useFrame(({ clock }) => {
  //   shader.uniforms.u_time.value = clock.getElapsedTime();
  //   // console.log(clock.elapsedTime);
  // });
  console.log("re-renderr");
  return (
    <Sphere position={position} args={[0.3, 10, 10]}>
      <shaderMaterial args={[shader]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        roughness={0.5}
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};

const vertexShader = `
varying vec2 v_uv;
uniform float u_aspect;


void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
uniform float u_time;
// uniform vec2 u_mouse;
varying vec2 v_uv;
uniform sampler2D u_texture;

const vec3 black = vec3(.3);
const vec3 silver = vec3(0.15);


void main() {
  vec4 tex = vec4(0.5,0.5,0.5,0.5);
  // vec4 tex = texture2D(u_texture, v_uv);


  vec2 uv = v_uv;

  //Modify any value to make adjustment to the background texture
  for(float i = 1.0; i < 8.0; i++){
    uv.y += i * 0.075/ i * 
      sin(uv.x * i * i + u_time*3. ) * sin(uv.y * i * i + u_time*3. );
  }
    
  vec3 col;
  col.r = uv.y +(sin(u_time) + 1.0) / 2.0;
  col.g = uv.y +(sin(u_time + 2.0) + 1.0) / 2.0;
  col.b = uv.y +(sin(u_time + 4.0) + 1.0) / 2.0;
   
  tex *=abs(uv.y);
    
    gl_FragColor = vec4(col,1.);
}
`;
