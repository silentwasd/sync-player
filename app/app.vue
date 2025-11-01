<script setup lang="ts">
const sourceUrl      = ref<string>('');
const videoPlayerRef = ref();

function loadVideo() {
    videoPlayerRef.value.load(sourceUrl.value);
}
</script>

<template>
    <UApp>
        <UContainer class="py-5">
            <ClientOnly>
                <VideoPlayer ref="videoPlayerRef"/>
            </ClientOnly>

            <UForm @submit="loadVideo">
                <UFormField label="URL">
                    <UInput v-model="sourceUrl" class="w-full"/>
                </UFormField>
            </UForm>
        </UContainer>
    </UApp>
</template>