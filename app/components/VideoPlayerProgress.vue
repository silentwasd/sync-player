<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useThrottleFn } from '@vueuse/core'

const props = defineProps<{
    duration: number
}>()

const currentTime = defineModel<number>({ required: true })
const isDraggingModel = defineModel<boolean>('isDragging', { default: false })

const sliderRef = ref<HTMLElement>()
const isDragging = ref(false)
const localProgress = ref(0)

// Вычисляем прогресс на основе currentTime
const progress = computed(() => {
    return props.duration > 0 ? (currentTime.value / props.duration) * 100 : 0
})

// Обновляем локальный прогресс при изменении currentTime (только если не перетаскиваем)
watch(progress, (newProgress) => {
    if (!isDragging.value) {
        localProgress.value = newProgress
    }
})

// Синхронизируем внутреннее состояние с моделью
watch(isDragging, (newValue) => {
    isDraggingModel.value = newValue
})

// Инициализируем локальный прогресс
localProgress.value = progress.value

// Throttled функция для обновления currentTime во время перетаскивания
const throttledUpdateTime = useThrottleFn((progressPercent: number) => {
    const newTime = (progressPercent / 100) * props.duration
    currentTime.value = Math.max(0, Math.min(newTime, props.duration))
}, 100)

// Получаем позицию клика относительно слайдера
const getProgressFromEvent = (event: MouseEvent | TouchEvent): number => {
    if (!sliderRef.value) return 0

    const rect = sliderRef.value.getBoundingClientRect()
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

    return percentage
}

// Обработчик клика
const handleClick = (event: MouseEvent) => {
    if (isDragging.value) return

    const progressPercent = getProgressFromEvent(event)
    localProgress.value = progressPercent

    // Мгновенно обновляем время при клике
    const newTime = (progressPercent / 100) * props.duration
    currentTime.value = Math.max(0, Math.min(newTime, props.duration))
}

// Обработчик начала перетаскивания
const handleMouseDown = (event: MouseEvent) => {
    isDragging.value = true
    const progressPercent = getProgressFromEvent(event)
    localProgress.value = progressPercent

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Предотвращаем выделение текста
    event.preventDefault()
}

// Обработчик перетаскивания
const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return

    const progressPercent = getProgressFromEvent(event)
    localProgress.value = progressPercent

    // Используем throttled обновление во время перетаскивания
    throttledUpdateTime(progressPercent)
}

// Обработчик окончания перетаскивания
const handleMouseUp = () => {
    if (!isDragging.value) return

    isDragging.value = false

    // Финальное обновление времени
    const newTime = (localProgress.value / 100) * props.duration
    currentTime.value = Math.max(0, Math.min(newTime, props.duration))

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
}

// Touch события для мобильных устройств
const handleTouchStart = (event: TouchEvent) => {
    isDragging.value = true
    const progressPercent = getProgressFromEvent(event)
    localProgress.value = progressPercent

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    event.preventDefault()
}

const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging.value) return

    const progressPercent = getProgressFromEvent(event)
    localProgress.value = progressPercent

    throttledUpdateTime(progressPercent)
}

const handleTouchEnd = () => {
    if (!isDragging.value) return

    isDragging.value = false

    const newTime = (localProgress.value / 100) * props.duration
    currentTime.value = Math.max(0, Math.min(newTime, props.duration))

    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
}

// Очистка при размонтировании
onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<template>
    <div
        ref="sliderRef"
        class="video-slider"
        @click="handleClick"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
    >
        <!-- Фоновая полоска -->
        <div class="slider-track">
            <!-- Заполненная часть -->
            <div
                class="slider-progress"
                :style="{ width: `${localProgress}%` }"
            />

            <!-- Ползунок -->
            <div
                class="slider-thumb"
                :style="{ left: `${localProgress}%` }"
                :class="{ 'dragging': isDragging }"
            />
        </div>
    </div>
</template>

<style scoped>
.video-slider {
    position: relative;
    width: 100%;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 8px 0;
}

.slider-track {
    position: relative;
    width: 100%;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: visible;
}

.slider-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background-color: #4e5dca;
    border-radius: 2px;
    transition: width 0.1s ease;
}

.slider-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background-color: #6090ff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: transform 0.2s ease;
    opacity: 0;
    pointer-events: none;
}

.video-slider:hover .slider-thumb {
    opacity: 1;
}

.slider-thumb.dragging {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
}

.video-slider:hover .slider-track {
    height: 6px;
}

.video-slider:hover .slider-progress {
    height: 6px;
}

/* Улучшенная версия для мобильных устройств */
@media (max-width: 768px) {
    .video-slider {
        height: 32px;
        padding: 12px 0;
    }

    .slider-track {
        height: 6px;
    }

    .slider-thumb {
        width: 16px;
        height: 16px;
        opacity: 1;
    }
}
</style>