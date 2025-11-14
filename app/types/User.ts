import type UserAppearance from "~/types/UserAppearance";

export default interface User {
    id: string;
    playing: boolean;
    buffering: boolean;
    position: number;
    isMaster: boolean;
    appearance: UserAppearance;
}