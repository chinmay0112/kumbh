(() => {
  "use strict";
  const section = document.querySelector(".story");
  const stage = section.querySelector(".story-stage");
  const video = document.querySelector("#scrollVideo");
  const status = section.querySelector(".video-status");
  const soundButton = section.querySelector(".sound-toggle");
  const entryHeading = section.querySelector(".entry-caption h1");
  const HEADING_FADE_AFTER_PX = 200;
  // Fade out after 200px, then reveal again on returning to the section top.
  function updateEntryHeading() {
    if (!trigger) return;
    const distance = window.scrollY - trigger.start;
    if (distance >= HEADING_FADE_AFTER_PX) {
      entryHeading.classList.add("is-hidden");
      entryHeading.setAttribute("aria-hidden", "true");
    } else if (distance <= 1) {
      entryHeading.classList.remove("is-hidden");
      entryHeading.removeAttribute("aria-hidden");
    }
  }
  window.addEventListener("scroll", updateEntryHeading, { passive: true });
  const endLogo = section.querySelector(".end-logo");
  const endLogoImage = endLogo.querySelector("img");
  const nextPagePreview = section.querySelector(".next-page-preview");
  let endingVisible = false;
  let endingAnimation = null;
  function updateEndLogo(self) {
    const show = self.scroll() >= self.end - 1;
    if (show === endingVisible) return;
    endingVisible = show;
    if (endingAnimation) endingAnimation.kill();
    endLogo.setAttribute("aria-hidden", String(!show));
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gsap.set(endLogo, { autoAlpha: 0, backgroundColor: "transparent" });
    gsap.set(endLogoImage, { scale: 1, opacity: 1 });
    gsap.set(nextPagePreview, {
      x: 0,
      xPercent: reduceMotion ? 0 : 100,
      autoAlpha: 0,
    });
    if (!show) return;
    endingAnimation = gsap.timeline({
      onComplete: () => {
        if (endingVisible) window.location.assign("new-page.html");
      },
    });
    endingAnimation
      .to(endLogo, { autoAlpha: 1, duration: 0.35 })
      .to(endLogoImage, {
        scale: reduceMotion ? 1 : 1.5,
        duration: 0.75,
        ease: "power2.out",
      })
      .to(
        endLogo,
        { backgroundColor: "rgba(7, 28, 44, 0.6)", duration: 0.75 },
        "<",
      );
    if (reduceMotion) {
      endingAnimation.to(
        nextPagePreview,
        { autoAlpha: 1, duration: 0.35 },
        "+=0.2",
      );
    } else {
      endingAnimation
        .set(nextPagePreview, { autoAlpha: 1 }, "+=0.2")
        .to(nextPagePreview, {
          xPercent: 0,
          duration: 1.2,
          ease: "power2.inOut",
        });
    }
  }
  const audio = new Audio(video.querySelector("source").src);
  audio.preload = "auto";
  audio.loop = true;
  let soundEnabled = false;
  let audioPending = false;
  let trigger;
  let pendingSeek = null;

  // Keep the opening frame still, with only the existing cloud drift.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const water = document.createElement("canvas");
  water.className = "water-ripples";
  water.setAttribute("aria-hidden", "true");
  video.after(water);
  const waterContext = water.getContext("2d");
  const still = document.createElement("canvas");
  const stillContext = still.getContext("2d");
  let waterActive = false;
  let waterFrame = 0;
  let captured = false;
  let skyBottom = 0;
  let skyFeather = 1;
  video.loop = false;
  video.muted = true;
  video.pause();

  function captureWater() {
    if (
      !waterActive ||
      video.readyState < 2 ||
      video.seeking ||
      video.currentTime > 0.01 ||
      !waterContext ||
      !stillContext
    )
      return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    water.width = still.width = width;
    water.height = still.height = height;
    const scale = Math.max(
      width / video.videoWidth,
      height / video.videoHeight,
    );
    const drawnWidth = video.videoWidth * scale;
    const drawnHeight = video.videoHeight * scale;
    const left = (width - drawnWidth) / 2;
    const top = (height - drawnHeight) / 2;
    stillContext.drawImage(video, left, top, drawnWidth, drawnHeight);
    // Stop above the lamps and rooftops so the architecture stays stationary.
    skyBottom = Math.max(0, Math.min(height, top + drawnHeight * 0.16));
    skyFeather = Math.max(1, drawnHeight * 0.09);
    captured = true;
    if (!waterFrame) waterFrame = requestAnimationFrame(drawWater);
  }

  function drawWater(now) {
    waterFrame = 0;
    if (!waterActive || !captured) return;
    const width = water.width;
    const height = water.height;
    waterContext.clearRect(0, 0, width, height);
    const cloudPhase = ((now % 6000) / 6000) * Math.PI * 2;
    for (let y = 0; y < skyBottom; y += 2) {
      const blend = Math.min(1, (skyBottom - y) / skyFeather);
      const fade = blend * blend * (3 - 2 * blend);
      const drift = Math.sin(cloudPhase + (y / height) * 2) * 60 * fade;
      waterContext.globalAlpha = fade;
      waterContext.drawImage(
        still,
        0,
        y,
        width,
        Math.min(2, skyBottom - y),
        drift - 64,
        y,
        width + 128,
        Math.min(2, skyBottom - y),
      );
    }
    waterContext.globalAlpha = 1;
    water.hidden = false;
    waterFrame = requestAnimationFrame(drawWater);
  }

  function setWaterActive(active) {
    if (active === waterActive) return;
    waterActive = active;
    captured = false;
    water.hidden = true;
    cancelAnimationFrame(waterFrame);
    waterFrame = 0;
    if (active) captureWater();
  }
  water.hidden = true;
  video.addEventListener("loadeddata", captureWater);
  video.addEventListener("seeked", captureWater);
  window.addEventListener("resize", () => {
    captured = false;
    captureWater();
  });

  function stopAudio() {
    audio.pause();
  }
  function updateSoundButton() {
    soundButton.textContent = soundEnabled ? "Mute sound" : "Enable sound";
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
  }
  function playAudio() {
    if (audioPending || !audio.paused) return;
    audioPending = true;
    audio
      .play()
      .catch((error) => {
        if (error.name !== "AbortError") {
          soundEnabled = false;
          updateSoundButton();
        }
      })
      .finally(() => {
        audioPending = false;
      });
  }
  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    if (soundEnabled) {
      // The soundtrack loops independently of scroll position.
      playAudio();
    } else stopAudio();
  });

  function applyPendingSeek() {
    if (pendingSeek === null || video.readyState < 2 || video.seeking) return;
    const time = pendingSeek;
    pendingSeek = null;
    if (Math.abs(video.currentTime - time) > 0.001) video.currentTime = time;
  }
  function seekFromScroll() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const start = trigger ? trigger.start : section.offsetTop;
    const distance = trigger
      ? trigger.end - trigger.start
      : parseFloat(
          getComputedStyle(section).getPropertyValue("--scroll-distance"),
        );
    const progress = Math.max(
      0,
      Math.min(1, (window.scrollY - start) / distance),
    );
    // Pinned sections can start at -0.001px; allow fractional scroll rounding.
    const atTop = window.scrollY <= start + 1;
    setWaterActive(atTop && !reducedMotion.matches && !document.hidden);
    video.pause();
    const time = atTop ? 0 : progress * video.duration;
    pendingSeek = time;
    applyPendingSeek();
  }
  window.addEventListener("scroll", seekFromScroll, { passive: true });
  document.addEventListener("visibilitychange", seekFromScroll);
  reducedMotion.addEventListener("change", seekFromScroll);
  window.addEventListener("pagehide", stopAudio);
  window.addEventListener("pageshow", (event) => {
    // Returning from the destination should not immediately redirect again.
    if (event.persisted) {
      window.scrollTo(0, 0);
      if (trigger) updateEndLogo(trigger);
      seekFromScroll();
    }
    if (soundEnabled) playAudio();
  });
  video.addEventListener("seeked", applyPendingSeek);
  video.addEventListener("loadeddata", applyPendingSeek);
  video.addEventListener("error", () => {
    status.textContent =
      "The film could not load. Check the video path and reload.";
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () =>
        `clamp(+=${parseFloat(getComputedStyle(section).getPropertyValue("--scroll-distance"))})`,
      pin: stage,
      pinSpacing: false,
      invalidateOnRefresh: true,
      onUpdate: updateEndLogo,
      onRefresh: updateEndLogo,
    });
  }
  const refreshMetadata = () => {
    if (trigger) ScrollTrigger.refresh();
    seekFromScroll();
  };
  if (video.readyState >= 1) refreshMetadata();
  else
    video.addEventListener("loadedmetadata", refreshMetadata, { once: true });
})();

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  autoRaf: false,
  anchors: true,
  allowNestedScroll: true,
  stopInertiaOnNavigate: true,
});

lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);
