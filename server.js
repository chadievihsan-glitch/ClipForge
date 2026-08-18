const BACKEND_URL = "https://clipforge-we2q.onrender.com";

let authMode = "login";

let selectedPlan = {
  name: "",
  price: 0
};

let selectedPayment = "card";

/* =========================
   HELPERS
========================= */

function $(id) {
  return document.getElementById(id);
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function getUser() {
  const saved = localStorage.getItem("clipforgeUser");

  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(
    "clipforgeUser",
    JSON.stringify(user)
  );
}

/* =========================
   YOUTUBE
========================= */

function connectYouTube() {
  window.location.href =
    BACKEND_URL + "/auth/youtube";
}

async function checkYouTubeStatus() {
  const button = $("youtubeButton");

  if (!button) return;

  try {
    const response = await fetch(
      BACKEND_URL + "/api/youtube/status",
      {
        method: "GET",
        credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error("YouTube status error");
    }

    const data = await response.json();

    if (data.connected && data.channel) {
      button.textContent =
        "✓ " + data.channel.title;

      button.classList.add(
        "youtube-connected"
      );
    } else {
      button.textContent =
        "▶ Connect YouTube";

      button.classList.remove(
        "youtube-connected"
      );
    }

  } catch (error) {
    console.error(
      "YouTube status:",
      error
    );
  }
}

async function disconnectYouTube() {
  try {
    const response = await fetch(
      BACKEND_URL + "/api/youtube/disconnect",
      {
        method: "POST",
        credentials: "include"
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        "Disconnect failed"
      );
    }

    showToast(
      "👋 YouTube disconnected."
    );

    checkYouTubeStatus();

  } catch (error) {
    console.error(error);

    showToast(
      "❌ YouTube disconnect failed."
    );
  }
}

function checkYouTubeCallback() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  if (
    params.get("youtube") ===
    "connected"
  ) {
    showToast(
      "✅ YouTube successfully connected!"
    );

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    setTimeout(() => {
      checkYouTubeStatus();
    }, 500);
  }

  if (params.get("youtube") === "error") {
    showToast(
      "❌ YouTube connection failed."
    );

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}

/* =========================
   LOGIN
========================= */

function openLogin() {
  const modal = $("loginModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function switchAuth() {
  authMode =
    authMode === "login"
      ? "register"
      : "login";

  const register =
    authMode === "register";

  $("authTitle").textContent =
    register
      ? "Create account"
      : "Welcome back";

  $("authDescription").textContent =
    register
      ? "Create your ClipForge account."
      : "Log in to your ClipForge account.";

  $("authName").classList.toggle(
    "hidden",
    !register
  );

  $("authButtonText").textContent =
    register
      ? "Create account"
      : "Log in";

  $("switchAuthButton").textContent =
    register
      ? "Already have an account? Log in"
      : "Don't have an account? Create one";
}

function submitAuth() {
  const name =
    $("authName").value.trim();

  const email =
    $("authEmail").value.trim();

  const password =
    $("authPassword").value.trim();

  if (!email || !password) {
    showToast(
      "❌ Fill in your email and password."
    );

    return;
  }

  if (
    authMode === "register" &&
    !name
  ) {
    showToast(
      "❌ Enter your name."
    );

    return;
  }

  let user = getUser();

  if (authMode === "register") {
    user = {
      name,
      email,
      password,
      plan: "Basic",
      videos: 0,
      clips: 0,
      uploads: 0
    };
  } else {
    if (!user) {
      showToast(
        "❌ No account found. Create one first."
      );

      return;
    }

    if (
      user.email !== email ||
      user.password !== password
    ) {
      showToast(
        "❌ Incorrect email or password."
      );

      return;
    }
  }

  saveUser(user);
  updateUser();

  closeModal("loginModal");

  showToast(
    `✅ Welcome ${user.name}!`
  );
}

/* =========================
   USER
========================= */

function updateUser() {
  const user = getUser();

  if (!user) {
    $("loginButton")?.classList.remove(
      "hidden"
    );

    $("profileButton")?.classList.add(
      "hidden"
    );

    return;
  }

  $("loginButton")?.classList.add(
    "hidden"
  );

  $("profileButton")?.classList.remove(
    "hidden"
  );

  if ($("navName")) {
    $("navName").textContent =
      `${user.name} • ${user.plan}`;
  }

  if ($("profileName")) {
    $("profileName").textContent =
      user.name;
  }

  if ($("profileEmail")) {
    $("profileEmail").textContent =
      user.email;
  }

  if ($("profilePlan")) {
    $("profilePlan").textContent =
      user.plan;
  }

  if ($("profileVideos")) {
    $("profileVideos").textContent =
      user.videos || 0;
  }

  if ($("profileClips")) {
    $("profileClips").textContent =
      user.clips || 0;
  }

  if ($("profileUploads")) {
    $("profileUploads").textContent =
      user.uploads || 0;
  }

  if ($("profileQuality")) {
    if (user.plan === "Pro") {
      $("profileQuality").textContent =
        "4K";
    } else if (
      user.plan === "Creator"
    ) {
      $("profileQuality").textContent =
        "1080p";
    } else {
      $("profileQuality").textContent =
        "720p";
    }
  }

  updatePlanButtons();
}

function openProfile() {
  $("profileModal")?.classList.remove(
    "hidden"
  );
}

function logout() {
  localStorage.removeItem(
    "clipforgeUser"
  );

  updateUser();

  closeModal("profileModal");

  showToast(
    "👋 Logged out."
  );
}

/* =========================
   PLANS
========================= */

function updatePlanButtons() {
  const user = getUser();

  if (!user) return;

  const buttons = {
    Basic: $("basicButton"),
    Creator: $("creatorButton"),
    Pro: $("proButton")
  };

  Object.keys(buttons).forEach(
    plan => {
      const button = buttons[plan];

      if (!button) return;

      if (user.plan === plan) {
        button.textContent =
          "✓ Current Plan";

        button.classList.add(
          "current-plan"
        );
      } else {
        button.classList.remove(
          "current-plan"
        );

        if (plan === "Basic") {
          button.textContent =
            "Choose Basic";
        }

        if (plan === "Creator") {
          button.textContent =
            "Start Creating";
        }

        if (plan === "Pro") {
          button.textContent =
            "Go Pro";
        }
      }
    }
  );
}

function choosePlan(name, price) {
  const user = getUser();

  if (!user) {
    showToast(
      "🔐 Log in first."
    );

    openLogin();

    return;
  }

  if (user.plan === name) {
    showToast(
      `✓ You already have ${name}.`
    );

    return;
  }

  selectedPlan = {
    name,
    price
  };

  $("checkoutPlan").textContent =
    name;

  $("checkoutPrice").textContent =
    price === 0
      ? "€0"
      : `€${price.toFixed(2)} / month`;

  $("checkoutModal").classList.remove(
    "hidden"
  );
}

function goToPayment() {
  if (
    selectedPlan.name === "Basic"
  ) {
    completeFreePlan();
    return;
  }

  closeModal("checkoutModal");

  $("paymentModal").classList.remove(
    "hidden"
  );
}

function selectPayment(
  method,
  button
) {
  selectedPayment = method;

  document
    .querySelectorAll(".payment-method")
    .forEach(element => {
      element.classList.remove(
        "active"
      );
    });

  button.classList.add("active");
}

function goToConfirm() {
  const paymentNames = {
    card: "Card",
    paypal: "PayPal",
    crypto: "Crypto"
  };

  $("confirmPlan").textContent =
    selectedPlan.name;

  $("confirmPayment").textContent =
    paymentNames[selectedPayment];

  $("confirmPrice").textContent =
    `€${selectedPlan.price.toFixed(2)} / month`;

  closeModal("paymentModal");

  $("confirmModal").classList.remove(
    "hidden"
  );
}

function completePurchase() {
  const user = getUser();

  if (!user) {
    closeModal("confirmModal");
    openLogin();
    return;
  }

  user.plan =
    selectedPlan.name;

  saveUser(user);
  updateUser();

  closeModal("confirmModal");

  $("successText").textContent =
    `${selectedPlan.name} is now active on your account.`;

  $("successModal").classList.remove(
    "hidden"
  );
}

function completeFreePlan() {
  const user = getUser();

  if (!user) return;

  user.plan = "Basic";

  saveUser(user);
  updateUser();

  closeModal("checkoutModal");

  $("successText").textContent =
    "Your Basic plan is now active.";

  $("successModal").classList.remove(
    "hidden"
  );
}

/* =========================
   VIDEO
========================= */

function handleFile(input) {
  if (
    !input.files ||
    !input.files.length
  ) {
    return;
  }

  const file = input.files[0];

  $("fileName").textContent =
    file.name;

  showToast(
    "🎬 Video selected."
  );
}

async function generateClip() {
  const user = getUser();

  if (!user) {
    showToast(
      "🔐 Log in first."
    );

    openLogin();

    return;
  }

  const input = $("videoFile");

  if (
    !input.files ||
    !input.files.length
  ) {
    showToast(
      "❌ Select a video first."
    );

    return;
  }

  const button =
    $("generateButton");

  const status =
    $("generationStatus");

  button.disabled = true;
  button.textContent =
    "Creating...";

  status.textContent =
    "⏳ Creating your clip...";

  const formData =
    new FormData();

  formData.append(
    "video",
    input.files[0]
  );

  try {
    const response =
      await fetch(
        `${BACKEND_URL}/api/create-clip`,
        {
          method: "POST",
          body: formData
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
        "Could not create clip."
      );
    }

    user.videos =
      (user.videos || 0) + 1;

    user.clips =
      (user.clips || 0) + 1;

    user.uploads =
      (user.uploads || 0) + 1;

    saveUser(user);
    updateUser();

    if (
      data.clip &&
      data.clip.url
    ) {
      addClip(
        data.clip.url,
        data.clip.name ||
          "ClipForge Clip"
      );
    }

    status.textContent =
      "✅ Your clip is ready!";

    showToast(
      "🎬 Clip created!"
    );

  } catch (error) {
    console.error(error);

    status.textContent =
      "❌ " + error.message;

    showToast(
      "❌ " + error.message
    );

  } finally {
    button.disabled = false;

    button.textContent =
      "Generate Clip →";
  }
}

function addClip(url, name) {
  const container =
    $("clipsContainer");

  const empty =
    $("emptyState");

  if (empty) {
    empty.remove();
  }

  const card =
    document.createElement("div");

  card.className =
    "clip-card";

  const video =
    document.createElement("video");

  video.className =
    "real-video";

  video.controls = true;
  video.preload = "metadata";

  const source =
    document.createElement("source");

  source.src = url;
  source.type = "video/mp4";

  video.appendChild(source);

  const title =
    document.createElement("h3");

  title.textContent = name;

  const text =
    document.createElement("p");

  text.textContent =
    "ClipForge • Generated clip";

  const download =
    document.createElement("a");

  download.className =
    "download-btn";

  download.href = url;
  download.download = name;

  download.textContent =
    "⬇ Download Clip";

  card.appendChild(video);
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(download);

  container.prepend(card);
}

/* =========================
   MODALS
========================= */

function closeModal(id) {
  const modal = $(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

function closeSuccess() {
  closeModal("successModal");
}

/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    updateUser();
    checkYouTubeCallback();
    checkYouTubeStatus();
  }
);
