<script setup lang="ts">
const props = defineProps<{
    users: any[]
}>();
</script>

<template>
    <div class="flex flex-col gap-2.5 shrink-0 w-[250px]">
        <div v-for="user in users"
             class="bg-neutral-800 px-2.5 py-1.5">
            <div class="font-semibold flex items-center gap-1.5">
                <p>Пользователь</p>
                <UIcon v-if="user.isMaster" name="i-mdi-crown" class="text-amber-400 size-5"/>
            </div>
            <p class="truncate">{{ user.id }}</p>
            <div class="flex gap-2.5 items-center">
                <UIcon v-if="user.playing" name="i-mdi-play"/>
                <UIcon v-else-if="!user.playing" name="i-mdi-pause"/>
                <UIcon v-if="user.buffering" name="i-mdi-loading" class="animate-spin"/>
                <p>{{ user.position }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>