<script setup lang="ts">
import {v4 as uuidv4} from 'uuid';

async function createRoom() {
    await navigateTo(`/rooms/${uuidv4()}`);
}
</script>

<template>
    <div class="flex flex-col justify-center items-center w-dvw h-dvh">
        <UButton label="Создать комнату" icon="i-mdi-plus" size="xl" @click="createRoom"/>
    </div>
</template>

<style scoped>

</style>