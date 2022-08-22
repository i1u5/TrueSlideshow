// deno run -A --unstable ./index.ts 20 "X:/path-to-folder"

import { resolve } from "https://deno.land/std@0.152.0/path/mod.ts";

const providedInt = Deno.args[0] && parseInt(Deno.args[0], 10) > 0 ? parseInt(Deno.args[0], 10) : 5;
const providedPath = Deno.args[1] ? resolve(Deno.args[1]) : Deno.env.get("USERPROFILE") ? resolve(Deno.env.get("USERPROFILE") + "\\Pictures") : null;

const supportedExtensions = [
    ".jpg",
    ".jpeg",
    ".bmp",
    ".dib",
    ".png",
    ".jfif",
    ".jpe",
    ".gif",
    ".tif",
    ".tiff",
    ".wdp",
];

enum USER32 {
    // SystemParametersInfoW as uiAction
    SPI_GETDESKWALLPAPER = 0x0073,
    SPI_SETDESKWALLPAPER = 0x0014,
}

let queue: string[] = [];

// FFI related

function getBufferPointer(param: string, len: number) {
    const buffer = new ArrayBuffer(len);
    const u16 = new Uint16Array(buffer);

    for (let index = 0; index < u16.length; index++) {
        u16[index] = param.charCodeAt(index);
    }

    return Deno.UnsafePointer.of(u16);
}

/*function getCString(pointer: bigint) {
    const view = new Deno.UnsafePointerView(pointer);
    let x = 0;
    const arr = [];
    while (1) {
        const u16 = view.getUint16(x);
        if (u16 === 0) {
            break;
        }
        arr.push(String.fromCharCode(u16));
        x += 2;
    }
    return arr.join("");
}*/

async function setWallpaper(fileName: string) {
    const file = resolve(providedPath + "\\" + fileName);

    if (!await exists(file)) return false;

    const u32 = Deno.dlopen("user32.dll", {
        SystemParametersInfoW: {
            parameters: ["u64", "u64", "pointer", "u64"],
            result: "pointer",
        },
    });

    const len = (file.length + 1) * 2;
    const pointer = getBufferPointer(file, len);

    if (u32.symbols.SystemParametersInfoW(USER32.SPI_SETDESKWALLPAPER, len, pointer, null) === 0n) {
        u32.close();
        return false;
    }

    u32.close();
    console.log(`>> ${fileName}`);

    return true;
}

// FS related

// https://github.com/denoland/deno_std/pull/1364
async function exists(filename: string) {
    try {
        await Deno.stat(filename);
        return true;
    } catch {
        return false;
    }
}

function getImages(path: string): string[] {
    const arr = [];

    for (const dirEntry of Deno.readDirSync(path)) {
        if (!dirEntry.isFile) continue;
        const fileName = dirEntry.name.toLowerCase();
        if (supportedExtensions.find((elm) => fileName.endsWith(elm))) { //TODO: recursive tracking
            arr.push(dirEntry.name);
        }
    }

    return arr;
}

/*
TODO: watch folder for removed/added files

function watchFolder(path): void {
}*/

// Array manipulation

// Fisher Yates algorithm
function shuffle(arr: string[]) {
    let i = arr.length, r;
    while (i != 0) {
        r = Math.floor(Math.random() * i);
        i--;
        [arr[i], arr[r]] = [arr[r], arr[i]];
    }
    return arr;
}

// Swap 1st array element w/ the second
function swap(arr: string[]) {
    const secondElm = arr[1];
    arr[1] = arr[0];
    arr[0] = secondElm;
    return arr;
}

// Runtime

const main = async () => {
    if (!providedPath || !(await exists(providedPath))) {
        console.log("Error, the provided directory seems to be invalid.");
        Deno.exit(1);
    }

    let images = getImages(providedPath);

    switch (images.length) {
        case 0:
            console.log("No images detected, watching folder...");
            break;
        case 1:
            console.log("Only one image detected, skipping shuffle");
            queue = images;
            break;
        default:
            console.log(`Shuffling ${images.length} images`);
            queue = shuffle(images);
            break;
    }

    let i = 0; // current file index
    console.log("\nStarting loop\n");

    (async function loop() {
        if (queue[i]) await setWallpaper(queue[i]);

        i++;

        if (i >= queue.length) {
            images = getImages(providedPath);

            if (images.length > 1) {
                let tmp = shuffle(images);
                if (tmp[0] === queue.at(-1)) {
                    tmp = swap(tmp);
                }
                queue = tmp;
            }

            i = 0;
        }

        setTimeout(loop, providedInt * 1000);
    })();
};

// Instantly log and leave in case of a filesystem related error
try {
    main();
} catch (err) {
    console.log("Fatal Error:\n", err);
    Deno.exit(1);
}
