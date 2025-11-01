<script setup lang="ts">
import {io, Socket} from "socket.io-client";

let socket: Socket;

const route  = useRoute();
const userId = useUserId();

const socketConnected = ref<boolean>(false);
const roomJoined      = ref<boolean>(false);
const users           = ref<string[]>([]);

const sourceUrl      = ref<string>('');
const videoPlayerRef = ref();

function loadVideo() {
    videoPlayerRef.value.load(sourceUrl.value);
    socket?.emit('load-video', sourceUrl.value);
}

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
        users.value = users.value.filter(_user => _user !== user);
    });

    socket.on('new-video', url => {
        sourceUrl.value = url;
        if (sourceUrl.value)
            videoPlayerRef.value.load(sourceUrl.value);
    });

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
                        <VideoPlayer ref="videoPlayerRef" class="w-full aspect-[16/9] bg-black"/>

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
                    <p class="truncate">{{ user }}</p>
                </div>
            </div>
        </div>

        <div>
            <p v-if="socketConnected">Socket connected</p>
            <p v-else>Socket disconnected</p>

            <p v-if="roomJoined">Room joined</p>
            <p v-else>Room not joined</p>
        </div>
    </UContainer>
</template>

<style scoped>

</style>