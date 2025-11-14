import type UserAppearance from "~/types/UserAppearance";

export default function () {
    return useLocalStorage<UserAppearance>('user_appearance', () => ({
        name  : null,
        avatar: null
    }));
}