import * as THREE from "../build/three.module.js";

let camera, scene, renderer;

let isUserInteracting = false,
  onPointerDownMouseX = 0,
  onPointerDownMouseY = 0,
  lon = 0,
  onPointerDownLon = 0,
  lat = 0,
  onPointerDownLat = 0,
  phi = 0,
  theta = 0;

init();
animate();

function init() {
  const container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1100
  );

  scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(500, 60, 40);
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry.scale(-1, 1, 1);

  const urlParams = new URLSearchParams(window.location.search);
  const panoParam = urlParams.get("pano");
  let pano;
  if (panoParam) {
    pano = `textures/${panoParam}`;
    console.log(`Retrieved ${panoParam}`);
  } else {
    pano = "textures/2294472375_24a3b8ef46_o.jpg";
    console.log("No pano query param provided; setting default.");
  }

  const texture = new THREE.TextureLoader().load(pano);
  const material = new THREE.MeshBasicMaterial({ map: texture });

  const mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  container.style.touchAction = "pinch-zoom";
  container.addEventListener("pointerdown", onPointerDown);

  document.addEventListener("wheel", onDocumentMouseWheel);

  //

  document.addEventListener("dragover", function (event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  document.addEventListener("dragenter", function () {
    document.body.style.opacity = 0.5;
  });

  document.addEventListener("dragleave", function () {
    document.body.style.opacity = 1;
  });

  document.addEventListener("drop", function (event) {
    event.preventDefault();

    if (event.dataTransfer.files[0].type === "image/jpeg") {
      let shouldSwitch = confirm(
        `Switch image to ${event.dataTransfer.files[0].name}?`
      );

      if (shouldSwitch) {
        const reader = new FileReader();
        reader.addEventListener("load", function (event) {
          material.map.image.src = event.target.result;
          material.map.needsUpdate = true;
        });
        reader.readAsDataURL(event.dataTransfer.files[0]);
      }

      document.body.style.opacity = 1;
    } else {
      alert("Only .JPG files can be added to the viewer.");
    }
  });

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  isUserInteracting = true;

  onPointerDownMouseX = event.clientX;
  onPointerDownMouseY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  lon = (onPointerDownMouseX - event.clientX) * 0.1 + onPointerDownLon;
  lat = (event.clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
}

function onPointerUp() {
  if (event.isPrimary === false) return;

  isUserInteracting = false;

  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

function onDocumentMouseWheel(event) {
  const fov = camera.fov + event.deltaY * 0.05;

  camera.fov = THREE.MathUtils.clamp(fov, 10, 75);

  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  update();
}

function update() {
  if (isUserInteracting === false) {
    // lon += 0.1;  // slowly rotate
  }

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  const x = 500 * Math.sin(phi) * Math.cos(theta);
  const y = 500 * Math.cos(phi);
  const z = 500 * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(x, y, z);

  renderer.render(scene, camera);
}
