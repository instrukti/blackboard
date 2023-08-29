<script>
  // @ts-nocheck
  import { saveBoard, freeHandSelection, clearBoard, drawRectangle, fill, stroke, strokeWidth, deleteSelectedNode, drawEllipse, drawLine, drawFreeform, addTextBox, editingSavedBoard, loadSavedBoard, drawPolygon, drawing, pasteImages, startTakingScreenshot, takingScreenshot } from "$lib/utils/konva_utils";
  import ColorPicker from "svelte-awesome-color-picker";
  import Konva from "konva";
  import { onMount } from "svelte";
  import Icon from "svelte-icons-pack";
  import BsTrash2Fill from "svelte-icons-pack/bs/BsTrash2Fill";
  import BsCircleSquare from "svelte-icons-pack/bs/BsCircleSquare";
  import BsBoundingBox from "svelte-icons-pack/bs/BsBoundingBox";
  import BsCircle from "svelte-icons-pack/bs/BsCircle";
  import BsPentagon from "svelte-icons-pack/bs/BsPentagon";
  import BsPaintBucket from "svelte-icons-pack/bs/BsPaintBucket";
  import BsBrushFill from "svelte-icons-pack/bs/BsBrushFill";
  import BsBorderWidth from "svelte-icons-pack/bs/BsBorderWidth";
  import BsSlashLg from "svelte-icons-pack/bs/BsSlashLg";
  import BsPencilFill from "svelte-icons-pack/bs/BsPencilFill";
  import BsBoxArrowInUpLeft from "svelte-icons-pack/bs/BsBoxArrowInUpLeft";
  import BsTextareaT from "svelte-icons-pack/bs/BsTextareaT";
  import BsFolder2Open from "svelte-icons-pack/bs/BsFolder2Open";
  import BsScissors from "svelte-icons-pack/bs/BsScissors";
  import FaSolidSave from "svelte-icons-pack/fa/FaSolidSave";
  import BsStopwatchFill from "svelte-icons-pack/bs/BsStopwatchFill";
  import Screenshot from "$lib/components/blackboard/Screenshot.svelte";
  import Timer from "$lib/components/blackboard/Timer.svelte";

  let containerWidth;
  let containerHeight;
  let stage;
  let layer;
  let tr;
  let container;
  let isTimerShown = false;

  onMount(() => {
    stage = new Konva.Stage({
      container: "container",
      width: containerWidth,
      height: containerHeight,
    });
    layer = new Konva.Layer();
    tr = new Konva.Transformer();
    layer.add(tr);
    stage.add(layer);
    stage.on("pointerclick", (event) => {
      if (event.target.nodeType === "Stage") {
        tr.nodes([]);
      }
    });
    container = stage.container();
    container.tabIndex = 1;
    container.focus();
    container.addEventListener("keydown", (event) => {
      if (event.code === "Delete") {
        deleteSelectedNode(tr);
      }
      if (event.code === "Escape") {
        drawing.set(false);
      }
    });
    container.addEventListener("drop", (e) => {
      e.preventDefault();
      console.log(e.dataTransfer.files[0]);
    });
    document.addEventListener("paste", (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      const items = clipboardData.items;
      pasteImages(stage, layer, tr, items);
    });
    if ($editingSavedBoard) {
      loadSavedBoard(layer, tr);
    }
  });
  const showTimer = () => {
    isTimerShown = true;
  };
</script>

