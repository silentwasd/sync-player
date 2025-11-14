<script setup lang="ts">
import {io, Socket} from "socket.io-client";
import type User from "~/types/User";

let socket: Socket;

const ready = ref<boolean>(false);

const route  = useRoute();
const userId = useUserId();
const toast  = useToast();

const socketConnected = ref<boolean>(false);
const roomJoined      = ref<boolean>(false);
const users           = ref<User[]>([]);

const inputSourceUrl  = ref<string>('');
const loadedSourceUrl = ref<string>('');
const videoPlayerRef  = ref();
const position        = ref<number>(0);
const playing         = ref<boolean>(false);

const myUser = computed<User | null>(() => users.value.find(user => user.id === userId.value) ?? null);

async function loadVideo() {
    if (!socket)
        return;

    if (await socket.emitWithAck('load-video', inputSourceUrl.value)) {
        loadedSourceUrl.value = inputSourceUrl.value;
        videoPlayerRef.value.load(inputSourceUrl.value);
    } else {
        toast.add({
            title      : 'Нельзя',
            description: 'Управлять плеером может только мастер',
            color      : 'warning',
            icon       : 'i-mdi-crown'
        });
    }
}

watch(playing, isPlaying => {
    if (!myUser.value)
        return;

    if (isPlaying) {
        socket?.emit('i-am-playing');
        myUser.value.playing = true;
    } else {
        socket?.emit('i-am-paused');
        myUser.value.playing = false;
    }
});

watch(position, currentPosition => {
    if (!myUser.value)
        return;

    socket?.emit('my-position', currentPosition);
    myUser.value.position = currentPosition;
});

function startBuffering() {
    if (!myUser.value)
        return;

    socket?.emit('i-am-buffering');
    myUser.value.buffering = true;
}

function stopBuffering() {
    if (!myUser.value)
        return;

    socket?.emit('i-am-not-buffering');
    myUser.value.buffering = false;
}

const userAppearance = useUserAppearance();

onMounted(() => {
    socket = io('http://192.168.0.34:4000', {autoConnect: false});

    socket.on('connect', async () => {
        console.log('Connected');
        socketConnected.value = true;

        const roomInfo = await socket.emitWithAck('join-room', {
            userId    : userId.value,
            roomId    : route.params.room as string,
            appearance: {
                name  : userAppearance.value.name?.trim() ?? null,
                avatar: userAppearance.value.avatar
            }
        });

        if (!roomInfo) {
            ready.value = false;
            socket.close();
            toast.add({
                title      : 'Ошибка',
                description: 'Неверный формат авторизации',
                color      : 'error',
                icon       : 'i-mdi-error'
            });
            return;
        }

        console.log('Joined room', roomInfo);

        users.value           = roomInfo.users;
        loadedSourceUrl.value = roomInfo.videoUrl;

        if (loadedSourceUrl.value) {
            videoPlayerRef.value.load(loadedSourceUrl.value, roomInfo.position, roomInfo.playing);
        }

        roomJoined.value = true;
    });

    socket.on('user-joined', user => {
        users.value.push(user);
    });

    socket.on('user-removed', userId => {
        users.value = users.value.filter(_user => _user.id !== userId);
    });

    socket.on('user-updated', user => {
        const listUser = users.value.find(_user => _user.id === user.id);
        if (!listUser) {
            users.value.push(user);
        } else {
            listUser.isMaster   = user.isMaster;
            listUser.playing    = user.playing;
            listUser.buffering  = user.buffering;
            listUser.position   = user.position;
            listUser.appearance = user.appearance;
        }
    });

    socket.on('room-updated', room => {
        if (loadedSourceUrl.value !== room.videoUrl) {
            loadedSourceUrl.value = room.videoUrl;
            videoPlayerRef.value.load(room.videoUrl, room.position, room.playing);
            return;
        }

        if (playing.value !== room.playing) {
            if (room.playing)
                videoPlayerRef.value.play();
            else
                videoPlayerRef.value.pause();
        }

        if (Math.abs(position.value - room.position) >= 1) {
            videoPlayerRef.value.setPosition(room.position);
        }
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
    <UContainer v-if="ready" class="py-5 flex flex-col gap-5">
        <div class="flex w-full gap-5">
            <div class="flex flex-col gap-5 grow w-0">
                <div>
                    <ClientOnly>
                        <VideoPlayer ref="videoPlayerRef"
                                     class="w-full aspect-[16/9] bg-black"
                                     v-model:playing="playing"
                                     v-model:position="position"
                                     @start-buffering="startBuffering"
                                     @stop-buffering="stopBuffering"/>

                        <template #fallback>
                            <div class="w-full aspect-[16/9] bg-black flex items-center justify-center">
                                <UIcon name="i-mdi-loading" class="size-24 text-white animate-spin"/>
                            </div>
                        </template>
                    </ClientOnly>
                </div>

                <UForm @submit="loadVideo">
                    <UFormField label="URL" size="xl">
                        <UInput v-model="inputSourceUrl" class="w-full"/>
                    </UFormField>
                </UForm>
            </div>

            <UserList v-if="myUser"
                      :my-user="myUser"
                      :users="users"/>
        </div>

        <div>
            <p>Loaded URL: {{ loadedSourceUrl }}</p>

            <p v-if="socketConnected">Socket connected</p>
            <p v-else>Socket disconnected</p>

            <p v-if="roomJoined">Room joined</p>
            <p v-else>Room not joined</p>

            <p v-if="playing">Playing</p>
            <p v-else>Not playing</p>

            <p>Position: {{ position }}</p>
        </div>
    </UContainer>

    <ConnectScreen v-else @ready="ready = true; socket?.connect()"/>
</template>

<style scoped>

</style>