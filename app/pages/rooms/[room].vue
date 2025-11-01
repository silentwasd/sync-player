<script setup lang="ts">
import {io, Socket} from "socket.io-client";

let socket: Socket;

const route  = useRoute();
const userId = useUserId();

const socketConnected = ref<boolean>(false);
const roomJoined      = ref<boolean>(false);
const users           = ref<any[]>([]);

const sourceUrl      = ref<string>('');
const videoPlayerRef = ref();
const position       = ref<number>(0);
const playing        = ref<boolean>(false);

function loadVideo() {
    videoPlayerRef.value.load(sourceUrl.value);
    socket?.emit('load-video', sourceUrl.value);
}

watch(playing, isPlaying => {
    const myUser = users.value.find(user => user.id === userId.value);

    if (isPlaying) {
        socket?.emit('user-playing');
        myUser.playing = true;
    } else {
        socket?.emit('user-paused');
        myUser.playing = false;
    }
});

watch(position, currentPosition => {
    const myUser = users.value.find(user => user.id === userId.value);
    socket?.emit('user-position', currentPosition);
    myUser.position = currentPosition;
});

onMounted(() => {
    socket = io('http://localhost:4000');

    socket.on('connect', async () => {
        console.log('Connected');
        socketConnected.value = true;

        const roomInfo = await socket.emitWithAck('join-room', {
            userId: userId.value,
            roomId: route.params.room as string
        });

        users.value     = roomInfo.users;
        sourceUrl.value = roomInfo.videoUrl;

        if (sourceUrl.value)
            videoPlayerRef.value.load(sourceUrl.value);

        roomJoined.value = true;
    });

    socket.on('new-user', user => {
        users.value.push(user);
    });

    socket.on('leave-user', user => {
        users.value = users.value.filter(_user => _user.id !== user);
    });

    socket.on('new-video', url => {
        sourceUrl.value = url;
        if (sourceUrl.value)
            videoPlayerRef.value.load(sourceUrl.value);
    });

    socket.on('position-updated', time => {
        videoPlayerRef.value.setPosition(time);
    });

    socket.on('user-update', user => {
        const ourUser = users.value.find(_user => _user.id === user.id);

        if (ourUser === undefined)
            return;

        ourUser.playing  = user.playing;
        ourUser.position = user.position;
    });

    socket.on('set-play', () => videoPlayerRef.value.play());
    socket.on('set-pause', () => videoPlayerRef.value.pause());

    socket.on('disconnect', () => {
        socketConnected.value = false;
        roomJoined.value      = false;
        users.value           = [];
    });
});

onBeforeUnmount(() => {
    if (socket)
        socket.close();
});
</script>

<template>
    <UContainer class="py-5 flex flex-col gap-5">
        <div class="flex w-full gap-5">
            <div class="flex flex-col gap-5 grow w-0">
                <div>
                    <ClientOnly>
                        <VideoPlayer ref="videoPlayerRef"
                                     class="w-full aspect-[16/9] bg-black"
                                     v-model:playing="playing"
                                     v-model:position="position"
                                     @set-position="socket?.emit('set-position', $event)"
                                     @play="socket?.emit('set-play', $event)"
                                     @pause="socket?.emit('set-pause', $event)"/>

                        <template #fallback>
                            <div class="w-full aspect-[16/9] bg-black flex items-center justify-center">
                                <UIcon name="i-mdi-loading" class="size-24 text-white animate-spin"/>
                            </div>
                        </template>
                    </ClientOnly>
                </div>

                <UForm @submit="loadVideo">
                    <UFormField label="URL" size="xl">
                        <UInput v-model="sourceUrl" class="w-full"/>
                    </UFormField>
                </UForm>
            </div>

            <div class="flex flex-col gap-2.5 shrink-0 w-[250px]">
                <div v-for="user in users"
                     class="bg-neutral-800 px-2.5 py-1.5">
                    <p class="font-semibold">Пользователь</p>
                    <p class="truncate">{{ user.id }}</p>
                    <div class="flex gap-2.5 items-center">
                        <UIcon v-if="user.playing" name="i-mdi-play"/>
                        <UIcon v-else name="i-mdi-pause"/>
                        <p>{{ user.position }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <p v-if="socketConnected">Socket connected</p>
            <p v-else>Socket disconnected</p>

            <p v-if="roomJoined">Room joined</p>
            <p v-else>Room not joined</p>

            <p v-if="playing">Playing</p>
            <p v-else>Not playing</p>

            <p>Position: {{ position }}</p>
        </div>
    </UContainer>
</template>

<style scoped>

</style>