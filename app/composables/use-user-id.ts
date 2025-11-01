import {v4 as uuidv4} from "uuid";

export default function () {
    return useCookie<string>('user_id', {
        default: () => uuidv4(),
        maxAge : new Date().setFullYear(new Date().getFullYear() + 1).valueOf()
    });
}