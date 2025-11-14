<script setup lang="ts">
defineEmits<{
    (e: 'ready'): void
}>();

const userAppearance = useUserAppearance();
const fileInputRef = ref<HTMLInputElement | null>(null);

const handleAvatarClick = () => {
    fileInputRef.value?.click();
};

const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Не удалось получить контекст canvas'));
                    return;
                }

                const maxSize = 400;
                canvas.width = maxSize;
                canvas.height = maxSize;

                // Вычисляем масштаб для covering (покрытия)
                const scale = Math.max(maxSize / img.width, maxSize / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;

                // Центрируем изображение
                const x = (maxSize - scaledWidth) / 2;
                const y = (maxSize - scaledHeight) / 2;

                // Рисуем изображение с покрытием
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

                // Конвертируем в base64
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
    });
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Проверяем, что это разрешенный тип изображения
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Пожалуйста, выберите изображение в формате JPG, PNG или WebP');
        return;
    }

    try {
        // Ресайзим и конвертируем в base64
        const resizedBase64 = await resizeImage(file);
        userAppearance.value.avatar = resizedBase64;
    } catch (error) {
        console.error('Ошибка при обработке изображения:', error);
        alert('Не удалось обработать изображение');
    }

    // Очищаем input для возможности повторного выбора того же файла
    target.value = '';
};

const removeAvatar = () => {
    userAppearance.value.avatar = null;
};
</script>

<template>
    <div class="flex items-center justify-center w-dvw h-dvh">
        <div class="flex flex-col gap-5 w-full max-w-sm">
            <ClientOnly>
                <!-- Аватарка -->
                <div class="flex flex-col items-center gap-3">
                    <div class="relative">
                        <div
                            class="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                            @click="handleAvatarClick"
                        >
                            <img
                                v-if="userAppearance.avatar"
                                :src="userAppearance.avatar"
                                alt="Avatar"
                                class="w-full h-full object-cover"
                            />
                            <div
                                v-else
                                class="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                            >
                                <UIcon name="i-mdi-account" class="w-16 h-16 text-gray-400" />
                            </div>
                        </div>

                        <!-- Кнопка удаления аватарки -->
                        <UButton
                            v-if="userAppearance.avatar"
                            icon="i-mdi-close"
                            color="error"
                            variant="solid"
                            size="md"
                            class="absolute -top-3 -right-3 rounded-full"
                            @click.stop="removeAvatar"
                        />
                    </div>

                    <!-- Скрытый input для выбора файла -->
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        class="hidden"
                        @change="handleFileChange"
                    />
                </div>

                <UFormField label="Имя" size="xl">
                    <UInput v-model="userAppearance.name" class="w-full"/>
                </UFormField>
            </ClientOnly>

            <UButton size="xl"
                     label="Подключиться"
                     icon="i-mdi-user-plus"
                     class="w-full"
                     @click="$emit('ready')"/>
        </div>
    </div>
</template>

<style scoped>

</style>