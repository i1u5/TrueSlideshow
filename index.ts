import { resolve } from "https://deno.land/std@0.152.0/path/mod.ts";

const providedPath = Deno.args[0] ? resolve(Deno.args[0]) : Deno.env.get("USERPROFILE") ? resolve(Deno.env.get("USERPROFILE") + "\\Pictures") : null;

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
    SPI_GETDESKWALLPAPER = 0x0073,
    SPI_SETDESKWALLPAPER = 0x0014,
}

let queue: string[] = [];

// https://github.com/denoland/deno_std/pull/1364
const exists = async (filename: string) => {
    try {
        await Deno.stat(filename);
        return true;
    } catch {
        return false;
    }
};

const u32 = Deno.dlopen("user32.dll", {
    SystemParametersInfoW: {
        parameters: ["u64", "u64", "pointer", "u64"],
        result: "pointer",
    },
});

function getBufferPointer(param: string) {
    const buffer = new ArrayBuffer((param.length + 1) * 2);
    const u16 = new Uint16Array(buffer);

    for (let index = 0; index < u16.length; index++) {
        u16[index] = param.charCodeAt(index);
    }

    return Deno.UnsafePointer.of(u16);
}

function getCString(pointer: bigint) {
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
}

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

    immediateInterval(async () => {
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
    }, 10000); // 10 seconds
};

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

function swap(arr: string[]) {
    const secondElm = arr[1];
    arr[1] = arr[0];
    arr[0] = secondElm;
    return arr;
}

function immediateInterval(f: (...args: unknown[]) => void, interval: number | undefined) {
    f();
    return setTimeout(f, interval);
}

async function setWallpaper(fileName: string) {

}

/*
TODO: watch folder for removed/added files

function watchFolder(path): void {
}*/

// Instantly log and leave in case of a filesystem related error
try {
    main();
} catch (err) {
    console.log("Fatal Error:\n", err);
    Deno.exit(1);
}
