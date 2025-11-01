<script setup lang="ts">
import Hls from "hls.js";

const emit = defineEmits<{
    (e: 'setPosition', time: number): void,
    (e: 'play'): void
    (e: 'pause'): void
}>();

const inputPosition = defineModel<number>('position', {default: 0});
const inputPlaying  = defineModel<boolean>('playing', {default: false});

const hls = new Hls();

const videoRef       = ref();
const videoRootRef   = ref();
const levelSwitching = ref<boolean>(false);
const selectedLevel  = ref<number>(-1);
const played         = ref<boolean>(false);
const paused         = ref<boolean>(false);
const progress       = ref<number>(0);
const currentTime    = ref<number>(0);
const duration       = ref<number>(0);
const volume         = useLocalStorage<number>('player_volume', 100);
const muted          = useLocalStorage<boolean>('player_muted', false);
const currentDate    = ref<string>('');
const endDate        = ref<string>('');
const fullscreen     = ref<boolean>(false);
const isPlaylist     = ref<boolean>(false);
const videoTracks    = ref<any[]>([]);
const audioTracks    = ref<any[]>([]);
const selectedVideo  = ref<number>(-1);
const selectedAudio  = ref<number>(-1);
const loading        = ref<boolean>(false);

const availableLevels = ref<any[]>([]);

const qualities = computed(() => {
    if (!isPlaylist.value || availableLevels.value.length === 0) return [];

    return [
        {
            index  : -1,
            label  : 'Авто',
            type   : 'checkbox',
            checked: selectedLevel.value === -1,
            onSelect() {
                selectedLevel.value = -1;
                hls.currentLevel    = -1;
            }
        },
        ...availableLevels.value.map((level, i) => ({
            index  : i,
            label  : `${level.height}p`,
            type   : 'checkbox',
            checked: selectedLevel.value === i,
            onSelect() {
                selectedLevel.value = i;
                hls.currentLevel    = i;
            }
        }))
    ];
});

const videoTrackOptions = computed(() => {
    if (!isPlaylist.value || videoTracks.value.length === 0) return [];

    return videoTracks.value.map((track, i) => ({
        index  : i,
        label  : track.name || `Видео ${i + 1}`,
        type   : 'checkbox',
        checked: selectedVideo.value === i,
        onSelect() {
            selectedVideo.value = i;
            if (hls.audioTracks) {
                videoRef.value.textTracks[i].mode = 'showing';
            }
        }
    }));
});

const audioTrackOptions = computed(() => {
    if (!isPlaylist.value || audioTracks.value.length === 0) return [];

    return audioTracks.value.map((track, i) => ({
        index  : i,
        label  : track.name || track.lang || `Аудио ${i + 1}`,
        type   : 'checkbox',
        checked: selectedAudio.value === i,
        onSelect() {
            selectedAudio.value = i;
            hls.audioTrack      = i;
        }
    }));
});

hls.on(Hls.Events.LEVEL_SWITCHING, (e, data) => {
    levelSwitching.value = true;
});

hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
    levelSwitching.value = false;
});

hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
    isPlaylist.value = data.levels.length > 0;

    // Загружаем уровни качества
    if (data.levels && data.levels.length > 0) {
        availableLevels.value = data.levels.map(level => ({
            width  : level.width,
            height : level.height,
            bitrate: level.bitrate
        }));
    }

    // Загружаем аудио треки
    if (hls.audioTracks && hls.audioTracks.length > 0) {
        audioTracks.value   = hls.audioTracks;
        selectedAudio.value = hls.audioTrack;
    }
});

hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (e, data) => {
    audioTracks.value   = data.audioTracks;
    selectedAudio.value = hls.audioTrack;
});

hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (e, data) => {
    selectedAudio.value = data.id;
});

const controlShown       = ref<boolean>(true);
const volumeOpened       = ref<boolean>(false);
const qualityOpened      = ref<boolean>(false);
const mouseOverControl   = ref<boolean>(false);
const isProgressDragging = ref<boolean>(false);
let timeout: any         = null;

watch(() => [volumeOpened.value, qualityOpened.value, mouseOverControl.value, isProgressDragging.value], () => {
    resetTimeout();
});

function resetTimeout() {
    if (timeout)
        clearTimeout(timeout);

    timeout = setTimeout(() => !volumeOpened.value && !qualityOpened.value && !mouseOverControl.value && !isProgressDragging.value ? controlShown.value = false : null, 1000);
}

