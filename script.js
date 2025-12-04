/* ==========================================================
   MULTI-ARTIST LOCALSTORAGE SYSTEM
========================================================== */

// Get all artists or return empty object
function loadArtists() {
  return JSON.parse(localStorage.getItem("artists") || "{}");
}

// Save artists back to storage
function saveArtists(data) {
  localStorage.setItem("artists", JSON.stringify(data));
}

// Get current user
function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

// Get current artist object
function getArtistData() {
  const user = getCurrentUser();
  const artists = loadArtists();

  if (!user || !artists[user]) return null;

  return artists[user];
}

// Save changes to current artist only
function updateArtistData(callback) {
  const user = getCurrentUser();
  const artists = loadArtists();

  if (!user || !artists[user]) return;

  callback(artists[user]); // modify artist object

  saveArtists(artists);
}

/* ==========================================================
   ARTIST PROFILE (profile.html)
========================================================== */

function loadProfile() {
  const artist = getArtistData();
  if (!artist) return alert("No artist logged in!");

  document.getElementById("artistName").value = artist.profile.name;
  document.getElementById("artistBio").value = artist.profile.bio;

  document.getElementById("profilePic").src =
    artist.profile.profilePic || "https://via.placeholder.com/200x200?text=Profile+Pic";
}

function saveProfile() {
  updateArtistData(artist => {
    artist.profile.name = document.getElementById("artistName").value;
    artist.profile.bio = document.getElementById("artistBio").value;
  });

  alert("Profile saved!");
}

function saveProfilePic() {
  const file = document.getElementById("profilePicInput").files[0];
  if (!file) return alert("Please choose an image first!");

  const reader = new FileReader();
  reader.onload = () => {
    updateArtistData(artist => {
      artist.profile.profilePic = reader.result;
    });

    document.getElementById("profilePic").src = reader.result;

    alert("Profile picture updated!");
  };

  reader.readAsDataURL(file);
}

/* ==========================================================
   ARTWORK UPLOAD + DELETE (upload.html)
========================================================== */

function addArtwork() {
  const file = document.getElementById("artInput").files[0];
  const title = document.getElementById("artTitle").value.trim();
  const desc = document.getElementById("artDesc").value.trim();

  if (!file) return alert("Select an artwork first!");
  if (!title) return alert("Enter artwork title!");

  const reader = new FileReader();
  reader.onload = () => {
    updateArtistData(artist => {
      if (!artist.artworks) artist.artworks = [];
      artist.artworks.push({
        img: reader.result,
        title: title,
        desc: desc
      });
    });

    displayArtworks();
  };

  reader.readAsDataURL(file);
}

function deleteArtwork(index) {
  updateArtistData(artist => {
    if (artist.artworks) artist.artworks.splice(index, 1);
  });

  displayArtworks();
}

function displayArtworks() {
  const container = document.getElementById("artList");
  if (!container) return;

  const artist = getArtistData();
  if (!artist) return;

  container.innerHTML = "";

  if (artist.artworks) {
    artist.artworks.forEach((art, i) => {
      container.innerHTML += `
        <div class="card">
          <img src="${art.img}">
          <p><strong>${art.title}</strong></p>
          <p>${art.desc}</p>
          <button onclick="deleteArtwork(${i})">Delete</button>
        </div>
      `;
    });
  }

  // Show uploaded 3D models
  if (artist.models) {
    artist.models.forEach((model, i) => {
      container.innerHTML += `
        <div class="card">
          <p><strong>3D Model:</strong> ${model.name}</p>
          <button onclick="deleteModel(${i})">Delete Model</button>
        </div>
      `;
    });
  }
}

/* ==========================================================
   3D MODEL DELETE
========================================================== */
function deleteModel(index) {
  updateArtistData(artist => {
    if (artist.models) artist.models.splice(index, 1);
  });

  displayArtworks();
}

/* ==========================================================
   ARTIST PORTFOLIO (artist.html)
========================================================== */

function loadPortfolio() {
  const artist = getArtistData();
  if (!artist) return alert("No artist logged in!");

  document.getElementById("artistDisplayName").textContent =
    artist.profile.name || "Unnamed Artist";

  document.getElementById("artistDisplayBio").textContent =
    artist.profile.bio || "No biography available.";

  document.getElementById("artistPic").src =
    artist.profile.profilePic || "https://via.placeholder.com/200x200?text=Artist";

  const gallery = document.getElementById("artGallery");
  gallery.innerHTML = "";

  if (artist.artworks) {
    artist.artworks.forEach(art => {
      const el = document.createElement("img");
      el.src = art.img;
      gallery.appendChild(el);
    });
  }

  // Optionally, show 3D models in portfolio
  if (artist.models) {
    artist.models.forEach(model => {
      const el = document.createElement("p");
      el.textContent = `3D Model: ${model.name}`;
      gallery.appendChild(el);
    });
  }
}

/* ==========================================================
   AR VIEWER (ar.html)
========================================================== */

let arIndex = 0;

function initAR() {
  const artist = getArtistData();
  if (!artist) return alert("No artist logged in!");

  const artworks = artist.artworks || [];
  const models = artist.models || [];
  const assetContainer = document.getElementById("arAssets");
  const plane = document.getElementById("arPlane");

  const titleText = document.getElementById("arTitle");
  const descText = document.getElementById("arDesc");
  const modelEntity = document.getElementById("modelEntity"); // new entity for GLTF/GLB

  if (!assetContainer || !plane || !modelEntity) return;

  // Add images to A-Frame assets
  artworks.forEach((art, i) => {
    const asset = document.createElement("img");
    asset.id = "art-" + i;
    asset.src = art.img;
    assetContainer.appendChild(asset);
  });

  // Load first 3D model if exists
  if (models.length > 0) {
    modelEntity.setAttribute("gltf-model", models[0].data);
  }

  function updateAR() {
    if (artworks.length > 0) {
      const item = artworks[arIndex];

      plane.setAttribute("src", "#art-" + arIndex);
      titleText.setAttribute("value", item.title || "(Untitled)");
      descText.setAttribute("value", item.desc || "");
    }

    // Update model (optional: sync model index with AR image index)
    if (models.length > 0) {
      const model = models[arIndex % models.length];
      modelEntity.setAttribute("gltf-model", model.data);
    }
  }

  updateAR();

  document.getElementById("prevArt").onclick = () => {
    arIndex = (arIndex - 1 + Math.max(artworks.length, models.length)) % Math.max(artworks.length, models.length);
    updateAR();
  };

  document.getElementById("nextArt").onclick = () => {
    arIndex = (arIndex + 1) % Math.max(artworks.length, models.length);
    updateAR();
  };
}
