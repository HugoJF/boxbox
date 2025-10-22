import {useState} from "react";

function fetchFromLocalStorage(key: string) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

export const useLocalStorage = <T = string>(key: string, initial?: T) => {
    const [internal, setInternal] = useState<T | null>(() => fetchFromLocalStorage(key) ?? initial ?? null);

    function setValue(value: T) {
        setInternal(value);
        localStorage.setItem(key, JSON.stringify(value));
    }

    return [internal, setValue] as const
};