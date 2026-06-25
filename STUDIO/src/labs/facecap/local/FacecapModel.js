import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ASSET_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/facecap.glb';

export async function createFacecapModel(scene, renderer) {
  const ktx2Loader = new KTX2Loader()
    .setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/')
    .detectSupport(renderer);

  const loader = new GLTFLoader();
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);

  return new Promise((resolve, reject) => {
    loader.load(ASSET_URL, (gltf) => {
      const mesh = gltf.scene.children[0];
      // Configure mesh properties
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      
      // Standardize the model orientation and scale based on the original CodePen
      mesh.scale.setScalar(0.62); // FACE_FILL equivalent scaling logic can be handled dynamically, but keeping static scale for simplicity initially
      
      scene.add(mesh);

      // We need the morph target dictionary to map MediaPipe names to GLTF morph targets
      const head = mesh.getObjectByName('mesh_2');
      const dictionary = head?.morphTargetDictionary || {};

      function update(blendshapes, transformMatrix) {
        if (!head || !blendshapes || !transformMatrix) return;

        // Apply blendshapes
        for (const blendshape of blendshapes) {
          const categoryName = blendshape.categoryName;
          const score = blendshape.score;
          // Typical mapping where MediaPipe produces camelCase and the mesh might have specific names, 
          // but mrdoob's facecap.glb matches MediaPipe output perfectly if we just use the name
          const index = dictionary[categoryName];
          if (index !== undefined) {
            head.morphTargetInfluences[index] = score;
          }
        }

        // Apply transformation matrix (head pose)
        mesh.matrix.fromArray(transformMatrix);
        mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
        
        // Ensure scale is maintained (MediaPipe matrix scale might be strange)
        mesh.scale.setScalar(0.62); 
      }

      function dispose() {
        scene.remove(mesh);
        // Note: Full disposal omitted for brevity, but should traverse and dispose geometry/materials
      }

      resolve({
        mesh,
        update,
        dispose
      });
    }, undefined, reject);
  });
}