function makeTime(value: number) {
    let hours   = Math.floor(value / 3600).toString();
    let minutes = Math.floor(value % 3600 / 60).toString();
    let seconds = Math.floor(value % 3600 % 60).toString();

    if (parseInt(seconds) < 10)
        seconds = '0' + seconds;

    if (parseInt(minutes) < 10)
        minutes = '0' + minutes;

    if (parseInt(hours) < 10)
        hours = '0' + hours;

    return `${hours}:${minutes}:${seconds}`;
}

function toggleFullscreen() {
    if (videoRootRef.value.requestFullscreen)
        videoRootRef.value.requestFullscreen();
    else if (videoRootRef.value.webkitEnterFullScreen)
        videoRootRef.value.webkitEnterFullscreen();
}

function exitFullscreen() {
    document.exitFullscreen();
    fullscreen.value = false;
}

function onProgressChange(time: number) {
    videoRef.value.currentTime = time;
    emit('setPosition', time);
}

function resume() {
    if (!played.value || (played.value && paused.value))
        videoRef.value.play();
    else
        videoRef.value.pause();
}

defineShortcuts({
    arrowright: {
        usingInput: true,
        handler   : () => {
            videoRef.value.currentTime += 5;
            emit('setPosition', videoRef.value.currentTime);
        }
    },

    arrowleft: {
        usingInput: true,
        handler   : () => {
            videoRef.value.currentTime -= 5;
            emit('setPosition', videoRef.value.currentTime);
        }
    },

    ' ': {
        usingInput: true,
        handler   : () => {
            if (!paused.value) {
                controlShown.value = true;
                resetTimeout();
            }

            resume();
        }
    }
});

defineExpose({
    load(url: string) {
        // Очищаем предыдущие данные
        videoTracks.value     = [];
        audioTracks.value     = [];
        availableLevels.value = [];
        selectedVideo.value   = -1;
        selectedAudio.value   = -1;
        selectedLevel.value   = -1;
        isPlaylist.value      = false;
        loading.value         = true;

        // Определяем тип контента по префиксу
        if (url.startsWith('hls:')) {
            // HLS плейлист
            const hlsUrl = url.substring(4); // Убираем префикс "hls:"
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoRef.value);
            isPlaylist.value = true;
        } else {
            // Обычное видео
            if (hls.media) {
                hls.detachMedia();
            }
            videoRef.value.src = url;
            isPlaylist.value   = false;
        }
    },

    setPosition(time: number) {
        videoRef.value.currentTime = time;
    },

    play() {
        videoRef.value.play();
    },

    pause() {
        videoRef.value.pause();
    }
});

onMounted(() => {
    videoRef.value.addEventListener('pause', () => {
        paused.value       = true;
        inputPlaying.value = false;
        emit('pause');
    });

    videoRef.value.addEventListener('play', () => {
        paused.value       = false;
        played.value       = true;
        inputPlaying.value = true;
        emit('play');
    });

    videoRef.value.addEventListener('timeupdate', () => {
        progress.value      = videoRef.value.currentTime / videoRef.value.duration;
        currentTime.value   = videoRef.value.currentTime;
        duration.value      = videoRef.value.duration;
        currentDate.value   = makeTime(videoRef.value.currentTime);
        inputPosition.value = videoRef.value.currentTime;
    });

    videoRef.value.addEventListener('loadeddata', () => {
        currentDate.value = makeTime(videoRef.value.currentTime);
        endDate.value     = makeTime(videoRef.value.duration);
        loading.value     = false;
    });

    videoRef.value.addEventListener('waiting', () => {
        loading.value = true;
    });

    videoRef.value.addEventListener('playing', () => {
        loading.value = false;
    });

    videoRef.value.addEventListener('loadedmetadata', () => {
        // Загружаем видео треки для обычного видео
        if (!isPlaylist.value && videoRef.value.videoTracks) {
            videoTracks.value = Array.from(videoRef.value.videoTracks);
        }

        if (!isPlaylist.value && videoRef.value.audioTracks) {
            audioTracks.value = Array.from(videoRef.value.audioTracks);
        }
    });

    document.addEventListener('fullscreenchange', () => fullscreen.value = !!document.fullscreenElement);

    // Запускаем таймер автоскрытия контролов
    resetTimeout();
});
</script>

