class SolarSystem {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.planets = [];
    this.sun = null;
    this.isPaused = false;
    this.clock = new THREE.Clock();
    this.globalSpeedMultiplier = 1;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // Planet data with realistic relative properties
    this.planetData = [
      {
        name: "Mercury",
        size: 0.38,
        distance: 8,
        speed: 4.74,
        color: 0x8c7853,
        info: "Closest planet to the Sun",
      },
      {
        name: "Venus",
        size: 0.95,
        distance: 12,
        speed: 3.5,
        color: 0xffc649,
        info: "Hottest planet in our solar system",
      },
      {
        name: "Earth",
        size: 1,
        distance: 16,
        speed: 2.98,
        color: 0x6b93d6,
        info: "Our home planet",
      },
      {
        name: "Mars",
        size: 0.53,
        distance: 20,
        speed: 2.41,
        color: 0xc1440e,
        info: "The Red Planet",
      },
      {
        name: "Jupiter",
        size: 2.5,
        distance: 28,
        speed: 1.31,
        color: 0xd8ca9d,
        info: "Largest planet in our solar system",
      },
      {
        name: "Saturn",
        size: 2.1,
        distance: 36,
        speed: 0.97,
        color: 0xfad5a5,
        info: "Famous for its prominent rings",
      },
      {
        name: "Uranus",
        size: 1.6,
        distance: 44,
        speed: 0.68,
        color: 0x4fd0e7,
        info: "Tilted on its side",
      },
      {
        name: "Neptune",
        size: 1.5,
        distance: 52,
        speed: 0.54,
        color: 0x4b70dd,
        info: "Windiest planet",
      },
    ];

