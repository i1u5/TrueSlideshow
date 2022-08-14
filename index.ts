import { resolve } from "https://deno.land/std@0.152.0/path/mod.ts";

const binaryWp = resolve(Deno.cwd() + "\\" + "wallpaper.exe"),
    providedPath = Deno.args[0] ? resolve(Deno.args[0]) : null,
    supportedExtensions = [
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

// https://github.com/sindresorhus/win-wallpaper/releases/latest
// TODO: compile w/ github actions
if (!await exists(binaryWp)) {
    console.log("Error, wallpaper-win binary not detected, exiting...");
    Deno.exit(1);
}

const main = async () => {
    if (!providedPath || !(await exists(providedPath))) {
        console.log("Error, the provided directory seems to be invalid.");
        Deno.exit(1);
    }

    let images = getImages(providedPath);

    switch (images.length) {
        case 0:
            console.log("No images detected, continuing to watch folder...");
            break;
        case 1:
            console.log("Only one image detected, skipping shuffle...");
            queue = images;
            break;
        default:
            console.log(`Shuffling ${images.length} images...`);
            queue = shuffle(images);
            break;
    }

    let i = 0; // current file index

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
    }, 30 * 60 * 1000); // 30 seconds
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

function immediateInterval(
    f: (...args: unknown[]) => void,
    interval: number | undefined,
) {
    f();
    return setInterval(f, interval);
}

async function setWallpaper(fileName: string) {
    const file = resolve(providedPath + "\\" + fileName);

    if (!await exists(file)) return 1;

    const process = Deno.run({
        cmd: [
            resolve(Deno.cwd() + "\\" + "wallpaper.exe"),
            file,
        ],
    });

    return (await process.status()).code;
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