<template>
    <div ref="videoRootRef"
         class="relative"
         :class="{'cursor-none': !controlShown}"
         @mouseenter="controlShown = true; resetTimeout()"
         @mousemove="controlShown = true; resetTimeout()">
        <div class="absolute top-0 w-full h-full z-10"
             @click.exact.prevent="resume"></div>

        <Transition>
            <div v-show="loading"
                 class="absolute top-0 w-full h-full z-20 flex items-center justify-center pointer-events-none">
                <UIcon name="i-mdi-loading" class="size-24 text-white animate-spin"/>
            </div>
        </Transition>

        <Transition>
            <div v-show="controlShown" class="absolute top-0 w-full h-full select-none"
                 @mouseenter="mouseOverControl = true"
                 @mouseleave="mouseOverControl = false">
                <div class="absolute bottom-0 w-full p-5 z-10 bg-gradient-to-t from-neutral-950">
                    <VideoPlayerProgress class="mb-1.5"
                                         :duration="duration"
                                         :model-value="currentTime"
                                         @update:model-value="onProgressChange"
                                         v-model:is-dragging="isProgressDragging"/>

                    <div class="flex justify-between items-center">
                        <div class="flex items-end justify-center gap-5">
                            <UButton v-if="!played || (played && paused)"
                                     icon="i-heroicons-play-solid"
                                     variant="link"
                                     size="lg"
                                     class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                     @click="videoRef.play()"/>

                            <UButton v-if="played && !paused"
                                     icon="i-heroicons-pause-solid"
                                     variant="link"
                                     size="lg"
                                     class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                     @click="videoRef.pause()"/>

                            <p class="text-white dark:text-white my-auto font-semibold">
                                {{ currentDate }} / {{ endDate }}
                            </p>
                        </div>

                        <div class="flex items-end justify-center gap-2.5">
                            <UPopover v-model:open="volumeOpened"
                                      mode="hover"
                                      :portal="false"
                                      :content="{align: 'center', side: 'top'}"
                                      class="flex items-end">
                                <UButton
                                    :icon="muted ? 'i-heroicons-speaker-x-mark-solid' : 'i-heroicons-speaker-wave-solid'"
                                    variant="link"
                                    square
                                    size="lg"
                                    class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                    @click="muted = !muted"/>

                                <template #content>
                                    <div class="h-40 w-full p-2.5">
                                        <USlider :min="0" :max="100" orientation="vertical" v-model="volume"/>
                                    </div>
                                </template>
                            </UPopover>

                            <UDropdownMenu v-if="isPlaylist && audioTrackOptions.length > 1"
                                           :items="audioTrackOptions"
                                           :content="{align: 'center', side: 'top'}"
                                           :modal="false"
                                           :portal="false">
                                <UButton icon="i-heroicons-musical-note-solid"
                                         variant="link"
                                         class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                         size="lg"/>
                            </UDropdownMenu>

                            <UDropdownMenu v-if="isPlaylist && videoTrackOptions.length > 1"
                                           :items="videoTrackOptions"
                                           :content="{align: 'center', side: 'top'}"
                                           :modal="false"
                                           :portal="false">
                                <UButton icon="i-heroicons-film-solid"
                                         variant="link"
                                         class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                         size="lg"/>
                            </UDropdownMenu>

                            <UDropdownMenu v-if="qualities.length > 1"
                                           :items="qualities"
                                           :content="{align: 'center', side: 'top'}"
                                           :modal="false"
                                           :portal="false"
                                           v-model:open="qualityOpened">
                                <UButton icon="i-heroicons-cog-6-tooth-solid"
                                         variant="link"
                                         class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                         size="lg"
                                         :class="{'[&>span]:animate-spin': levelSwitching}"/>
                            </UDropdownMenu>

                            <UButton v-if="!fullscreen"
                                     icon="i-heroicons-arrows-pointing-out-solid"
                                     variant="link"
                                     square
                                     size="lg"
                                     class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                     @click="toggleFullscreen"/>

                            <UButton v-else
                                     icon="i-heroicons-arrows-pointing-in-solid"
                                     variant="link"
                                     square
                                     size="lg"
                                     class="text-white dark:text-white hover:text-gray-400 dark:hover:text-gray-400 [&>span]:w-8 [&>span]:h-8 p-0"
                                     @click="exitFullscreen"/>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <video ref="videoRef"
               playsinline
               :muted="muted"
               :volume="volume / 100"
               class="w-full h-full"></video>
    </div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
    transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
</style>