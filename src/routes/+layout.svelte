<script>
  import "../app.postcss";
  import { onMount } from "svelte";
  import { exists, createDir, BaseDirectory } from "@tauri-apps/api/fs";
  import { Toaster } from "svelte-french-toast";
  import { takingScreenshot } from "$lib/utils/konva_utils";
  onMount(async () => {
    document.body.style.cursor = "auto";
    const isAppInitiated = await exists("InstruktiFiles", { dir: BaseDirectory.Document });
    if (!isAppInitiated) {
      await createDir("InstruktiFiles", { dir: BaseDirectory.Document });
    }
  });
</script>

<div class="w-100v h-100v overflow-hidden flex">
  <slot />
</div>
<Toaster />
