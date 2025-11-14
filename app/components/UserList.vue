<script setup lang="ts">
import type User from "~/types/User";

const props = defineProps<{
    users: User[],
    myUser: User
}>();
</script>

<template>
    <div class="flex flex-col gap-2.5 shrink-0 w-[250px]">
        <div v-for="user in users"
             class="bg-neutral-800 rounded-lg p-1.5 flex gap-2">
            <div class="shrink-0">
                <div class="w-16 h-16 rounded-lg overflow-clip">
                    <img v-if="user.appearance.avatar"
                         :src="user.appearance.avatar"
                         alt="Avatar"
                         class="w-full h-full object-cover"/>

                    <div v-else class="flex items-center justify-center w-full h-full bg-neutral-700">
                        <UIcon name="i-mdi-user" class="size-10"/>
                    </div>
                </div>
            </div>

            <div class="flex flex-col justify-center grow w-0">
                <div class="font-semibold flex items-center gap-1.5">
                    <UIcon v-if="user.isMaster" name="i-mdi-crown" class="text-amber-400 size-5 shrink-0"/>
                    <p class="truncate">{{ user.appearance.name ?? user.id }}</p>
                </div>
                <div class="flex flex-col justify-center text-sm">
                    <div v-if="user.playing" class="flex items-center gap-1.5">
                        <UIcon name="i-mdi-play" class="size-4"/>
                        Проигрывается
                    </div>

                    <div v-else class="flex items-center gap-1.5">
                        <UIcon name="i-mdi-pause" class="size-4"/>
                        На паузе
                    </div>

                    <div v-if="user.buffering" class="flex items-center gap-1.5">
                        <UIcon name="i-mdi-loading" class="animate-spin size-4"/>
                        Буферизация
                    </div>

                    <div v-else class="flex items-center gap-1.5">
                        <UIcon name="i-mdi-clock" class="size-4"/>
                        <p>{{ formatTime(user.position) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>