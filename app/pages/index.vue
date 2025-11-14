<script setup lang="ts">
import {v4 as uuidv4} from 'uuid';

useHead({
    title: 'Zixu Screen'
});
async function createRoom() {
    await navigateTo(`/rooms/${uuidv4()}`);
}
</script>

<template>
    <div class="flex flex-col justify-center items-center w-full h-[calc(100vh-var(--ui-header-height))]">
        <UButton label="Создать комнату" icon="i-mdi-plus" size="xl" @click="createRoom"/>
    </div>
</template>

<style scoped>

</style>