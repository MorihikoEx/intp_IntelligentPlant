<script setup>
import {onMounted, onUnmounted, ref} from 'vue'

const shapes = [
  {
    name: 'shape-a-1',
    tone: 'a',
    layer: 'back',
    position: 'top-left',
    depth: 18,
  },
  {
    name: 'shape-a-2',
    tone: 'a',
    layer: 'mid',
    position: 'top-right',
    depth: 24,
  },
  {
    name: 'shape-c-1',
    tone: 'c',
    layer: 'mid',
    position: 'bottom-left',
    depth: 20,
  },
  {
    name: 'shape-d-1',
    tone: 'd',
    layer: 'front',
    position: 'bottom-right',
    depth: 28,
  },
]

const mouseX = ref(0)
const mouseY = ref(0)

const handlePointerMove = (event) => {
  const {innerWidth, innerHeight} = window
  mouseX.value = (event.clientX / innerWidth - 0.5) * 2
  mouseY.value = (event.clientY / innerHeight - 0.5) * 2
}

const resetPointer = () => {
  mouseX.value = 0
  mouseY.value = 0
}

const shapeStyle = (depth) => ({
  '--move-x': `${mouseX.value * depth}px`,
  '--move-y': `${mouseY.value * depth}px`,
})

onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerleave', resetPointer)
})

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerleave', resetPointer)
})
</script>

<template>
  <div aria-hidden="true" class="organic-background">
    <div
        v-for="shape in shapes"
        :key="shape.name"
        :class="{
        'shape-a': shape.tone === 'a',
        'shape-c': shape.tone === 'c',
        'shape-d': shape.tone === 'd',
        'layer-back': shape.layer === 'back',
        'layer-mid': shape.layer === 'mid',
        'layer-front': shape.layer === 'front',
        'shape-top-left': shape.position === 'top-left',
        'shape-top-right': shape.position === 'top-right',
        'shape-bottom-left': shape.position === 'bottom-left',
        'shape-bottom-right': shape.position === 'bottom-right',
      }"
        :style="shapeStyle(shape.depth)"
        class="shape"
    >
      <div class="shape-motion">
        <div class="blob blob-main"></div>
        <div class="blob blob-sub"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.organic-background {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
  isolation: isolate;
}

.shape {
  --move-x: 0px;
  --move-y: 0px;
  position: absolute;
  filter: blur(52px);
}

.shape-motion {
  width: 100%;
  height: 100%;
  transform: translate3d(var(--move-x), var(--move-y), 0);
  transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.blob {
  position: absolute;
  border-radius: 40% 60% 58% 42% / 38% 34% 66% 62%;
  clip-path: polygon(50% 2%, 98% 76%, 10% 100%);
  background-color: currentColor;
}

.blob-main {
  inset: 0;
}

.blob-sub {
  width: 84%;
  height: 82%;
}

.shape-a {
  color: var(--color-a);
}

.shape-c {
  color: var(--color-c);
}

.shape-d {
  color: var(--color-d);
}

.layer-back {
  z-index: 1;
}

.layer-mid {
  z-index: 2;
}

.layer-front {
  z-index: 3;
}

.shape-top-left {
  top: -24vh;
  left: -24vw;
  width: 58rem;
  height: 50rem;
  animation: drift-1 10s ease-in-out infinite alternate;
}

.shape-top-left .blob-main {
  transform: rotate(-18deg);
}

.shape-top-left .blob-sub {
  right: 2%;
  bottom: -2%;
  transform: rotate(8deg) scale(0.96);
}

.shape-top-right {
  top: -14vh;
  right: -24vw;
  width: 50rem;
  height: 42rem;
  animation: drift-2 11s ease-in-out infinite alternate;
}

.shape-top-right .blob-main {
  transform: rotate(18deg);
}

.shape-top-right .blob-sub {
  left: 8%;
  bottom: 4%;
  transform: rotate(34deg) scale(0.9);
}

.shape-bottom-left {
  bottom: -35vh;
  left: -18vw;
  width: 80rem;
  height: 46rem;
  animation: drift-3 12s ease-in-out infinite alternate;
}

.shape-bottom-left .blob-main {
  transform: rotate(10deg);
}

.shape-bottom-left .blob-sub {
  right: 4%;
  top: 10%;
  transform: rotate(28deg) scale(0.88);
}

.shape-bottom-right {
  right: 2vw;
  bottom: 2vh;
  width: 25rem;
  height: 19rem;
  animation: drift-4 9s ease-in-out infinite alternate;
}

.shape-bottom-right .blob-main {
  transform: rotate(-14deg);
}

.shape-bottom-right .blob-sub {
  left: 10%;
  top: 6%;
  transform: rotate(14deg) scale(0.86);
}

@keyframes drift-1 {
  0% {
    transform: translate3d(0, 0, 0) rotate(-4deg);
  }
  50% {
    transform: translate3d(6vw, 3vh, 0) rotate(5deg);
  }
  100% {
    transform: translate3d(-3vw, 7vh, 0) rotate(11deg);
  }
}

@keyframes drift-2 {
  0% {
    transform: translate3d(0, 0, 0) rotate(6deg);
  }
  50% {
    transform: translate3d(-6vw, 4vh, 0) rotate(-3deg);
  }
  100% {
    transform: translate3d(-9vw, -3vh, 0) rotate(-10deg);
  }
}

@keyframes drift-3 {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(7vw, -3vh, 0) rotate(8deg);
  }
  100% {
    transform: translate3d(-2vw, -8vh, 0) rotate(15deg);
  }
}

@keyframes drift-4 {
  0% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }
  50% {
    transform: translate3d(3vw, -2vh, 0) rotate(1deg);
  }
  100% {
    transform: translate3d(-3vw, 3vh, 0) rotate(9deg);
  }
}

@media (max-width: 1100px) {
  .shape {
    filter: blur(40px);
  }

  .shape-top-left {
    width: 44rem;
    height: 38rem;
    left: -26vw;
  }

  .shape-top-right {
    width: 38rem;
    height: 32rem;
    right: -24vw;
  }

  .shape-bottom-left {
    width: 42rem;
    height: 36rem;
    left: -18vw;
  }

  .shape-bottom-right {
    width: 16rem;
    height: 14rem;
  }
}

@media (max-width: 720px) {
  .shape {
    filter: blur(32px);
  }

  .shape-top-left {
    width: 34rem;
    height: 28rem;
    top: -14vh;
    left: -28vw;
  }

  .shape-top-right {
    width: 28rem;
    height: 24rem;
    top: -10vh;
    right: -26vw;
  }

  .shape-bottom-left {
    width: 30rem;
    height: 26rem;
    bottom: -14vh;
    left: -20vw;
  }

  .shape-bottom-right {
    width: 12rem;
    height: 10rem;
    right: 0;
    bottom: 8vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shape,
  .shape-motion {
    animation: none;
    transition: none;
  }
}
</style>
