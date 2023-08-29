<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import Icon from "svelte-icons-pack";
  import BsThreeDots from "svelte-icons-pack/bs/BsThreeDots";
  import BsX from "svelte-icons-pack/bs/BsX";
  import { Duration } from "luxon";

  export let isTimerShown = false;
  let target = 0;
  let displayTarget = "00:00";
  let timer;
  let header;
  let interval;
  let percentage = 100;
  onMount(() => {
    dragElement(timer);
  });
  const dragElement = (elmnt) => {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = elmnt.offsetTop - pos2 + "px";
      elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  };
  const setTarget = (increment) => {
    target = target + increment;
    displayTarget = formatTarget(target);
  };
  const formatTarget = (seconds) => {
    const duration = Duration.fromObject({ seconds: Math.floor(seconds) });
    const durationFormat = duration.toFormat("mm:ss");
    return durationFormat;
  };
  const startTimer = () => {
    if (target === 0) {
      return;
    }
    const audio = new Audio("/alarm.wav");
    const initialTarget = target;
    interval = setInterval(() => {
      if (target == 0) {
        percentage = 100;
        clearInterval(interval);
        audio.play();
        return;
      }
      target = target - 1;
      percentage = Math.floor((target * 100) / initialTarget);
      displayTarget = formatTarget(target);
    }, 1000);
  };
  const resetTimer = (close = false) => {
    if (close) isTimerShown = false;
    if (interval) {
      clearInterval(interval);
    }
    percentage = 100;
    target = 0;
    displayTarget = "00:00";
  };
  $: if (!isTimerShown) {
    resetTimer();
  }
</script>

<div class="flex flex-col w-[30rem] h-60 bg-orange-100 z-[9999] absolute top-1/3 left-1/3 text-white" bind:this={timer}>
  <div class="w-full h-8 bg-rose-500 flex justify-between px-4 items-center cursor-move selection:bg-transparent selection:cursor-move" bind:this={header}>
    <div>
      <Icon src={BsThreeDots} size="1.5em" />
    </div>
    <button
      class="btn btn-ghost btn-xs"
      on:click={() => {
        resetTimer(true);
      }}
    >
      <Icon src={BsX} size="1.5em" />
    </button>
  </div>
  <div class="flex-grow w-full flex">
    <div class="grid place-items-center w-1/3 grid-cols-2">
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(5)}>+5s</button>
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(10)}>+10s</button>
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(30)}>+30s</button>
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(60)}>+1m</button>
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(300)}>+5m</button>
      <button class="btn btn-circle btn-neutral btn-outline" on:click={() => setTarget(900)}>+15m</button>
    </div>
    <div class="grid place-items-center w-2/3">
      <div class="radial-progress {percentage < 30 ? 'text-error' : 'text-neutral'}" style="--value:{percentage}; --size:8rem; --thickness: 1rem;">
        <h1 class="text-2xl">{displayTarget}</h1>
      </div>
      <div class="flex justify-between px-4 space-x-4">
        <button class="btn w-1/2 btn-sm btn-neutral btn-outline" on:click={startTimer} disabled={percentage !== 100}>Start</button>
        <button
          class="btn w-1/2 btn-sm btn-error btn-outline"
          on:click={() => {
            resetTimer(false);
          }}>Reset</button
        >
      </div>
    </div>
  </div>
</div>