{#if $drawing}
  <div class="fixed top-4 left-1/2 w-48 -ml-24 text-white bg-slate-700 rounded-lg flex items-center justify-start p-4 space-y-4 z-[999]">Press 'ESC' to exit.</div>
{/if}

{#if $editingSavedBoard}
  <div class="fixed bottom-4 right-4 text-white bg-slate-700 rounded-lg flex items-center justify-start p-4 space-y-4 z-[999]">
    You are editing a saved board: {$editingSavedBoard}
  </div>
{/if}
{#if !$takingScreenshot}
  <div class="fixed top-4 right-4 bg-slate-700 rounded-lg flex flex-col items-center justify-start p-4 space-y-4 z-[999]">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="dropdown dropdown-hover dropdown-left">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label tabindex="0" class="btn btn-outline btn-accent">
        <Icon src={BsCircleSquare} size="1.5em" />
      </label>
      <div tabindex="0" class="dropdown-content z-[1] bg-slate-700 rounded-lg w-64 p-2 shadow-2xl">
        <div class="grid grid-flow-row grid-cols-3 gap-4">
          <button class="btn btn-outline btn-success btn-sm" on:click={() => drawLine(stage, layer, tr)} disabled={$drawing}>
            <Icon src={BsSlashLg} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => drawFreeform(stage, layer, tr)} disabled={$drawing}>
            <Icon src={BsPencilFill} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => drawRectangle(stage, layer, tr)} disabled={$drawing}>
            <Icon src={BsBoundingBox} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => drawEllipse(stage, layer, tr)} disabled={$drawing}>
            <Icon src={BsCircle} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => drawPolygon(stage, layer, tr, container)} disabled={$drawing}>
            <Icon src={BsPentagon} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => addTextBox(layer, tr)} disabled={$drawing}>
            <Icon src={BsTextareaT} size="1.5em" />
          </button>
          <button class="btn btn-outline btn-success btn-sm" on:click={() => freeHandSelection(stage, layer, tr)} disabled={$drawing}>
            <Icon src={BsBoxArrowInUpLeft} size="1.5em" />
          </button>
        </div>
      </div>
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="dropdown dropdown-hover dropdown-left">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label tabindex="0" class="btn btn-outline btn-accent flex flex-col justify-center">
        <Icon src={BsPaintBucket} size="1.5em" />
        <div class="w-full h-1" style="background-color: {$fill};" />
      </label>
      <div tabindex="0" class="dropdown-content z-[1] bg-slate-700 card rounded-lg p-2 shadow-2xl">
        <div class="card-title text-white">
          <p>Pick Fill Color</p>
        </div>
        <div class="card-body p-2">
          <ColorPicker bind:hex={$fill} isInput={false} />
        </div>
      </div>
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="dropdown dropdown-hover dropdown-left">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label tabindex="0" class="btn btn-outline btn-accent flex flex-col justify-center">
        <Icon src={BsBrushFill} size="1.5em" />
        <div class="w-full h-1 bg-red-500" style="background-color: {$stroke};" />
      </label>
      <div tabindex="0" class="dropdown-content z-[1] bg-slate-700 card rounded-lg p-2 shadow-2xl">
        <div class="card-title text-white">
          <p>Pick Stroke Color</p>
        </div>
        <div class="card-body p-2">
          <ColorPicker bind:hex={$stroke} isInput={false} />
        </div>
      </div>
    </div>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="dropdown dropdown-hover dropdown-left">
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label tabindex="0" class="btn btn-outline btn-accent"> <Icon src={BsBorderWidth} size="1.5em" /></label>
      <div tabindex="0" class="dropdown-content z-[1] bg-slate-700 card w-64 rounded-lg p-2 shadow-2xl">
        <div class="card-title text-white">
          <p>Pick Stroke Width</p>
        </div>
        <div class="card-body p-2">
          <input type="range" min="2" max="100" bind:value={$strokeWidth} class="range range-xs range-success" />
        </div>
        <div class="card-actions text-white">
          {$strokeWidth}
        </div>
      </div>
    </div>
    <button class="btn btn-outline btn-accent" on:click={startTakingScreenshot}>
      <Icon src={BsScissors} size="1.5em" />
    </button>
    <button class="btn btn-outline btn-accent" on:click={showTimer}>
      <Icon src={BsStopwatchFill} size="1.5em" />
    </button>
    <button class="btn btn-outline btn-warning" on:click={() => loadSavedBoard(layer, tr)}>
      <Icon src={BsFolder2Open} size="1.5em" color="currentColor" />
    </button>
    <button class="btn btn-outline btn-primary" on:click={() => saveBoard(stage)}>
      <Icon src={FaSolidSave} size="1.5em" color="currentColor" />
    </button>
    <button class="btn btn-outline btn-error" on:click={() => clearBoard(layer, tr)}>
      <Icon src={BsTrash2Fill} size="1.5em" />
    </button>
  </div>
{/if}
<div id="container" class="w-full h-100v bg-gray-800" bind:clientHeight={containerHeight} bind:clientWidth={containerWidth} />

<Screenshot bind:layer bind:tr />

{#if isTimerShown}
  <Timer bind:isTimerShown />
{/if}
