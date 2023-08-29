<script>
  // @ts-nocheck

  import { onMount } from "svelte";
  import { drawing, finishTakingScreenshot, takingScreenshot } from "$lib/utils/konva_utils";
  import { invoke } from "@tauri-apps/api";
  export let layer;
  export let tr;
  let container;
  let overlay;
  let drawingOnOverlay = false;
  let startX;
  let startY;
  onMount(() => {
    container.addEventListener("mousedown", (e) => {
      drawingOnOverlay = true;
      startX = e.clientX;
      startY = e.clientY;
    });
    container.addEventListener("mousemove", (e) => {
      if (!drawingOnOverlay) return;
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      const left = width >= 0 ? startX : e.clientX;
      const top = height >= 0 ? startY : e.clientY;
      overlay.style.top = `${top}px`;
      overlay.style.left = `${left}px`;
      overlay.style.width = `${width}px`;
      overlay.style.height = `${height}px`;
    });
    container.addEventListener("mouseup", async (e) => {
      drawingOnOverlay = false;
      const rectWidth = Math.abs(e.clientX - startX);
      const rectHeight = Math.abs(e.clientY - startY);
      const rectLeft = startX < e.clientX ? startX : e.clientX;
      const rectTop = startY < e.clientY ? startY : e.clientY;
      // invoke screen capture area
      const capturedScreenshot = await invoke("capture_area", { x: rectLeft, y: rectTop, width: rectWidth, height: rectHeight });
      await finishTakingScreenshot(capturedScreenshot, tr, layer, rectLeft, rectTop);
      overlay.style.top = "0px";
      overlay.style.left = "0px";
      overlay.style.width = "0px";
      overlay.style.height = "0px";
      takingScreenshot.set(false);
      drawing.set(false);
    });
  });
  const exitScreenshot = async (event) => {
    if (event.code === "Escape") {
      document.body.style.cursor = "auto";
      drawing.set(false);
      takingScreenshot.set(false);
      container.style.backgroundImage = "none";
    }
  };

  takingScreenshot.subscribe((val) => {
    if (val) {
      window.addEventListener("keydown", exitScreenshot);
      return;
    }
    window.removeEventListener("keydown", exitScreenshot);
  });
</script>

<div class="{$takingScreenshot ? 'fixed' : 'hidden'} w-100v h-100v top-0 left-0 cursor-crosshair" id="screenshotContainer" bind:this={container}>
  <div class="fixed !z-[9999] cursor-crosshair {$takingScreenshot ? 'border-red-600' : ''}" id="overlay" bind:this={overlay} />
</div>

<style>
  #overlay {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
  }
</style>
