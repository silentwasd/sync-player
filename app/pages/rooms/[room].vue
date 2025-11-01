<script setup lang="ts">
const sourceUrl      = ref<string>('');
const videoPlayerRef = ref();

function loadVideo() {
    videoPlayerRef.value.load(sourceUrl.value);
}
</script>

<template>
    <UContainer class="py-5 flex flex-col gap-5">
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
    </UContainer>
</template>

<style scoped>

</style>