    this.init();
  }

  init() {
    this.createScene();
    this.createLights();
    this.createSun();
    this.createPlanets();
    this.createStars();
    this.createControls();
    this.setupEventListeners();
    this.animate();

    // Hide loading screen with fade effect
    setTimeout(() => {
      const loading = document.getElementById("loading");
      loading.style.opacity = "0";
      loading.style.transition = "opacity 0.5s ease";
      setTimeout(() => {
        loading.style.display = "none";
      }, 500);
    }, 1000);
  }

  createScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 100, 300);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 60);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    document
      .getElementById("canvas-container")
      .appendChild(this.renderer.domElement);
  }

  createLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.15);
    this.scene.add(ambientLight);

    // Point light from the sun
    this.sunLight = new THREE.PointLight(0xffffff, 2.5, 300);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.1;
    this.sunLight.shadow.camera.far = 300;
    this.scene.add(this.sunLight);

    // Additional rim lighting
    const rimLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    rimLight.position.set(0, 50, 50);
    this.scene.add(rimLight);
  }

  createSun() {
    const sunGeometry = new THREE.SphereGeometry(3, 64, 64);

    // Create glowing sun material
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      emissive: 0xfdb813,
      emissiveIntensity: 0.4,
    });

    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.userData = {
      name: "Sun",
      type: "sun",
      info: "The star at the center of our solar system",
    };

    // Add sun corona effect
    const coronaGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
      color: 0xfdb813,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    this.sun.add(corona);

    this.scene.add(this.sun);
  }

  createPlanets() {
    this.planetData.forEach((data, index) => {
      const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
      const planetMaterial = new THREE.MeshLambertMaterial({
        color: data.color,
        shininess: 30,
      });

      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.position.x = data.distance;
      planet.castShadow = true;
      planet.receiveShadow = true;

      // Create orbit line
      const orbitGeometry = new THREE.RingGeometry(
        data.distance - 0.05,
        data.distance + 0.05,
        128
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      this.scene.add(orbit);

      // Add subtle glow effect for gas giants
      if (
        data.name === "Jupiter" ||
        data.name === "Saturn" ||
        data.name === "Uranus" ||
        data.name === "Neptune"
      ) {
        const glowGeometry = new THREE.SphereGeometry(data.size * 1.1, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: data.color,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planet.add(glow);
      }

      // Store planet data
      planet.userData = {
        name: data.name,
        type: "planet",
        distance: data.distance,
        baseSpeed: data.speed,
        currentSpeed: data.speed,
        angle: Math.random() * Math.PI * 2,
        size: data.size,
        info: data.info,
        rotationSpeed: 0.01 + Math.random() * 0.02,
      };

      this.planets.push(planet);
      this.scene.add(planet);
    });
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      // Create stars in a sphere around the solar system
      const radius = 200 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random star colors (white to blue-white)
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.1, 0.2, 0.8 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  createControls() {
    const controlsContainer = document.getElementById("planet-controls");

    this.planets.forEach((planet, index) => {
      const controlGroup = document.createElement("div");
      controlGroup.className = "control-group";

      const label = document.createElement("label");
      label.textContent = planet.userData.name;
      label.className = `planet-${planet.userData.name.toLowerCase()}`;

      const speedControl = document.createElement("div");
      speedControl.className = "speed-control";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.className = "speed-slider";
      slider.min = "0";
      slider.max = "10";
      slider.step = "0.1";
      slider.value = planet.userData.baseSpeed;
      slider.id = `speed-${index}`;

      const valueDisplay = document.createElement("span");
      valueDisplay.className = "speed-value";
      valueDisplay.textContent = planet.userData.baseSpeed.toFixed(1) + "x";
      valueDisplay.id = `speed-value-${index}`;

      slider.addEventListener("input", (e) => {
        const newSpeed = parseFloat(e.target.value);
        planet.userData.currentSpeed = newSpeed;
        valueDisplay.textContent = newSpeed.toFixed(1) + "x";
      });

      speedControl.appendChild(slider);
      speedControl.appendChild(valueDisplay);
      controlGroup.appendChild(label);
      controlGroup.appendChild(speedControl);
      controlsContainer.appendChild(controlGroup);
    });
  }

  setupEventListeners() {
    // Pause/Resume button
    document.getElementById("pause-btn").addEventListener("click", () => {
      this.isPaused = !this.isPaused;
      const btn = document.getElementById("pause-btn");
      btn.textContent = this.isPaused ? "Resume" : "Pause";
      btn.className = this.isPaused ? "btn pause" : "btn";
    });

    // Reset button
    document.getElementById("reset-btn").addEventListener("click", () => {
      this.resetPlanets();
    });

    // Global speed control
    document.getElementById("global-speed").addEventListener("input", (e) => {
      this.globalSpeedMultiplier = parseFloat(e.target.value);
      document.getElementById("global-speed-value").textContent =
        this.globalSpeedMultiplier.toFixed(1) + "x";
    });

    // Mouse events for planet info
    this.renderer.domElement.addEventListener("mousemove", (event) => {
      this.onMouseMove(event);
    });

    // Window resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.setupCameraControls();
  }

  setupCameraControls() {
    let isMouseDown = false;
    let mouseX = 0,
      mouseY = 0;
    let cameraDistance = this.camera.position.length();

    this.renderer.domElement.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        // Left mouse button
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        this.renderer.domElement.style.cursor = "grabbing";
      }
    });

    document.addEventListener("mouseup", () => {
      isMouseDown = false;
      this.renderer.domElement.style.cursor = "grab";
    });

    this.renderer.domElement.addEventListener("mousemove", (event) => {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        // Rotate camera around the scene
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);

        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    });

    // Zoom with mouse wheel
    this.renderer.domElement.addEventListener("wheel", (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;

      cameraDistance *= 1 + direction * zoomSpeed;
      cameraDistance = Math.max(15, Math.min(250, cameraDistance));

      this.camera.position.normalize().multiplyScalar(cameraDistance);
    });

    // Touch controls for mobile
    let touchStartX = 0,
      touchStartY = 0;
    let isTouching = false;

    this.renderer.domElement.addEventListener("touchstart", (event) => {
      if (event.touches.length === 1) {
        isTouching = true;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    });

    this.renderer.domElement.addEventListener("touchmove", (event) => {
      if (isTouching && event.touches.length === 1) {
        event.preventDefault();
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);

        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    });

    this.renderer.domElement.addEventListener("touchend", () => {
      isTouching = false;
    });

    this.renderer.domElement.style.cursor = "grab";
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([
      ...this.planets,
      this.sun,
    ]);

    const planetInfo = document.getElementById("planet-info");

    if (intersects.length > 0) {
      const object = intersects[0].object;
      const userData = object.userData;

      if (userData.type === "planet" || userData.type === "sun") {
        planetInfo.style.display = "block";
        planetInfo.style.left =
          Math.min(event.clientX + 15, window.innerWidth - 200) + "px";
        planetInfo.style.top =
          Math.min(event.clientY + 15, window.innerHeight - 100) + "px";

        if (userData.type === "sun") {
          planetInfo.innerHTML = `
                        <strong>${userData.name}</strong><br>
                        <em>${userData.info}</em><br>
                        Type: G-type main-sequence star<br>
                        Temperature: ~5,778 K
                    `;
        } else {
          planetInfo.innerHTML = `
                        <strong>${userData.name}</strong><br>
                        <em>${userData.info}</em><br>
                        Distance: ${userData.distance} AU<br>
                        Speed: ${userData.currentSpeed.toFixed(1)}x<br>
                        Relative Size: ${userData.size.toFixed(1)}x Earth
                    `;
        }
      }
    } else {
      planetInfo.style.display = "none";
    }
  }

  resetPlanets() {
    this.planets.forEach((planet, index) => {
      planet.userData.angle = Math.random() * Math.PI * 2;
      planet.userData.currentSpeed = planet.userData.baseSpeed;

      // Reset sliders
      const slider = document.getElementById(`speed-${index}`);
      const valueDisplay = document.getElementById(`speed-value-${index}`);
      if (slider && valueDisplay) {
        slider.value = planet.userData.baseSpeed;
        valueDisplay.textContent = planet.userData.baseSpeed.toFixed(1) + "x";
      }
    });

    // Reset global speed
    this.globalSpeedMultiplier = 1;
    document.getElementById("global-speed").value = 1;
    document.getElementById("global-speed-value").textContent = "1.0x";

    // Reset pause state
    this.isPaused = false;
    const pauseBtn = document.getElementById("pause-btn");
    pauseBtn.textContent = "Pause";
    pauseBtn.className = "btn";
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.isPaused) {
      const deltaTime = this.clock.getDelta();

      // Rotate sun
      this.sun.rotation.y += deltaTime * 0.2;

      // Update planets
      this.planets.forEach((planet) => {
        const userData = planet.userData;

        // Update orbital position
        userData.angle +=
          deltaTime * userData.currentSpeed * this.globalSpeedMultiplier * 0.05;

        // Calculate new position
        planet.position.x = Math.cos(userData.angle) * userData.distance;
        planet.position.z = Math.sin(userData.angle) * userData.distance;

        // Rotate planet on its axis
        planet.rotation.y +=
          deltaTime * userData.rotationSpeed * this.globalSpeedMultiplier;
      });

      // Subtle camera movement for dynamic feel
      const time = this.clock.getElapsedTime();
      this.camera.position.y += Math.sin(time * 0.1) * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the solar system when the page loads
window.addEventListener("load", () => {
  try {
    new SolarSystem();
  } catch (error) {
    console.error("Error initializing Solar System:", error);
    document.getElementById("loading").textContent =
      "Error loading Solar System. Please refresh the page.";
  }
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Pause animation when tab is not visible to save resources
    if (window.solarSystem && !window.solarSystem.isPaused) {
      window.solarSystem.clock.stop();
    }
  } else {
    // Resume animation when tab becomes visible
    if (window.solarSystem && !window.solarSystem.isPaused) {
      window.solarSystem.clock.start();
    }
  }
});
